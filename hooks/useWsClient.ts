// src/hooks/useWsClient.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";

export interface WsNotification {
  user_id: string;
  kind: string;
  payload: any;
}

export function useWsClient(onMessage: (msg: WsNotification) => void) {
  const { token, isHydrated } = useAuthStore();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/api/v1/ws";
    const url = `${wsUrl}?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // console.log("WS connected");
    };

    ws.onclose = () => {
      setConnected(false);
      // console.log("WS closed");
    };

    ws.onerror = () => {
      setConnected(false);
      // console.log("WS error");
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as WsNotification;
        if (data && data.kind) {
          onMessage(data);
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [token, isHydrated, onMessage]);

  return { connected };
}
