import type { FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

export function registerAuthRoutes(app: App) {
  // Health check for auth system
  app.fastify.get(
    '/api/auth-status',
    {
      schema: {
        description: 'Check authentication system status',
        tags: ['auth'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Auth status check');
      try {
        return { status: 'ok', message: 'Authentication system is running' };
      } catch (error) {
        app.logger.error({ err: error }, 'Auth status check failed');
        return reply.status(500).send({ status: 'error', message: 'Auth system unavailable' });
      }
    }
  );

  // Callback error handler - intercept errors from OAuth callbacks
  app.fastify.get(
    '/api/auth-error',
    {
      schema: {
        description: 'OAuth error callback handler',
        tags: ['auth'],
        querystring: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            error_description: { type: 'string' },
            error_uri: { type: 'string' },
            state: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as Record<string, string | undefined>;
      const { error, error_description, state } = query;

      app.logger.error(
        { error, error_description, state },
        'OAuth callback error received'
      );

      return reply.status(400).send({
        error: error || 'unknown_error',
        description: error_description || 'An error occurred during authentication',
      });
    }
  );

  // Session status endpoint - debug endpoint for checking current session
  app.fastify.get(
    '/api/session-status',
    {
      schema: {
        description: 'Get current session status',
        tags: ['auth'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const requireAuth = app.requireAuth();
        const session = await requireAuth(request, reply);

        if (session) {
          app.logger.info({ userId: session.user.id }, 'Session status - authenticated');
          return {
            authenticated: true,
            userId: session.user.id,
            userEmail: session.user.email,
            sessionId: session.session?.id,
          };
        } else {
          app.logger.info('Session status - not authenticated');
          return { authenticated: false };
        }
      } catch (error) {
        app.logger.error({ err: error }, 'Session status check failed');
        return { authenticated: false };
      }
    }
  );

  // Debug endpoint to list auth configuration
  app.fastify.get(
    '/api/auth-debug',
    {
      schema: {
        description: 'Debug authentication configuration (development only)',
        tags: ['auth'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Log auth configuration (sanitized)
      const debugInfo = {
        hasGoogleConfig: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        hasAppleConfig: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
        appUrl: process.env.APP_URL || 'not configured',
        environment: process.env.NODE_ENV || 'development',
        authEndpoints: {
          base: '/api/auth',
          signInWithSocial: 'POST /api/auth/sign-in/social',
          signOut: 'POST /api/auth/sign-out',
          getSession: 'GET /api/auth/get-session',
          appleCallbackPath: '/api/auth/callback/apple',
          googleCallbackPath: '/api/auth/callback/google',
        },
        troubleshootingTips: {
          appleOAuthNotWorking: 'Check that APPLE_CLIENT_ID and APPLE_CLIENT_SECRET are set or APP_URL is configured',
          sessionNotCreated: 'Verify database is accessible and auth schema is migrated',
          callbackFailing: 'Check logs in /api/auth/callback/apple endpoint',
          debugSession: 'Use /api/session-status endpoint to check current session',
        },
      };

      app.logger.info(debugInfo, 'Auth debug info requested');
      return debugInfo;
    }
  );

  // Advanced OAuth troubleshooting endpoint
  app.fastify.post(
    '/api/auth-test',
    {
      schema: {
        description: 'Test authentication system (development only)',
        tags: ['auth'],
        body: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['test_database', 'test_session', 'test_oauth_flow'],
            },
            provider: {
              type: 'string',
              enum: ['apple', 'google'],
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as Record<string, any>;
      const { action, provider } = body;

      app.logger.info({ action, provider }, 'Auth test requested');

      try {
        if (action === 'test_database') {
          // Test database connection
          const testUser = await app.db.query.user.findFirst();
          return {
            status: 'ok',
            message: 'Database connection successful',
            usersInDatabase: !!testUser,
          };
        }

        if (action === 'test_session') {
          // Test session creation
          const requireAuth = app.requireAuth();
          const session = await requireAuth(request, reply);

          if (session) {
            return {
              status: 'ok',
              message: 'Session exists',
              userId: session.user.id,
            };
          } else {
            return {
              status: 'no_session',
              message: 'No active session',
            };
          }
        }

        if (action === 'test_oauth_flow') {
          const hasConfig = provider === 'apple'
            ? !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET)
            : !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

          return {
            status: hasConfig ? 'ok' : 'missing_config',
            message: hasConfig
              ? `${provider} OAuth credentials are configured`
              : `${provider} OAuth credentials are missing`,
            requiresConfiguration: !hasConfig,
          };
        }

        return reply.status(400).send({ error: 'Invalid action' });
      } catch (error) {
        app.logger.error({ err: error, action }, 'Auth test failed');
        return reply.status(500).send({
          error: 'test_failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Apple OAuth callback handler with explicit error logging
  app.fastify.get(
    '/api/auth/callback/apple',
    {
      schema: {
        description: 'Apple OAuth callback handler',
        tags: ['auth'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as Record<string, string | undefined>;
      const { code, state, error } = query;

      if (error) {
        app.logger.error(
          { error, state },
          'Apple OAuth callback error'
        );
        return reply.status(400).send({
          error: 'apple_oauth_error',
          message: error,
        });
      }

      if (!code) {
        app.logger.warn({ state }, 'Apple OAuth callback missing authorization code');
        return reply.status(400).send({
          error: 'invalid_request',
          message: 'Missing authorization code',
        });
      }

      app.logger.info(
        { codeLength: code.length, state },
        'Apple OAuth callback received with authorization code'
      );

      // Let Better Auth handle the actual exchange
      // This endpoint just logs the callback for debugging
      return { status: 'processing' };
    }
  );
}
