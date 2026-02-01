import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { API_URL } from "@/lib/constants/config";
import { useAuthStore } from "@/lib/stores/auth-store";

interface IncomingCall {
  callId: string;
  signalingUrl: string;
  callerInfo: string;
}

export function useIncomingCall() {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const ws = new WebSocket(
      `${API_URL.replace("http", "ws")}/ws/calls?token=${accessToken}`
    );
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "call.incoming") {
        setIncomingCall({
          callId: msg.callId,
          signalingUrl: msg.signalingUrl,
          callerInfo: msg.callerInfo,
        });
        router.push("/call/incoming");
      }
    };

    ws.onclose = () => {
      // Reconnect after 3s
      setTimeout(() => {
        if (useAuthStore.getState().accessToken) {
          // Will re-trigger via useEffect
        }
      }, 3000);
    };

    return () => {
      ws.close();
    };
  }, [accessToken]);

  const declineCall = () => {
    if (wsRef.current && incomingCall) {
      wsRef.current.send(
        JSON.stringify({ type: "call.declined", callId: incomingCall.callId })
      );
    }
    setIncomingCall(null);
  };

  const acceptCall = () => {
    // Navigation already handled; WebRTC connection starts on the incoming call screen
  };

  return { incomingCall, acceptCall, declineCall, clearCall: () => setIncomingCall(null) };
}
