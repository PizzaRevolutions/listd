import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { MediaService } from './media.service.js';

const importMediaSchema = z.object({
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
});

export async function mediaRoutes(fastify: FastifyInstance) {
  // Upsert/Import Media Item into shared catalog
  fastify.post('/import', async (request, reply) => {
    const parseResult = importMediaSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }

    try {
      const mediaItem = await MediaService.upsertMediaItem(parseResult.data);
      return reply.send({ mediaItem });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  });

  // Get Media Item by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const mediaItem = await MediaService.getMediaItemById(id);

    if (!mediaItem) {
      return reply.status(404).send({ error: 'Media not found' });
    }

    return reply.send({ mediaItem });
  });
}
