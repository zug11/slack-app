import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  customType,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { workspaces } from "./workspaces";
import { channels, directMessageChannels } from "./conversations";
import { messages } from "./messages";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, {
    onDelete: "restrict",
  }),
  type: varchar("type").notNull(),
  title: varchar("title").notNull(),
  body: text("body"),
  actorUserId: uuid("actor_user_id").references(() => users.id, {
    onDelete: "restrict",
  }),
  entityType: varchar("entity_type"),
  entityId: uuid("entity_id"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  actorUserId: uuid("actor_user_id").references(() => users.id, {
    onDelete: "restrict",
  }),
  action: varchar("action").notNull(),
  entityType: varchar("entity_type").notNull(),
  entityId: uuid("entity_id"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  changes: jsonb("changes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const emojiCustom = pgTable("emoji_custom", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  name: varchar("name").notNull(),
  imageUrl: text("image_url").notNull(),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  isAnimated: boolean("is_animated").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const calls = pgTable("calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  channelId: uuid("channel_id").references(() => channels.id, {
    onDelete: "restrict",
  }),
  dmChannelId: uuid("dm_channel_id").references(
    () => directMessageChannels.id,
    { onDelete: "restrict" }
  ),
  initiatedByUserId: uuid("initiated_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  type: varchar("type").notNull().default("voice"),
  status: varchar("status").notNull().default("active"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds"),
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const callParticipants = pgTable("call_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  callId: uuid("call_id")
    .notNull()
    .references(() => calls.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  leftAt: timestamp("left_at"),
  isMuted: boolean("is_muted").notNull().default(false),
  isVideoOn: boolean("is_video_on").notNull().default(false),
  isScreenSharing: boolean("is_screen_sharing").notNull().default(false),
  isDeafened: boolean("is_deafened").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const callRecordings = pgTable("call_recordings", {
  id: uuid("id").primaryKey().defaultRandom(),
  callId: uuid("call_id")
    .notNull()
    .references(() => calls.id, { onDelete: "set null" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "set null" }),
  storageUrl: text("storage_url").notNull(),
  fileSizeBytes: integer("file_size_bytes"),
  durationSeconds: integer("duration_seconds"),
  status: varchar("status").notNull().default("processing"),
  startedRecordingAt: timestamp("started_recording_at").notNull(),
  expiresAt: timestamp("expires_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const scheduledMessages = pgTable("scheduled_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  channelId: uuid("channel_id").references(() => channels.id, {
    onDelete: "restrict",
  }),
  dmChannelId: uuid("dm_channel_id").references(
    () => directMessageChannels.id,
    { onDelete: "restrict" }
  ),
  content: text("content").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  sentAt: timestamp("sent_at"),
  status: varchar("status").notNull().default("pending"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reminders = pgTable("reminders", {
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
  text: text("text").notNull(),
  remindAt: timestamp("remind_at").notNull(),
  status: varchar("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const searchIndexes = pgTable("search_indexes", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  entityType: varchar("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  contentTsv: tsvector("content_tsv").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
