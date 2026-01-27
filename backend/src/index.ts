import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';
import { registerPropertiesRoutes } from './routes/properties.js';
import { registerChatsRoutes } from './routes/chats.js';
import { registerUploadRoutes } from './routes/upload.js';

// Combine schemas for full database type support
const schema = { ...appSchema, ...authSchema };

// Create application with schema
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication and storage
const socialProviders: any = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  socialProviders.apple = {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
  };
}

app.withAuth({
  socialProviders,
});
app.withStorage();

// Register route modules
// IMPORTANT: Always use registration functions to avoid circular dependency issues
registerPropertiesRoutes(app);
registerChatsRoutes(app);
registerUploadRoutes(app);

await app.run();
app.logger.info('Application running');
