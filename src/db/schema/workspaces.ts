import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  numeric,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  plan: varchar("plan").notNull().default("free"),
  maxMembers: integer("max_members").notNull().default(10),
  maxStorageGb: integer("max_storage_gb").notNull().default(5),
  isVerified: boolean("is_verified").notNull().default(false),
  isPublic: boolean("is_public").notNull().default(false),
  settings: jsonb("settings"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  role: varchar("role").notNull().default("member"),
  nickname: varchar("nickname"),
  status: varchar("status").notNull().default("active"),
  customStatus: varchar("custom_status"),
  customStatusEmoji: varchar("custom_status_emoji"),
  customStatusExpiresAt: timestamp("custom_status_expires_at"),
  deafened: boolean("deafened").notNull().default(false),
  muted: boolean("muted").notNull().default(false),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  invitedByUserId: uuid("invited_by_user_id").references(() => users.id, {
    onDelete: "restrict",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  invitedByUserId: uuid("invited_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  email: varchar("email"),
  token: varchar("token").notNull().unique(),
  role: varchar("role").notNull().default("member"),
  status: varchar("status").notNull().default("pending"),
  maxUses: integer("max_uses"),
  useCount: integer("use_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  lastRotatedAt: timestamp("last_rotated_at"),
  acceptedByUserId: uuid("accepted_by_user_id").references(() => users.id, {
    onDelete: "restrict",
  }),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  name: varchar("name").notNull(),
  color: varchar("color"),
  permissions: jsonb("permissions").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  isMentionable: boolean("is_mentionable").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const memberRoles = pgTable("member_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceMemberId: uuid("workspace_member_id")
    .notNull()
    .references(() => workspaceMembers.id, { onDelete: "cascade" }),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workspaceBans = pgTable("workspace_bans", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  bannedUserId: uuid("banned_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  bannedByUserId: uuid("banned_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  reason: text("reason"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workspaceStorageUsage = pgTable("workspace_storage_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  totalBytesUsed: integer("total_bytes_used").notNull().default(0),
  fileCount: integer("file_count").notNull().default(0),
  lastCalculatedAt: timestamp("last_calculated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workspaceAnalyticsSnapshots = pgTable(
  "workspace_analytics_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    snapshotDate: timestamp("snapshot_date").notNull(),
    activeMembers: integer("active_members").notNull().default(0),
    totalMessages: integer("total_messages").notNull().default(0),
    totalChannels: integer("total_channels").notNull().default(0),
    totalFilesUploaded: integer("total_files_uploaded").notNull().default(0),
    totalCalls: integer("total_calls").notNull().default(0),
    totalCallMinutes: integer("total_call_minutes").notNull().default(0),
    newMembers: integer("new_members").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  }
);

export const workspaceSubscriptionPlans = pgTable(
  "workspace_subscription_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    plan: varchar("plan").notNull(),
    status: varchar("status").notNull().default("active"),
    billingCycle: varchar("billing_cycle").notNull(),
    pricePerSeat: numeric("price_per_seat").notNull(),
    seatCount: integer("seat_count").notNull(),
    currency: varchar("currency").notNull().default("USD"),
    externalSubscriptionId: varchar("external_subscription_id"),
    trialEndsAt: timestamp("trial_ends_at"),
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    cancelledAt: timestamp("cancelled_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  }
);
