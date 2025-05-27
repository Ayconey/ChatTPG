import { useEffect, useRef } from "react";

export function useChatSocket(room, onMessage) {
  const socketRef = useRef(null);
  const handlerRef = useRef(onMessage);

  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!room) return;
    console.log("Connecting to room:", room);

    const backendHost = "localhost:8000";
    const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
    const socketUrl = `${wsScheme}://${backendHost}/ws/chat/${room}/`;

    const ws = new WebSocket(socketUrl);
    socketRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("🔍 WS received:", data);
        if (data.content_for_sender || data.content_for_receiver) {
          handlerRef.current(data);
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };
    
    ws.onopen = () => console.log("WebSocket opened:", socketUrl);
    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = (e) => console.log("WebSocket closed:", e.code, e.reason);

    return () => {
      console.log("Cleaning up WS for room:", room);
      ws.close();
      socketRef.current = null;
    };
  }, [room]);

  const send = (encryptedData, username) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        content_for_sender: encryptedData.content_for_sender,
        content_for_receiver: encryptedData.content_for_receiver,
        iv: encryptedData.iv,
        username
      }));
    }
  };

  return { send };
}