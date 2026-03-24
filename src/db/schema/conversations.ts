import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { workspaces } from "./workspaces";

export const channelCategories = pgTable("channel_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  name: varchar("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isCollapsed: boolean("is_collapsed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const channels = pgTable("channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "set null" }),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull(),
  description: text("description"),
  topic: text("topic"),
  type: varchar("type").notNull().default("text"),
  isPrivate: boolean("is_private").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  isReadOnly: boolean("is_read_only").notNull().default(false),
  categoryId: uuid("category_id").references(() => channelCategories.id, {
    onDelete: "set null",
  }),
  sortOrder: integer("sort_order").notNull().default(0),
  slowmodeSeconds: integer("slowmode_seconds").notNull().default(0),
  retentionDays: integer("retention_days"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  lastMessageAt: timestamp("last_message_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const channelMembers = pgTable("channel_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role").notNull().default("member"),
  isMuted: boolean("is_muted").notNull().default(false),
  muteUntil: timestamp("mute_until"),
  lastReadMessageId: uuid("last_read_message_id"),
  lastReadAt: timestamp("last_read_at"),
  notificationPreference: varchar("notification_preference")
    .notNull()
    .default("all"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const channelInvites = pgTable("channel_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "restrict" }),
  invitedByUserId: uuid("invited_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  invitedUserId: uuid("invited_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  status: varchar("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const channelPermissionOverwrites = pgTable(
  "channel_permission_overwrites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "restrict" }),
    targetType: varchar("target_type").notNull(),
    targetUserId: uuid("target_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    targetRoleId: uuid("target_role_id"),
    allowPermissions: jsonb("allow_permissions").notNull(),
    denyPermissions: jsonb("deny_permissions").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  }
);

// Direct Messages
export const directMessageChannels = pgTable("direct_message_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  type: varchar("type").notNull().default("dm"),
  name: varchar("name"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const directMessageMembers = pgTable("direct_message_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  dmChannelId: uuid("dm_channel_id")
    .notNull()
    .references(() => directMessageChannels.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lastReadAt: timestamp("last_read_at"),
  isHidden: boolean("is_hidden").notNull().default(false),
  isMuted: boolean("is_muted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const directMessages = pgTable("direct_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  dmChannelId: uuid("dm_channel_id")
    .notNull()
    .references(() => directMessageChannels.id, { onDelete: "set null" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  content: text("content"),
  type: varchar("type").notNull().default("text"),
  isEdited: boolean("is_edited").notNull().default(false),
  editedAt: timestamp("edited_at"),
  metadata: jsonb("metadata"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
