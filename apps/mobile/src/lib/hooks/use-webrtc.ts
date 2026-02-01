import { useState, useRef, useCallback, useEffect } from "react";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from "react-native-webrtc";

interface UseWebRTCOptions {
  signalingUrl: string;
  callId: string;
  onEnded?: () => void;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
];

export function useWebRTC({ signalingUrl, callId, onEnded }: UseWebRTCOptions) {
  const [status, setStatus] = useState<
    "connecting" | "connected" | "ended"
  >("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [duration, setDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connect = useCallback(async () => {
    const ws = new WebSocket(signalingUrl);
    wsRef.current = ws;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
    streamRef.current = stream;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.addEventListener("icecandidate", (e: any) => {
      if (e.candidate) {
        ws.send(JSON.stringify({ type: "candidate", candidate: e.candidate, callId }));
      }
    });

    pc.addEventListener("connectionstatechange", () => {
      if ((pc as any).connectionState === "connected") {
        setStatus("connected");
        timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      }
      if (
        (pc as any).connectionState === "disconnected" ||
        (pc as any).connectionState === "failed"
      ) {
        hangUp();
      }
    });

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", answer, callId }));
      } else if (msg.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
      } else if (msg.type === "candidate") {
        await pc.addIceCandidate(msg.candidate);
      } else if (msg.type === "ended") {
        hangUp();
      }
    };

    ws.onopen = async () => {
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: "offer", offer, callId }));
    };
  }, [signalingUrl, callId]);

  const hangUp = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    wsRef.current?.close();
    setStatus("ended");
    onEnded?.();
  }, [onEnded]);

  const toggleMute = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeaker((s) => !s);
    // Speaker routing handled by native audio session
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      wsRef.current?.close();
    };
  }, []);

  return {
    status,
    duration,
    isMuted,
    isSpeaker,
    connect,
    hangUp,
    toggleMute,
    toggleSpeaker,
  };
}
