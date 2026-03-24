import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email").notNull().unique(),
  username: varchar("username").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  phone: varchar("phone"),
  timezone: varchar("timezone").notNull().default("UTC"),
  locale: varchar("locale").notNull().default("en"),
  passwordHash: varchar("password_hash").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: varchar("two_factor_secret"),
  lastLoginAt: timestamp("last_login_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  token: varchar("token").notNull().unique(),
  refreshToken: varchar("refresh_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  lastRotatedAt: timestamp("last_rotated_at").notNull().defaultNow(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  deviceType: varchar("device_type"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userNotificationPreferences = pgTable(
  "user_notification_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "restrict" }),
    desktopNotifications: boolean("desktop_notifications")
      .notNull()
      .default(true),
    mobilePush: boolean("mobile_push").notNull().default(true),
    emailNotifications: boolean("email_notifications").notNull().default(true),
    notificationSound: varchar("notification_sound")
      .notNull()
      .default("default"),
    doNotDisturbStart: varchar("do_not_disturb_start"),
    doNotDisturbEnd: varchar("do_not_disturb_end"),
    notifyForAllMessages: boolean("notify_for_all_messages")
      .notNull()
      .default(false),
    notifyForMentions: boolean("notify_for_mentions").notNull().default(true),
    emailFrequency: varchar("email_frequency").notNull().default("instant"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  }
);

export const userOauthAccounts = pgTable("user_oauth_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  provider: varchar("provider").notNull(),
  providerUserId: varchar("provider_user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  lastRotatedAt: timestamp("last_rotated_at"),
  scopes: jsonb("scopes"),
  profileData: jsonb("profile_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userBlocks = pgTable("user_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  blockerUserId: uuid("blocker_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  blockedUserId: uuid("blocked_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userPresences = pgTable("user_presences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id").notNull(),
  status: varchar("status").notNull().default("offline"),
  lastSeenAt: timestamp("last_seen_at"),
  clientType: varchar("client_type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
