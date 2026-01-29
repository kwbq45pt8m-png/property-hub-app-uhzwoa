import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

// Helper to format bytes to human readable size
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function registerUploadRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // Log upload configuration on initialization
  app.logger.info(
    {
      maxImageSize: formatBytes(MAX_IMAGE_SIZE),
      maxVideoSize: formatBytes(MAX_VIDEO_SIZE),
    },
    'Upload endpoints configured'
  );

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
        let data;
        try {
          data = await request.file({ limits: { fileSize: MAX_IMAGE_SIZE } });
        } catch (err: any) {
          // Handle file size limit errors from Fastify
          if (err.code === 'FST_REQ_FILE_TOO_LARGE' || err.message?.includes('too large')) {
            app.logger.warn(
              { userId: session.user.id, error: err.message },
              'Image file exceeds size limit'
            );
            return reply.status(413).send({
              error: 'file_too_large',
              message: `Image file exceeds maximum size of ${formatBytes(MAX_IMAGE_SIZE)}`,
              maxSize: MAX_IMAGE_SIZE,
              maxSizeFormatted: formatBytes(MAX_IMAGE_SIZE),
            });
          }
          throw err;
        }

        if (!data) {
          app.logger.warn(
            { userId: session.user.id },
            'No file provided for upload'
          );
          return reply
            .status(400)
            .send({
              error: 'no_file',
              message: 'No file provided. Please attach an image file.',
            });
        }

        let buffer: Buffer;
        try {
          buffer = await data.toBuffer();
        } catch (err: any) {
          app.logger.warn(
            { userId: session.user.id, filename: data.filename, error: err.message },
            'Failed to read image file'
          );
          return reply.status(413).send({
            error: 'file_too_large',
            message: `Image file exceeds maximum size of ${formatBytes(MAX_IMAGE_SIZE)}`,
            maxSize: MAX_IMAGE_SIZE,
            maxSizeFormatted: formatBytes(MAX_IMAGE_SIZE),
          });
        }

        // Generate unique key with timestamp and user ID
        const timestamp = Date.now();
        const key = `property-images/${session.user.id}/${timestamp}-${data.filename}`;

        // Upload file
        const uploadedKey = await app.storage.upload(key, buffer);

        app.logger.info(
          { userId: session.user.id, filename: data.filename, key: uploadedKey },
          'Property image uploaded successfully'
        );

        // Return the S3 key instead of signed URL
        // Signed URLs will be generated on retrieval to avoid expiration
        return { key: uploadedKey, filename: data.filename };
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
        let data;
        try {
          data = await request.file({ limits: { fileSize: MAX_VIDEO_SIZE } });
        } catch (err: any) {
          // Handle file size limit errors from Fastify
          if (err.code === 'FST_REQ_FILE_TOO_LARGE' || err.message?.includes('too large')) {
            app.logger.warn(
              { userId: session.user.id, error: err.message },
              'Video file exceeds size limit'
            );
            return reply.status(413).send({
              error: 'file_too_large',
              message: `Video file exceeds maximum size of ${formatBytes(MAX_VIDEO_SIZE)}`,
              maxSize: MAX_VIDEO_SIZE,
              maxSizeFormatted: formatBytes(MAX_VIDEO_SIZE),
            });
          }
          throw err;
        }

        if (!data) {
          app.logger.warn(
            { userId: session.user.id },
            'No file provided for video upload'
          );
          return reply.status(400).send({
            error: 'no_file',
            message: 'No file provided. Please attach a video file.',
          });
        }

        let buffer: Buffer;
        try {
          buffer = await data.toBuffer();
        } catch (err: any) {
          app.logger.warn(
            { userId: session.user.id, filename: data.filename, error: err.message },
            'Failed to read video file'
          );
          return reply.status(413).send({
            error: 'file_too_large',
            message: `Video file exceeds maximum size of ${formatBytes(MAX_VIDEO_SIZE)}`,
            maxSize: MAX_VIDEO_SIZE,
            maxSizeFormatted: formatBytes(MAX_VIDEO_SIZE),
          });
        }

        // Generate unique key with timestamp and user ID
        const timestamp = Date.now();
        const key = `virtual-tour-videos/${session.user.id}/${timestamp}-${data.filename}`;

        // Upload file
        const uploadedKey = await app.storage.upload(key, buffer);

        app.logger.info(
          { userId: session.user.id, filename: data.filename, key: uploadedKey },
          'Virtual tour video uploaded successfully'
        );

        // Return the S3 key instead of signed URL
        // Signed URLs will be generated on retrieval to avoid expiration
        return { key: uploadedKey, filename: data.filename };
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
