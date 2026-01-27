import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export function registerUploadRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // POST /api/upload/property-image - Accepts multipart form data with 'image' field
  app.fastify.post<{ Body: any }>(
    '/api/upload/property-image',
    {
      schema: {
        description: 'Upload a property image',
        tags: ['upload'],
        consumes: ['multipart/form-data'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id },
        'Uploading property image'
      );

      try {
        const data = await request.file({ limits: { fileSize: MAX_IMAGE_SIZE } });

        if (!data) {
          app.logger.warn(
            { userId: session.user.id },
            'No file provided for upload'
          );
          return reply
            .status(400)
            .send({ error: 'No file provided' });
        }

        let buffer: Buffer;
        try {
          buffer = await data.toBuffer();
        } catch (err) {
          app.logger.warn(
            { userId: session.user.id, filename: data.filename },
            'File too large'
          );
          return reply
            .status(413)
            .send({ error: 'File too large (max 5MB for images)' });
        }

        // Generate unique key with timestamp and user ID
        const timestamp = Date.now();
        const key = `property-images/${session.user.id}/${timestamp}-${data.filename}`;

        // Upload file
        const uploadedKey = await app.storage.upload(key, buffer);

        // Get signed URL for client access
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        app.logger.info(
          { userId: session.user.id, filename: data.filename, key: uploadedKey },
          'Property image uploaded successfully'
        );

        return { url, filename: data.filename };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to upload property image'
        );
        throw error;
      }
    }
  );

  // POST /api/upload/virtual-tour-video - Accepts multipart form data with 'video' field
  app.fastify.post<{ Body: any }>(
    '/api/upload/virtual-tour-video',
    {
      schema: {
        description: 'Upload a virtual tour video',
        tags: ['upload'],
        consumes: ['multipart/form-data'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id },
        'Uploading virtual tour video'
      );

      try {
        const data = await request.file({ limits: { fileSize: MAX_VIDEO_SIZE } });

        if (!data) {
          app.logger.warn(
            { userId: session.user.id },
            'No file provided for video upload'
          );
          return reply
            .status(400)
            .send({ error: 'No file provided' });
        }

        let buffer: Buffer;
        try {
          buffer = await data.toBuffer();
        } catch (err) {
          app.logger.warn(
            { userId: session.user.id, filename: data.filename },
            'Video file too large'
          );
          return reply
            .status(413)
            .send({ error: 'File too large (max 50MB for videos)' });
        }

        // Generate unique key with timestamp and user ID
        const timestamp = Date.now();
        const key = `virtual-tour-videos/${session.user.id}/${timestamp}-${data.filename}`;

        // Upload file
        const uploadedKey = await app.storage.upload(key, buffer);

        // Get signed URL for client access
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        app.logger.info(
          { userId: session.user.id, filename: data.filename, key: uploadedKey },
          'Virtual tour video uploaded successfully'
        );

        return { url, filename: data.filename };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to upload virtual tour video'
        );
        throw error;
      }
    }
  );
}
