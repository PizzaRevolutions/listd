import fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env.js';
import { setupAuth } from './plugins/auth.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { mediaRoutes } from './modules/media/media.routes.js';
import { libraryRoutes } from './modules/library/library.routes.js';
import { socialRoutes } from './modules/social/social.routes.js';
import { messageRoutes } from './modules/messages/messages.routes.js';
import { initWebSocketServer } from './websocket/socket.js';

export async function buildApp() {
  const app = fastify({
    logger: env.NODE_ENV === 'development' ? {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    } : true,
  });

  // Setup CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Setup JWT Authentication
  await setupAuth(app);

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register API modules
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(mediaRoutes, { prefix: '/api/media' });
  await app.register(libraryRoutes, { prefix: '/api/library' });
  await app.register(socialRoutes, { prefix: '/api/social' });
  await app.register(messageRoutes, { prefix: '/api/messages' });

  return app;
}

async function start() {
  const app = await buildApp();

  try {
    // Wait until Fastify is ready so its underlying raw Node HTTP server is initialized
    await app.ready();

    // Initialize Socket.io attached to Fastify's raw HTTP server
    initWebSocketServer(app.server);

    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 [Server] Listd backend running on http://0.0.0.0:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Auto start if executed directly
if (process.env.NODE_ENV !== 'test') {
  start();
}
