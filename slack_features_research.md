# Slack: Features, Architecture, and Dependencies Research

This document analyzes the core features, architectural choices, and tech stack that power Slack. Understanding these elements is crucial for building a competitive alternative.

## 1. Core Features

### Communication Primitives
*   **Channels**: Public (discoverable by anyone in the workspace), Private (invite-only), and Shared/Connect (across different companies).
*   **Direct Messages (DMs) & Group DMs**: Ad-hoc private conversations.
*   **Threads**: Branching conversations off individual messages to prevent channel clutter. This is a critical organizational feature that many simple chat apps lack.
*   **Huddles**: Audio/Video drop-in calls (similar to Discord voice channels) built on WebRTC.

### Content & Productivity
*   **Rich Text Formatting & Markdown**: Support for code blocks, bold, italics, bullet points, etc.
*   **Reactions ("Reacjis")**: Emoji reactions on messages to reduce "acknowledgement" noise (e.g., replying "ok").
*   **Universal Search**: Extremely fast search across all channels, messages, and uploaded files.
*   **Canvas & Lists**: Shared documents and structured data tightly integrated into channels.

## 2. The API Platform ("The Moat")

A chat interface is easy to build. The true power of Slack lies in its extensibility.

*   **Incoming/Outgoing Webhooks**: Simple endpoints to post data into Slack or send data out when specific triggers occur.
*   **Slash Commands**: Typing `/command` to trigger specific background actions via external APIs.
*   **Bot Users & Events API**: Apps can consume real-time user activity (messages, join/leave events) and respond programmatically.
*   **Socket Mode**: Allows apps to receive events securely over a WebSocket connection without exposing a public HTTP endpoint (crucial for internal enterprise bots hidden behind corporate firewalls).
*   **Block Kit**: A UI framework for apps to build interactive messages with buttons, dropdowns, and text inputs directly within the chat stream.

## 3. Real-Time Architecture & Sockets

Slack maintains real-time synchronization across millions of concurrent users using a sophisticated pub/sub mechanism.

### The Real Time Messaging (RTM) & Events
*   **WebSocket Protocol**: Client applications maintain a persistent WebSocket connection to Slack's Edge servers.
*   **Initial Load (`rtm.start` / `client.counts`)**: On startup, clients fetch a snapshot of the workspace state via standard HTTP REST requests.
*   **Event Firehose**: Once connected, everything (new messages, user presence changes, typing indicators) is delivered as a JSON payload over the WebSocket.
*   **Client-Side Resolution**: When a client loses connection, it fetches the missed messages via REST API while reconnecting the WebSocket to resume the real-time stream.

## 4. Dependencies & Tech Stack

Slack operates at massive scale. Over the years, their stack has evolved to handle this load:

### Frontend Clients
*   **Web / Desktop App**: Built using **React.js**. State management relies heavily on **Redux** (and historically RxJS).
*   **Desktop Wrapper**: Uses **Electron**, allowing them to wrap their web app with native integrations (notifications, filesystem access).
*   **Mobile**: Native iOS (Swift/Objective-C) and Android (Kotlin/Java) clients for better performance.

### Backend Infrastructure
*   **Web API (Business Logic)**: Historically written in PHP, later migrated to **Hack (HHVM)** for strong typing and performance.
*   **Edge & Proxy Layer**: Uses **Envoy** and custom edge routers (often in **Go**) to terminate WebSockets and route traffic securely.
*   **Real-Time Message Routing**: **Java** services are heavily used for the real-time pub/sub messaging backend, distributing WebSocket events to millions of connected users.

### Data Storage
*   **Primary Database**: **MySQL** distributed using **Vitess** to handle massive database sharding and partitioning at horizontal scale.
*   **Caching Layer**: Extensive use of **Memcached** (for fast API object caching) and **Redis** (for queuing and ephemeral state like user presence).
*   **Search Engine**: Custom implementation built on top of **Apache Solr** / **Elasticsearch/Lucene** to handle full-text search across billions of messages.

---

> **Takeaway for Clone Implementation**
> While we won't need Vitess or Hack for our clone initially, the structural approach—using HTTP REST for initial load/history and WebSockets purely for real-time deltas—is the pattern we must emulate to achieve the "Slack feel."
