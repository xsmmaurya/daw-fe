// app/lib/useRideWs.ts
"use client";

import { useEffect } from "react";

export function useRideWs(token: string | null, onMessage: (msg: any) => void) {
  useEffect(() => {
    if (!token) return;

    const url = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/api/v1/ws";
    const ws = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onMessage(data);
      } catch {
        // ignore
      }
    };

    return () => ws.close();
  }, [token, onMessage]);
}
