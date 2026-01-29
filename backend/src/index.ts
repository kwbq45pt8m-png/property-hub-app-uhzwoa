import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';
import { registerPropertiesRoutes } from './routes/properties.js';
import { registerChatsRoutes } from './routes/chats.js';
import { registerUploadRoutes } from './routes/upload.js';
import { registerAuthRoutes } from './routes/auth.js';

// Combine schemas for full database type support
const schema = { ...appSchema, ...authSchema };

// Create application with schema
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Configure Fastify to handle larger file uploads
// Set body size limit to 200MB (209715200 bytes) for images and videos
const MAX_BODY_SIZE = 209715200; // 200MB in bytes

app.logger.info(
  { maxBodySize: MAX_BODY_SIZE, maxBodySizeMB: MAX_BODY_SIZE / (1024 * 1024) },
  'File upload size limit configured'
);

// Add global error handler for authentication requests
app.fastify.setErrorHandler(async (error: any, request, reply) => {
  const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : 500;
  const code = typeof error?.code === 'string' ? error.code : 'error';
  const message = typeof error?.message === 'string' ? error.message : 'An error occurred';

  app.logger.error(
    {
      err: error,
      path: request.url,
      method: request.method,
      statusCode,
    },
    'Request error'
  );

  return reply.status(statusCode).send({
    error: code,
    message,
  });
});

// Enable authentication and storage
// By default, use the proxy-based OAuth (Google, Apple, etc.)
// If custom credentials are provided via environment variables, use them instead
const socialProviders: any = {};

// Check if custom Google credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  app.logger.info('Using custom Google OAuth credentials');
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
} else {
  app.logger.info('Using proxy-based Google OAuth');
}

// Check if custom Apple credentials are provided
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  app.logger.info('Using custom Apple OAuth credentials');
  socialProviders.apple = {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
  };
} else {
  app.logger.info('Using proxy-based Apple OAuth');
}

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';
const appUrl = process.env.APP_URL || 'http://localhost:3000';
const apiUrl = process.env.API_URL || 'http://localhost:5000';

// Configure Better Auth with comprehensive settings
const authConfig: any = {
  // Set base URL for auth endpoints
  baseURL: apiUrl,

  // Configure trusted origins for CORS
  trustedOrigins: [
    appUrl,
    apiUrl,
    ...(process.env.TRUSTED_ORIGINS ? process.env.TRUSTED_ORIGINS.split(',') : []),
  ],

  // Enable email/password authentication
  emailAndPassword: {
    enabled: true,
  },

  // Ensure proper session handling for OAuth flows
  sessionConfig: {
    absoluteSessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
    inactiveSessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    updateAge: 24 * 60 * 60 * 1000, // Update session every 24 hours
  },

  // Configure cookies
  session: {
    cookieOptions: {
      secure: isProduction, // Use secure cookies in production
      httpOnly: true, // Prevent JavaScript access
      sameSite: 'lax', // Allow cross-site cookie submission
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    },
  },

  callbacks: {
    onError: async (ctx: any) => {
      app.logger.error(
        {
          error: ctx.error?.message,
          code: ctx.error?.code,
          path: ctx.path,
          provider: ctx.provider,
          status: ctx.error?.status,
        },
        'Authentication error occurred'
      );
      // Return a proper error response
      return {
        status: 400,
        body: {
          error: 'authentication_failed',
          message: 'An error occurred during authentication. Please try again.',
          details: process.env.NODE_ENV === 'development' ? ctx.error?.message : undefined,
        },
      };
    },
    async onSuccess(ctx: any) {
      app.logger.info(
        { userId: ctx.user?.id, email: ctx.user?.email, path: ctx.path, provider: ctx.provider },
        'User authenticated successfully'
      );
      return ctx;
    },
  },
};

// Add social providers
authConfig.socialProviders = socialProviders;

// Log auth configuration
app.logger.info(
  {
    baseURL: authConfig.baseURL,
    trustedOrigins: authConfig.trustedOrigins,
    emailEnabled: authConfig.emailAndPassword?.enabled,
    googleEnabled: !!authConfig.socialProviders.google,
    appleEnabled: !!authConfig.socialProviders.apple,
    secure: authConfig.session?.cookieOptions?.secure,
  },
  'Authentication configured'
);

app.withAuth(authConfig);
app.withStorage();

// Register route modules
// IMPORTANT: Always use registration functions to avoid circular dependency issues
registerAuthRoutes(app);
registerPropertiesRoutes(app);
registerChatsRoutes(app);
registerUploadRoutes(app);

await app.run();
app.logger.info('Application running');
