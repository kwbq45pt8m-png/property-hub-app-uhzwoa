import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, or, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { z } from 'zod';

const CreateMessageSchema = z.object({
  content: z.string().min(1),
});

export function registerChatsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/chats - Returns all chats for the authenticated user
  app.fastify.get(
    '/api/chats',
    {
      schema: {
        description:
          'Get all chats for authenticated user (both as renter and rentee)',
        tags: ['chats'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching user chats');

      try {
        const chats = await app.db.query.chats.findMany({
          where: or(
            eq(schema.chats.renterId, session.user.id),
            eq(schema.chats.renteeId, session.user.id)
          ),
          with: {
            property: {
              columns: {
                id: true,
                title: true,
                photos: true,
              },
            },
          },
        });

        app.logger.info(
          { userId: session.user.id, count: chats.length },
          'User chats retrieved'
        );
        return chats;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch chats'
        );
        throw error;
      }
    }
  );

  // GET /api/chats/:propertyId/start - Creates or gets existing chat
  app.fastify.get(
    '/api/chats/:propertyId/start',
    {
      schema: {
        description: 'Create or get existing chat with property owner',
        tags: ['chats'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const params = request.params as Record<string, string>;
      const { propertyId } = params;
      app.logger.info(
        { userId: session.user.id, propertyId },
        'Starting or getting chat'
      );

      try {
        // Get the property to find the owner
        const property = await app.db.query.properties.findFirst({
          where: eq(schema.properties.id, propertyId),
        });

        if (!property) {
          app.logger.warn({ propertyId }, 'Property not found');
          return reply.status(404).send({ error: 'Property not found' });
        }

        // Can't chat with yourself
        if (property.ownerId === session.user.id) {
          app.logger.warn(
            { userId: session.user.id, propertyId },
            'Cannot start chat with own property'
          );
          return reply
            .status(400)
            .send({ error: 'Cannot start chat with your own property' });
        }

        // Check if chat already exists
        let chat = await app.db.query.chats.findFirst({
          where: and(
            eq(schema.chats.propertyId, propertyId),
            eq(schema.chats.renterId, property.ownerId),
            eq(schema.chats.renteeId, session.user.id)
          ),
        });

        // Create chat if it doesn't exist
        if (!chat) {
          const [newChat] = await app.db
            .insert(schema.chats)
            .values({
              propertyId,
              renterId: property.ownerId,
              renteeId: session.user.id,
            })
            .returning();

          chat = newChat;
          app.logger.info(
            { chatId: chat.id, propertyId, userId: session.user.id },
            'Chat created'
          );
        } else {
          app.logger.info(
            { chatId: chat.id, propertyId, userId: session.user.id },
            'Chat retrieved'
          );
        }

        return {
          chatId: chat.id,
          propertyId: chat.propertyId,
          renterId: chat.renterId,
          renteeId: chat.renteeId,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, propertyId },
          'Failed to start or get chat'
        );
        throw error;
      }
    }
  );

  // GET /api/chats/:chatId/messages - Returns all messages for a chat
  app.fastify.get(
    '/api/chats/:chatId/messages',
    {
      schema: {
        description: 'Get all messages for a chat',
        tags: ['chats'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const params = request.params as Record<string, string>;
      const { chatId } = params;
      app.logger.info(
        { userId: session.user.id, chatId },
        'Fetching chat messages'
      );

      try {
        // Verify user is participant
        const chat = await app.db.query.chats.findFirst({
          where: eq(schema.chats.id, chatId),
        });

        if (!chat) {
          app.logger.warn({ chatId }, 'Chat not found');
          return reply.status(404).send({ error: 'Chat not found' });
        }

        if (
          chat.renterId !== session.user.id &&
          chat.renteeId !== session.user.id
        ) {
          app.logger.warn(
            { userId: session.user.id, chatId },
            'Unauthorized chat access'
          );
          return reply
            .status(403)
            .send({ error: 'Unauthorized to access this chat' });
        }

        const messages = await app.db
          .select()
          .from(schema.messages)
          .where(eq(schema.messages.chatId, chatId));

        app.logger.info(
          { chatId, count: messages.length },
          'Chat messages retrieved'
        );
        return messages;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, chatId },
          'Failed to fetch messages'
        );
        throw error;
      }
    }
  );

  // POST /api/chats/:chatId/messages - Creates message
  app.fastify.post(
    '/api/chats/:chatId/messages',
    {
      schema: {
        description: 'Send a message in a chat',
        tags: ['chats'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const params = request.params as Record<string, string>;
      const { chatId } = params;
      app.logger.info(
        { userId: session.user.id, chatId, body: request.body },
        'Creating message'
      );

      try {
        const validatedData = CreateMessageSchema.parse(request.body);

        // Verify user is participant
        const chat = await app.db.query.chats.findFirst({
          where: eq(schema.chats.id, chatId),
        });

        if (!chat) {
          app.logger.warn({ chatId }, 'Chat not found');
          return reply.status(404).send({ error: 'Chat not found' });
        }

        if (
          chat.renterId !== session.user.id &&
          chat.renteeId !== session.user.id
        ) {
          app.logger.warn(
            { userId: session.user.id, chatId },
            'Unauthorized message attempt'
          );
          return reply
            .status(403)
            .send({ error: 'Unauthorized to message in this chat' });
        }

        // Create message
        const [message] = await app.db
          .insert(schema.messages)
          .values({
            chatId,
            senderId: session.user.id,
            content: validatedData.content,
          })
          .returning();

        // Update chat's last message
        await app.db
          .update(schema.chats)
          .set({
            lastMessage: validatedData.content,
            lastMessageAt: new Date(),
          })
          .where(eq(schema.chats.id, chatId));

        app.logger.info(
          { messageId: message.id, chatId, userId: session.user.id },
          'Message created successfully'
        );
        return message;
      } catch (error) {
        if (error instanceof z.ZodError) {
          app.logger.warn(
            { err: error, chatId, body: request.body },
            'Validation failed for message'
          );
          return reply.status(400).send({ error: 'Validation failed', details: error.issues });
        }
        app.logger.error(
          { err: error, userId: session.user.id, chatId },
          'Failed to create message'
        );
        throw error;
      }
    }
  );
}
