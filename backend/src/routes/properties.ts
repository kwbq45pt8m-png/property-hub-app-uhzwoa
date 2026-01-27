import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gte, lte, ilike } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { z } from 'zod';

const CreatePropertySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.string().or(z.number()),
  size: z.number().min(1),
  district: z.enum([
    'Central and Western',
    'Eastern',
    'Southern',
    'Wan Chai',
    'Sham Shui Po',
    'Kowloon City',
    'Kwun Tong',
    'Wong Tai Sin',
    'Yau Tsim Mong',
    'Islands',
    'Kwai Tsing',
    'North',
    'Sai Kung',
    'Sha Tin',
    'Tai Po',
    'Tsuen Wan',
    'Tuen Mun',
    'Yuen Long',
  ]),
  equipment: z.string().optional(),
  photos: z.array(z.string()).optional(),
  virtualTourUrl: z.string().optional(),
});

const UpdatePropertySchema = CreatePropertySchema.partial();

export function registerPropertiesRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/properties - Returns all properties with filters
  app.fastify.get(
    '/api/properties',
    {
      schema: {
        description: 'Get all properties with optional filters',
        tags: ['properties'],
        querystring: {
          type: 'object',
          properties: {
            district: { type: 'string' },
            minPrice: { type: 'string' },
            maxPrice: { type: 'string' },
            minSize: { type: 'string' },
            maxSize: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as Record<string, string | undefined>;
      const { district, minPrice, maxPrice, minSize, maxSize } = query;
      app.logger.info(
        { query: request.query },
        'Fetching properties with filters'
      );

      try {
        const conditions: any[] = [];

        const validDistricts = [
          'Central and Western',
          'Eastern',
          'Southern',
          'Wan Chai',
          'Sham Shui Po',
          'Kowloon City',
          'Kwun Tong',
          'Wong Tai Sin',
          'Yau Tsim Mong',
          'Islands',
          'Kwai Tsing',
          'North',
          'Sai Kung',
          'Sha Tin',
          'Tai Po',
          'Tsuen Wan',
          'Tuen Mun',
          'Yuen Long',
        ];

        if (district && validDistricts.includes(district)) {
          conditions.push(eq(schema.properties.district, district as any));
        }
        if (minPrice) {
          conditions.push(gte(schema.properties.price, minPrice));
        }
        if (maxPrice) {
          conditions.push(lte(schema.properties.price, maxPrice));
        }
        if (minSize) {
          conditions.push(gte(schema.properties.size, parseInt(minSize)));
        }
        if (maxSize) {
          conditions.push(lte(schema.properties.size, parseInt(maxSize)));
        }

        let dbQuery: any = app.db.select().from(schema.properties);

        if (conditions.length > 0) {
          dbQuery = dbQuery.where(and(...conditions));
        }

        const properties = await dbQuery;
        app.logger.info({ count: properties.length }, 'Properties fetched');
        return properties;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch properties');
        throw error;
      }
    }
  );

  // GET /api/properties/:id - Returns single property details
  app.fastify.get(
    '/api/properties/:id',
    {
      schema: {
        description: 'Get property details by ID',
        tags: ['properties'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as Record<string, string>;
      const { id } = params;
      app.logger.info({ propertyId: id }, 'Fetching property details');

      try {
        const property = await app.db.query.properties.findFirst({
          where: eq(schema.properties.id, id),
        });

        if (!property) {
          app.logger.warn({ propertyId: id }, 'Property not found');
          return reply.status(404).send({ error: 'Property not found' });
        }

        app.logger.info({ propertyId: id }, 'Property details retrieved');
        return property;
      } catch (error) {
        app.logger.error({ err: error, propertyId: id }, 'Failed to fetch property');
        throw error;
      }
    }
  );

  // POST /api/properties - Creates property with ownerId from authenticated user
  app.fastify.post<{ Body: any }>(
    '/api/properties',
    {
      schema: {
        description: 'Create a new property',
        tags: ['properties'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info(
        { userId: session.user.id, body: request.body },
        'Creating property'
      );

      try {
        const validatedData = CreatePropertySchema.parse(request.body);

        const [property] = await app.db
          .insert(schema.properties)
          .values({
            title: validatedData.title,
            description: validatedData.description,
            price: validatedData.price.toString(),
            size: validatedData.size,
            district: validatedData.district,
            equipment: validatedData.equipment,
            photos: validatedData.photos || [],
            virtualTourUrl: validatedData.virtualTourUrl,
            ownerId: session.user.id,
          })
          .returning();

        app.logger.info(
          { propertyId: property.id, userId: session.user.id },
          'Property created successfully'
        );
        return property;
      } catch (error) {
        if (error instanceof z.ZodError) {
          app.logger.warn(
            { err: error, body: request.body },
            'Validation failed for property creation'
          );
          return reply.status(400).send({ error: 'Validation failed', details: error.issues });
        }
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to create property'
        );
        throw error;
      }
    }
  );

  // PUT /api/properties/:id - Updates property ONLY IF property.ownerId matches authenticated user
  app.fastify.put(
    '/api/properties/:id',
    {
      schema: {
        description: 'Update a property',
        tags: ['properties'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const params = request.params as Record<string, string>;
      const { id } = params;
      app.logger.info(
        { propertyId: id, userId: session.user.id, body: request.body },
        'Updating property'
      );

      try {
        const property = await app.db.query.properties.findFirst({
          where: eq(schema.properties.id, id),
        });

        if (!property) {
          app.logger.warn({ propertyId: id }, 'Property not found');
          return reply.status(404).send({ error: 'Property not found' });
        }

        if (property.ownerId !== session.user.id) {
          app.logger.warn(
            { propertyId: id, userId: session.user.id, ownerId: property.ownerId },
            'Unauthorized property update attempt'
          );
          return reply
            .status(403)
            .send({ error: 'Unauthorized to update this property' });
        }

        const validatedData = UpdatePropertySchema.parse(request.body);
        const updateData: any = {};

        if (validatedData.title !== undefined) updateData.title = validatedData.title;
        if (validatedData.description !== undefined) updateData.description = validatedData.description;
        if (validatedData.price !== undefined) updateData.price = validatedData.price.toString();
        if (validatedData.size !== undefined) updateData.size = validatedData.size;
        if (validatedData.district !== undefined) updateData.district = validatedData.district;
        if (validatedData.equipment !== undefined) updateData.equipment = validatedData.equipment;
        if (validatedData.photos !== undefined) updateData.photos = validatedData.photos;
        if (validatedData.virtualTourUrl !== undefined) updateData.virtualTourUrl = validatedData.virtualTourUrl;

        const [updated] = await app.db
          .update(schema.properties)
          .set(updateData)
          .where(eq(schema.properties.id, id))
          .returning();

        app.logger.info(
          { propertyId: id, userId: session.user.id },
          'Property updated successfully'
        );
        return updated;
      } catch (error) {
        if (error instanceof z.ZodError) {
          app.logger.warn(
            { err: error, propertyId: id },
            'Validation failed for property update'
          );
          return reply.status(400).send({ error: 'Validation failed', details: error.issues });
        }
        app.logger.error(
          { err: error, propertyId: id, userId: session.user.id },
          'Failed to update property'
        );
        throw error;
      }
    }
  );

  // DELETE /api/properties/:id - Deletes property ONLY IF property.ownerId matches authenticated user
  app.fastify.delete(
    '/api/properties/:id',
    {
      schema: {
        description: 'Delete a property',
        tags: ['properties'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const params = request.params as Record<string, string>;
      const { id } = params;
      app.logger.info(
        { propertyId: id, userId: session.user.id },
        'Deleting property'
      );

      try {
        const property = await app.db.query.properties.findFirst({
          where: eq(schema.properties.id, id),
        });

        if (!property) {
          app.logger.warn({ propertyId: id }, 'Property not found');
          return reply.status(404).send({ error: 'Property not found' });
        }

        if (property.ownerId !== session.user.id) {
          app.logger.warn(
            { propertyId: id, userId: session.user.id, ownerId: property.ownerId },
            'Unauthorized property deletion attempt'
          );
          return reply
            .status(403)
            .send({ error: 'Unauthorized to delete this property' });
        }

        await app.db
          .delete(schema.properties)
          .where(eq(schema.properties.id, id));

        app.logger.info(
          { propertyId: id, userId: session.user.id },
          'Property deleted successfully'
        );
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, propertyId: id, userId: session.user.id },
          'Failed to delete property'
        );
        throw error;
      }
    }
  );

  // GET /api/properties/my-listings - Returns properties owned by the authenticated user
  app.fastify.get(
    '/api/my-listings',
    {
      schema: {
        description: 'Get properties owned by authenticated user',
        tags: ['properties'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching user listings');

      try {
        const properties = await app.db
          .select()
          .from(schema.properties)
          .where(eq(schema.properties.ownerId, session.user.id));

        app.logger.info(
          { userId: session.user.id, count: properties.length },
          'User listings retrieved'
        );
        return properties;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch user listings'
        );
        throw error;
      }
    }
  );
}
