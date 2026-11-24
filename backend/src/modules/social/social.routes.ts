import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

export async function socialRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // List friends
  fastify.get('/friends', async (request, reply) => {
    const userId = request.user.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
      include: {
        requester: {
          select: { id: true, username: true, avatarUrl: true, bio: true }
        },
        addressee: {
          select: { id: true, username: true, avatarUrl: true, bio: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const friends = friendships.map(f => {
      const isRequester = f.requesterId === userId;
      const friendUser = isRequester ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        status: f.status,
        isOutgoingRequest: isRequester && f.status === 'PENDING',
        isIncomingRequest: !isRequester && f.status === 'PENDING',
        user: friendUser,
      };
    });

    return reply.send({ friends });
  });

  // Send friend request by username
  fastify.post('/friends/request', async (request, reply) => {
    const userId = request.user.id;
    const bodySchema = z.object({ username: z.string().min(1) });
    const parseResult = bodySchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }

    const targetUser = await prisma.user.findUnique({
      where: { username: parseResult.data.username.toLowerCase() }
    });

    if (!targetUser) {
      return reply.status(404).send({ error: 'User not found' });
    }

    if (targetUser.id === userId) {
      return reply.status(400).send({ error: 'Bad Request', message: 'You cannot add yourself as a friend' });
    }

    // Check existing friendship
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetUser.id },
          { requesterId: targetUser.id, addresseeId: userId },
        ]
      }
    });

    if (existing) {
      return reply.status(409).send({ error: 'Conflict', message: 'Friend request already exists or you are already friends' });
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId: userId,
        addresseeId: targetUser.id,
        status: 'PENDING',
      },
      include: {
        addressee: {
          select: { id: true, username: true, avatarUrl: true }
        }
      }
    });

    return reply.status(201).send({ friendship });
  });

  // Accept or decline friend request
  fastify.patch('/friends/:id', async (request, reply) => {
    const userId = request.user.id;
    const { id } = request.params as { id: string };
    const schema = z.object({ action: z.enum(['ACCEPT', 'DECLINE', 'BLOCK']) });
    const parseResult = schema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.format() });
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id }
    });

    if (!friendship || (friendship.addresseeId !== userId && friendship.requesterId !== userId)) {
      return reply.status(404).send({ error: 'Friendship not found' });
    }

    if (parseResult.data.action === 'DECLINE') {
      await prisma.friendship.delete({ where: { id } });
      return reply.send({ success: true, message: 'Friend request removed' });
    }

    const updated = await prisma.friendship.update({
      where: { id },
      data: {
        status: parseResult.data.action === 'ACCEPT' ? 'ACCEPTED' : 'BLOCKED',
      }
    });

    return reply.send({ friendship: updated });
  });

  /**
   * Library Comparison Engine ("Friend Diff")
   * Returns items the friend completed or has in progress, which the current user hasn't consumed yet
   */
  fastify.get('/compare/:friendId', async (request, reply) => {
    const currentUserId = request.user.id;
    const { friendId } = request.params as { friendId: string };
    const { mediaType } = request.query as { mediaType?: string };

    const friend = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, username: true, avatarUrl: true }
    });

    if (!friend) {
      return reply.status(404).send({ error: 'Friend not found' });
    }

    // Get friend's items
    const friendItems = await prisma.userLibraryItem.findMany({
      where: {
        userId: friendId,
        status: { in: ['COMPLETED', 'IN_PROGRESS'] },
        ...(mediaType ? { mediaItem: { mediaType: mediaType as any } } : {})
      },
      include: {
        mediaItem: true,
      },
      orderBy: [
        { rating: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    // Get current user's items for comparison
    const currentUserItems = await prisma.userLibraryItem.findMany({
      where: { userId: currentUserId },
      select: { mediaItemId: true, status: true, rating: true }
    });

    const userMap = new Map(currentUserItems.map(item => [item.mediaItemId, item]));

    // Find difference: items the friend has that the user doesn't have or only has in plan_to_consume
    const recommendations = friendItems.filter(fItem => {
      const myItem = userMap.get(fItem.mediaItemId);
      return !myItem || myItem.status === 'PLAN_TO_CONSUME';
    }).map(fItem => {
      const myItem = userMap.get(fItem.mediaItemId);
      return {
        mediaItem: fItem.mediaItem,
        friendStatus: fItem.status,
        friendRating: fItem.rating,
        myStatus: myItem ? myItem.status : 'NOT_IN_LIBRARY',
        myRating: myItem ? myItem.rating : null,
      };
    });

    // Also calculate similarity score: items both completed with high rating
    let sharedCount = 0;
    friendItems.forEach(fItem => {
      const myItem = userMap.get(fItem.mediaItemId);
      if (myItem && myItem.status === 'COMPLETED') {
        sharedCount++;
      }
    });

    return reply.send({
      friend,
      totalFriendItems: friendItems.length,
      sharedCompletedCount: sharedCount,
      comparisonList: recommendations,
    });
  });

  /**
   * Recommendation Engine
   * Returns suggestions based on user's highest rated genres + top friends favorites
   */
  fastify.get('/recommendations', async (request, reply) => {
    const userId = request.user.id;

    // 1. Get user's top-rated items (rating >= 7.5 or completed)
    const userFavorites = await prisma.userLibraryItem.findMany({
      where: {
        userId,
        OR: [
          { rating: { gte: 7.5 } },
          { status: 'COMPLETED' }
        ]
      },
      include: { mediaItem: true },
      take: 20
    });

    // Extract top genres
    const genreCount: Record<string, number> = {};
    userFavorites.forEach(f => {
      f.mediaItem.genres.forEach(g => {
        genreCount[g] = (genreCount[g] || 0) + 1;
      });
    });

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([g]) => g);

    // 2. Fetch candidates from global media_items that match top genres and are NOT in user's library
    const userMediaIds = (await prisma.userLibraryItem.findMany({
      where: { userId },
      select: { mediaItemId: true }
    })).map(i => i.mediaItemId);

    const contentRecommendations = await prisma.mediaItem.findMany({
      where: {
        id: { notIn: userMediaIds },
        genres: { hasSome: topGenres }
      },
      take: 12,
      orderBy: { createdAt: 'desc' }
    });

    return reply.send({
      topGenres,
      recommendations: contentRecommendations
    });
  });
}
