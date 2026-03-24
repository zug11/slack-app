# Slack Clone Specification Document

This document outlines the technical requirements, architecture, and schema needed to build a robust Slack clone, optimized for modern web technologies.

## 1. Product Requirements

### 1.1 Hierarchy
*   **Workspace**: The top-level container (e.g., "Make My Own Slack"). Users belong to one or more workspaces.
*   **Channels**: Topic-based messaging rooms within a workspace. Can be Public or Private.
*   **Users/Members**: Individuals with profiles within the workspace.

### 1.2 Messaging Capabilities
*   **Real-time sync**: Messages appear instantly for all users connected to the channel.
*   **Threaded Replies**: Ability to start a branching conversation from any root parent message.
*   **Direct Messages**: 1-on-1 private messaging outside of channels.
*   **Reactions**: Applying emoji reactions to messages.
*   **Online/Offline Presence**: Green dot indicator for active users.

### 1.3 Expected MVP Deliverables
*   Authentication system (email/password or OAuth).
*   Web client featuring a multi-pane layout (Sidebar + Main Chat Area + Thread Sidebar).
*   Backend API handling standard CRUD and emitting real-time WebSocket events.

---

## 2. System Architecture

To achieve high development velocity while maintaining solid performance, we will utilize a modern TypeScript full-stack approach.

### 2.1 Technology Stack
*   **Frontend**: Next.js (App Router), React, TailwindCSS, Zustand (for lightweight global state), and Lucide React (for icons). Provide a hyper-polished dark-mode aesthetic.
*   **Backend / API**: Node.js API (using Next.js server actions / API routes or a separate Express/Hono server).
*   **Real-Time Engine**: Socket.io or Pusher (or raw WebSockets) for real-time pub/sub event distribution.
*   **Database**: PostgreSQL.
*   **ORM Layer**: Prisma or Drizzle ORM.
*   **File Storage**: AWS S3 or Supabase Storage (for avatars and attachments).

### 2.2 Client-Server Communication Flow
1.  **Initial Load**: The React application requests the initial state (Channels, Users) via REST/GraphQL.
2.  **Socket Handshake**: The client establishes a WebSocket connection, authenticating with an access token.
3.  **Real-time Events**: When User A sends a message:
    *   Client A sends an HTTP POST request to `/api/messages`.
    *   The API saves the message to PostgreSQL.
    *   The API triggers an event `message:new` on the WebSocket channel associated with the specific Channel ID.
    *   Client B receives `message:new` over WebSocket and updates the React state instantly.

---

## 3. Database Schema Design (Relational)

Below is a proposed simplified schema (PostgreSQL dialect).

### `User` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `email` | String | Unique login |
| `name` | String | Display Name |
| `avatarUrl` | String | Profile Image URL |

### `Workspace` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | String | E.g. "Acme Corp" |
| `slug` | String | Unique URL identifier |

### `Channel` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `workspaceId`| UUID | Foreign Key -> Workspace.id |
| `name` | String | e.g. "general" |
| `type` | Enum | 'PUBLIC' or 'PRIVATE' |

### `Message` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `content` | Text | Markdown/Rich Text string |
| `userId` | UUID | Author of message |
| `channelId` | UUID | Where it was posted |
| `parentId` | UUID | (Optional) Reference to another Message.id for Threads |
| `createdAt` | DateTime | Timestamp |

### `Reaction` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `messageId` | UUID | Message being reacted to |
| `userId` | UUID | Person reacting |
| `emoji` | String | The emoji string (e.g. ":smile:") |

---

## 4. UI/UX Specifications

*   **Responsiveness**: The web client must reflow gracefully on smaller screens. 
*   **Sidebar**: A persistent left-hand navigation detailing Channels and DMs.
*   **Main Chat**: A scrollable history view that automatically pins to the bottom. Pagination (infinite scroll) is required for older messages.
*   **Right Panel**: Used conditionally to display Thread context or Profile details without losing the main channel context.
*   **Aesthetics**: Glassmorphism elements, sleek subtle animations on hover, distinct read/unread typography.
