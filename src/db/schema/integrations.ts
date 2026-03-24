import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { workspaces } from "./workspaces";
import { channels } from "./conversations";

export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  channelId: uuid("channel_id").references(() => channels.id, {
    onDelete: "restrict",
  }),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  name: varchar("name").notNull(),
  avatarUrl: text("avatar_url"),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at"),
  lastRotatedAt: timestamp("last_rotated_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const apps = pgTable("apps", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  developerUserId: uuid("developer_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  clientId: varchar("client_id").notNull().unique(),
  clientSecret: varchar("client_secret").notNull(),
  expiresAt: timestamp("expires_at"),
  lastRotatedAt: timestamp("last_rotated_at"),
  scopes: jsonb("scopes").notNull(),
  redirectUris: jsonb("redirect_uris").notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workspaceAppInstalls = pgTable("workspace_app_installs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  appId: uuid("app_id")
    .notNull()
    .references(() => apps.id, { onDelete: "restrict" }),
  installedByUserId: uuid("installed_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  scopesGranted: jsonb("scopes_granted").notNull(),
  accessToken: varchar("access_token"),
  expiresAt: timestamp("expires_at"),
  lastRotatedAt: timestamp("last_rotated_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workspaceIntegrations = pgTable("workspace_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  integrationType: varchar("integration_type").notNull(),
  name: varchar("name").notNull(),
  config: jsonb("config").notNull(),
  credentials: jsonb("credentials"),
  channelId: uuid("channel_id").references(() => channels.id, {
    onDelete: "restrict",
  }),
  installedByUserId: uuid("installed_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  isActive: boolean("is_active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
