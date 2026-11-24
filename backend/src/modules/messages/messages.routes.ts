import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { MediaService, ImportMediaInput } from '../media/media.service.js';
import { getSocketServer } from '../../websocket/socket.js';

const sendMessageSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  mediaItemId: z.string().uuid().optional(),
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
  }).optional(),
});

export async function messageRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // Get message history with a friend
  fastify.get('/:friendId', async (request, reply) => {
    const userId = request.user.id;
    const { friendId } = request.params as { friendId: string };

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ]
      },
      include: {
        mediaItem: true,
        sender: {
          select: { id: true, username: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Mark unread messages as read
    await prisma.directMessage.updateMany({
      where: {
        senderId: friendId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true }
    });

    return reply.send({ messages });
  });

  // Send a message (with optional media recommendation card)
  fastify.post('/', async (request, reply) => {
    const senderId = request.user.id;
    const parseResult = sendMessageSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }

    const { receiverId, content, mediaItemId: providedMediaId, mediaItem: rawMediaItem } = parseResult.data;

    let targetMediaId = providedMediaId;

    // If mediaItem object is passed directly, upsert it first
    if (!targetMediaId && rawMediaItem) {
      const savedMedia = await MediaService.upsertMediaItem(rawMediaItem as ImportMediaInput);
      targetMediaId = savedMedia.id;
    }

    const message = await prisma.directMessage.create({
      data: {
        senderId,
        receiverId,
        content,
        mediaItemId: targetMediaId,
      },
      include: {
        mediaItem: true,
        sender: {
          select: { id: true, username: true, avatarUrl: true }
        }
      }
    });

    // Notify receiver via WebSocket if online
    try {
      const io = getSocketServer();
      if (io) {
        io.to(`user:${receiverId}`).emit('new_message', message);
      }
    } catch (e) {
      // socket error shouldn't fail HTTP request
    }

    return reply.status(201).send({ message });
  });
}
