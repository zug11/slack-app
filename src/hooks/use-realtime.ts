"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const supabase = createClient();

/**
 * Subscribe to postgres_changes on a table filtered by a column.
 * Returns a cleanup function.
 */
export function useRealtimeTable(
  table: string,
  filter: { column: string; value: string },
  onInsert?: (record: any) => void,
  onUpdate?: (record: any) => void,
  onDelete?: (old: any) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channelName = `${table}:${filter.column}:${filter.value}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table,
          filter: `${filter.column}=eq.${filter.value}`,
        },
        (payload) => onInsert?.(payload.new)
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table,
          filter: `${filter.column}=eq.${filter.value}`,
        },
        (payload) => onUpdate?.(payload.new)
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table,
          filter: `${filter.column}=eq.${filter.value}`,
        },
        (payload) => onDelete?.(payload.old)
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter.column, filter.value]);

  return channelRef;
}

/**
 * Broadcast channel for ephemeral events (typing indicators, etc.)
 */
export function useBroadcast(channelName: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase.channel(channelName);
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName]);

  function send(event: string, payload: any) {
    channelRef.current?.send({
      type: "broadcast",
      event,
      payload,
    });
  }

  function onBroadcast(event: string, callback: (payload: any) => void) {
    channelRef.current?.on("broadcast", { event }, (msg) =>
      callback(msg.payload)
    );
  }

  return { send, onBroadcast, channel: channelRef };
}

export { supabase };
