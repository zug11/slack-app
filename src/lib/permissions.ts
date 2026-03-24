// Permission constants matching the roles.permissions JSONB structure

export const PERMISSIONS = {
  // Workspace-level
  MANAGE_WORKSPACE: "manage_workspace",
  MANAGE_CHANNELS: "manage_channels",
  MANAGE_MEMBERS: "manage_members",
  MANAGE_ROLES: "manage_roles",
  MANAGE_WEBHOOKS: "manage_webhooks",
  MANAGE_EMOJI: "manage_emoji",
  VIEW_AUDIT_LOG: "view_audit_log",
  BAN_MEMBERS: "ban_members",

  // Channel-level
  SEND_MESSAGES: "send_messages",
  DELETE_MESSAGES: "delete_messages",
  PIN_MESSAGES: "pin_messages",
  MANAGE_CHANNEL: "manage_channel",

  // General
  CREATE_INVITES: "create_invites",
  ATTACH_FILES: "attach_files",
  ADD_REACTIONS: "add_reactions",
  USE_MENTIONS: "use_mentions",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Default permissions for built-in workspace member roles
export const ROLE_DEFAULTS: Record<string, Permission[]> = {
  owner: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.MANAGE_CHANNELS,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MANAGE_WEBHOOKS,
    PERMISSIONS.MANAGE_EMOJI,
    PERMISSIONS.VIEW_AUDIT_LOG,
    PERMISSIONS.BAN_MEMBERS,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.DELETE_MESSAGES,
    PERMISSIONS.PIN_MESSAGES,
    PERMISSIONS.MANAGE_CHANNEL,
    PERMISSIONS.CREATE_INVITES,
    PERMISSIONS.ATTACH_FILES,
    PERMISSIONS.ADD_REACTIONS,
    PERMISSIONS.USE_MENTIONS,
  ],
  moderator: [
    PERMISSIONS.DELETE_MESSAGES,
    PERMISSIONS.PIN_MESSAGES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.CREATE_INVITES,
    PERMISSIONS.ATTACH_FILES,
    PERMISSIONS.ADD_REACTIONS,
    PERMISSIONS.USE_MENTIONS,
  ],
  member: [
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.PIN_MESSAGES,
    PERMISSIONS.CREATE_INVITES,
    PERMISSIONS.ATTACH_FILES,
    PERMISSIONS.ADD_REACTIONS,
    PERMISSIONS.USE_MENTIONS,
  ],
  guest: [
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.ADD_REACTIONS,
  ],
};
