import { useEffect, useRef } from "react";
import { BACKEND_ROOT } from "../conf";


export function loadKeys(){

}
export function useChatSocket(room, onMessage) {
  const socketRef = useRef(null);
  const handlerRef = useRef(onMessage);

  // keep handlerRef up to date, without re-running the main effect
  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!room) return;
    console.log("Connecting to room:", room);

    const backendHost = BACKEND_ROOT.replace(/^https?:\/\//, '');
    const wsScheme    = window.location.protocol === "https:" ? "wss" : "ws";
    const socketUrl   = `${wsScheme}://${backendHost}/ws/chat/${room}/`;

    const ws = new WebSocket(socketUrl);
    socketRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("🔍 WS parsed object:", data);
        handlerRef.current(data);
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };
    ws.onopen = () => console.log("WebSocket opened:", socketUrl);
    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = (e) => console.log("WebSocket closed:", e.code, e.reason);

    // cleanup only when room actually changes or component unmounts
    return () => {
      console.log("Cleaning up WS for room:", room);
      ws.close();
      socketRef.current = null;
    };
  }, [room]);

  const send = (messageData) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(messageData));
    }
  };

  return { send };
}