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
import { channels } from "./conversations";

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "set null" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  content: text("content"),
  type: varchar("type").notNull().default("text"),
  threadId: uuid("thread_id"),
  replyCount: integer("reply_count").notNull().default(0),
  isPinned: boolean("is_pinned").notNull().default(false),
  isEdited: boolean("is_edited").notNull().default(false),
  editedAt: timestamp("edited_at"),
  metadata: jsonb("metadata"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messageAttachments = pgTable("message_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "restrict" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  fileName: varchar("file_name").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  mimeType: varchar("mime_type").notNull(),
  storageUrl: text("storage_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  width: integer("width"),
  height: integer("height"),
  durationSeconds: integer("duration_seconds"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messageReactions = pgTable("message_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "restrict" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  emoji: varchar("emoji").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messageMentions = pgTable("message_mentions", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "restrict" }),
  mentionedUserId: uuid("mentioned_user_id").references(() => users.id, {
    onDelete: "restrict",
  }),
  mentionedRoleId: uuid("mentioned_role_id"),
  mentionType: varchar("mention_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pinnedMessages = pgTable("pinned_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "restrict" }),
  messageId: uuid("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "restrict" }),
  pinnedByUserId: uuid("pinned_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  pinnedAt: timestamp("pinned_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messageThreads = pgTable("message_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "restrict" }),
  rootMessageId: uuid("root_message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "restrict" }),
  replyCount: integer("reply_count").notNull().default(0),
  lastReplyAt: timestamp("last_reply_at"),
  participantCount: integer("participant_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const threadSubscribers = pgTable("thread_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => messageThreads.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lastReadAt: timestamp("last_read_at"),
  isMuted: boolean("is_muted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  messageId: uuid("message_id").references(() => messages.id, {
    onDelete: "restrict",
  }),
  dmMessageId: uuid("dm_message_id"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const polls = pgTable("polls", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "restrict" }),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  question: varchar("question").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  isMultipleChoice: boolean("is_multiple_choice").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pollOptions = pgTable("poll_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: uuid("poll_id")
    .notNull()
    .references(() => polls.id, { onDelete: "restrict" }),
  text: varchar("text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pollVotes = pgTable("poll_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: uuid("poll_id")
    .notNull()
    .references(() => polls.id, { onDelete: "restrict" }),
  pollOptionId: uuid("poll_option_id")
    .notNull()
    .references(() => pollOptions.id, { onDelete: "restrict" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messageReports = pgTable("message_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  reporterUserId: uuid("reporter_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  messageId: uuid("message_id").references(() => messages.id, {
    onDelete: "restrict",
  }),
  dmMessageId: uuid("dm_message_id"),
  reason: varchar("reason").notNull(),
  details: text("details"),
  status: varchar("status").notNull().default("pending"),
  resolvedByUserId: uuid("resolved_by_user_id").references(() => users.id, {
    onDelete: "restrict",
  }),
  resolvedAt: timestamp("resolved_at"),
  resolutionNote: text("resolution_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
