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

// Configure Better Auth with proper error handling and Apple OAuth support
const authConfig: any = {
  // Ensure proper session handling for OAuth flows
  sessionConfig: {
    absoluteSessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
    inactiveSessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    updateAge: 24 * 60 * 60 * 1000, // Update session every 24 hours
  },
  callbacks: {
    onError: async (ctx: any) => {
      app.logger.error(
        { error: ctx.error, path: ctx.path, provider: ctx.provider },
        'Authentication error occurred during OAuth flow'
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

// Only add socialProviders if custom credentials are provided
if (Object.keys(socialProviders).length > 0) {
  authConfig.socialProviders = socialProviders;
}

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
