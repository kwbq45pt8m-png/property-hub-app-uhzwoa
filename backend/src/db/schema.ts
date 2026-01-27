import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth-schema.js';

// Properties table
export const properties = pgTable(
  'properties',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    size: integer('size').notNull(), // in square feet
    district: text('district', {
      enum: [
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
      ],
    }).notNull(),
    equipment: text('equipment'), // comma-separated list
    photos: jsonb('photos').$type<string[]>(), // array of photo URLs
    virtualTourUrl: text('virtual_tour_url'),
    ownerId: text('owner_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('properties_owner_id_idx').on(table.ownerId), index('properties_district_idx').on(table.district)]
);

// Chats table
export const chats = pgTable(
  'chats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    renterId: text('renter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    renteeId: text('rentee_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    lastMessage: text('last_message'),
    lastMessageAt: timestamp('last_message_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('chats_property_id_idx').on(table.propertyId),
    index('chats_renter_id_idx').on(table.renterId),
    index('chats_rentee_id_idx').on(table.renteeId),
  ]
);

// Messages table
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('messages_chat_id_idx').on(table.chatId),
    index('messages_sender_id_idx').on(table.senderId),
  ]
);

// Relations
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(user, {
    fields: [properties.ownerId],
    references: [user.id],
  }),
  chats: many(chats),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  property: one(properties, {
    fields: [chats.propertyId],
    references: [properties.id],
  }),
  renter: one(user, {
    fields: [chats.renterId],
    references: [user.id],
  }),
  rentee: one(user, {
    fields: [chats.renteeId],
    references: [user.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  sender: one(user, {
    fields: [messages.senderId],
    references: [user.id],
  }),
}));
