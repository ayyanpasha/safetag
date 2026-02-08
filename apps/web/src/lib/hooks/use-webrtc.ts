"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseWebRTCOptions {
  signalingUrl: string;
  callId: string;
  onEnded?: () => void;
}

export function useWebRTC({ signalingUrl, callId, onEnded }: UseWebRTCOptions) {
  const [status, setStatus] = useState<"connecting" | "connected" | "ended">("connecting");
  const [duration, setDuration] = useState(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    pcRef.current?.close();
    wsRef.current?.close();
    pcRef.current = null;
    wsRef.current = null;
    setStatus("ended");
    onEnded?.();
  }, [onEnded]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.srcObject = event.streams[0];
        audioRef.current.play();
      };

      const ws = new WebSocket(signalingUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "join", callId }));
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(JSON.stringify({ type: "answer", sdp: answer, callId }));
        } else if (msg.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        } else if (msg.type === "ice-candidate") {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } else if (msg.type === "ended") {
          cleanup();
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate, callId }));
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setStatus("connected");
          timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
        } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          cleanup();
        }
      };

      // Create offer if initiator
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({ type: "offer", sdp: offer, callId }));
      });
    } catch {
      cleanup();
    }
  }, [signalingUrl, callId, cleanup]);

  const hangUp = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "ended", callId }));
    cleanup();
  }, [callId, cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { status, duration, start, hangUp };
}
