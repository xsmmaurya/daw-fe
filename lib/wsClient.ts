// src/lib/wsClient.ts
import { useAuthStore } from "@/store/authStore";

export type WsNotification = {
  user_id: string;
  kind: string;
  payload: any;
};

export function createRideWs(onMessage: (msg: WsNotification) => void): WebSocket | null {
  const { token } = useAuthStore.getState();
  if (!token) return null;

  // Adjust host if your backend is elsewhere
  const wsUrl = `ws://localhost:8080/api/v1/ws?token=${encodeURIComponent(token)}`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const parsed: WsNotification = JSON.parse(event.data);
      onMessage(parsed);
    } catch (err) {
      console.error("Failed to parse WS message", err, event.data);
    }
  };

  ws.onopen = () => {
    console.info("[WS] connected");
  };

  ws.onclose = () => {
    console.info("[WS] closed");
  };

  ws.onerror = (err) => {
    console.error("[WS] error", err);
  };

  return ws;
}


