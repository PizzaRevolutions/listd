import { prisma } from '../../lib/prisma.js';
import { cache } from '../../lib/redis.js';
import axios from 'axios';
import { env } from '../../config/env.js';

export interface ImportMediaInput {
  mediaType: 'MOVIE' | 'TV' | 'ANIME' | 'MANGA' | 'GAME' | 'MUSIC';
  externalSource: string;
  externalId: string;
  title: string;
  originalTitle?: string;
  releaseDate?: string;
  posterUrl?: string;
  backdropUrl?: string;
  totalUnits?: number;
  genres?: string[];
  metadata?: Record<string, any>;
  watchProviders?: Record<string, any>;
}

export class MediaService {
  /**
   * Upsert a media item into the global media_items cache
   */
  static async upsertMediaItem(input: ImportMediaInput) {
    const cacheKey = `media:${input.mediaType}:${input.externalSource}:${input.externalId}`;
    
    // Check if item exists in DB
    const existing = await prisma.mediaItem.findUnique({
      where: {
        mediaType_externalSource_externalId: {
          mediaType: input.mediaType,
          externalSource: input.externalSource,
          externalId: String(input.externalId),
        }
      }
    });

    if (existing) {
      // If item is older than 14 days and new metadata/watchProviders are provided, update
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      if (existing.updatedAt < twoWeeksAgo && input.watchProviders) {
        const updated = await prisma.mediaItem.update({
          where: { id: existing.id },
          data: {
            watchProviders: input.watchProviders ?? existing.watchProviders ?? {},
            totalUnits: input.totalUnits ?? existing.totalUnits,
            metadata: input.metadata ?? existing.metadata ?? {},
          }
        });
        await cache.set(cacheKey, JSON.stringify(updated), 86400);
        return updated;
      }
      return existing;
    }

    // Create new media item
    const created = await prisma.mediaItem.create({
      data: {
        mediaType: input.mediaType,
        externalSource: input.externalSource,
        externalId: String(input.externalId),
        title: input.title,
        originalTitle: input.originalTitle,
        releaseDate: input.releaseDate ? new Date(input.releaseDate) : null,
        posterUrl: input.posterUrl,
        backdropUrl: input.backdropUrl,
        totalUnits: input.totalUnits,
        genres: input.genres ?? [],
        metadata: input.metadata ?? {},
        watchProviders: input.watchProviders ?? {},
      }
    });

    await cache.set(cacheKey, JSON.stringify(created), 86400);
    return created;
  }

  /**
   * Get media item by ID
   */
  static async getMediaItemById(id: string) {
    return prisma.mediaItem.findUnique({
      where: { id },
    });
  }
}
