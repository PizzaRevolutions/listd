import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { MediaService, ImportMediaInput } from '../media/media.service.js';

const addToLibrarySchema = z.object({
  mediaItem: z.object({
    mediaType: z.enum(['MOVIE', 'TV', 'ANIME', 'MANGA', 'GAME', 'MUSIC']),
    externalSource: z.string().min(1),
    externalId: z.string().min(1),
    title: z.string().min(1),
    originalTitle: z.string().optional(),
    releaseDate: z.string().optional(),
    posterUrl: z.string().optional(),
    backdropUrl: z.string().optional(),
    totalUnits: z.number().int().nonnegative().optional(),
    genres: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
    watchProviders: z.record(z.any()).optional(),
  }),
  status: z.enum(['PLAN_TO_CONSUME', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'DROPPED']).default('PLAN_TO_CONSUME'),
  rating: z.number().min(0).max(10).optional(),
  progressUnits: z.number().int().nonnegative().default(0),
  customPlatform: z.string().max(64).optional(),
  notes: z.string().max(2000).optional(),
});

const updateLibrarySchema = z.object({
  status: z.enum(['PLAN_TO_CONSUME', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'DROPPED']).optional(),
  rating: z.number().min(0).max(10).nullable().optional(),
  progressUnits: z.number().int().nonnegative().optional(),
  repeatCount: z.number().int().nonnegative().optional(),
  customPlatform: z.string().max(64).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function libraryRoutes(fastify: FastifyInstance) {
  // All library routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Get user library with filters
  fastify.get('/', async (request, reply) => {
    const userId = request.user.id;
    const { mediaType, status, search } = request.query as {
      mediaType?: string;
      status?: string;
      search?: string;
    };

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (mediaType || search) {
      where.mediaItem = {};
      if (mediaType) {
        where.mediaItem.mediaType = mediaType;
      }
      if (search) {
        where.mediaItem.title = {
          contains: search,
          mode: 'insensitive',
        };
      }
    }

    const items = await prisma.userLibraryItem.findMany({
      where,
      include: {
        mediaItem: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return reply.send({ items });
  });

  // Add or upsert media item to user's library
  fastify.post('/', async (request, reply) => {
    const userId = request.user.id;
    const parseResult = addToLibrarySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }

    const { mediaItem: mediaItemInput, status, rating, progressUnits, customPlatform, notes } = parseResult.data;

    // 1. Ensure MediaItem exists in shared catalog
    const mediaItem = await MediaService.upsertMediaItem(mediaItemInput as ImportMediaInput);

    // 2. Upsert UserLibraryItem
    const libraryEntry = await prisma.userLibraryItem.upsert({
      where: {
        userId_mediaItemId: {
          userId,
          mediaItemId: mediaItem.id,
        }
      },
      create: {
        userId,
        mediaItemId: mediaItem.id,
        status,
        rating,
        progressUnits,
        customPlatform,
        notes,
        startedAt: status === 'IN_PROGRESS' ? new Date() : null,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
      update: {
        status,
        rating,
        progressUnits,
        customPlatform,
        notes,
        startedAt: status === 'IN_PROGRESS' ? new Date() : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        mediaItem: true,
      }
    });

    return reply.status(201).send({ libraryEntry });
  });

  // Update specific library item (e.g. increment episode/chapter, update rating)
  fastify.patch('/:id', async (request, reply) => {
    const userId = request.user.id;
    const { id } = request.params as { id: string };

    const parseResult = updateLibrarySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }

    const existing = await prisma.userLibraryItem.findFirst({
      where: { id, userId },
      include: { mediaItem: true }
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Library entry not found' });
    }

    const data: any = { ...parseResult.data };
    
    // Auto mark as completed if progress equals totalUnits
    if (
      data.progressUnits !== undefined &&
      existing.mediaItem.totalUnits &&
      data.progressUnits >= existing.mediaItem.totalUnits &&
      !data.status
    ) {
      data.status = 'COMPLETED';
      data.completedAt = new Date();
    } else if (data.status === 'COMPLETED' && !existing.completedAt) {
      data.completedAt = new Date();
    }

    const updated = await prisma.userLibraryItem.update({
      where: { id },
      data,
      include: {
        mediaItem: true,
      }
    });

    return reply.send({ libraryEntry: updated });
  });

  // Delete item from library
  fastify.delete('/:id', async (request, reply) => {
    const userId = request.user.id;
    const { id } = request.params as { id: string };

    const existing = await prisma.userLibraryItem.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Library entry not found' });
    }

    await prisma.userLibraryItem.delete({
      where: { id }
    });

    return reply.send({ success: true, message: 'Item removed from library' });
  });
}
