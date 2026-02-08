"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff, PhoneIncoming, User, Volume2 } from "lucide-react";

function getWsUrl() {
  if (typeof window === "undefined") return "ws://localhost:8080";
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl) return envUrl;
  // Use same origin - our HTTPS server proxies /api/* WebSockets to the gateway
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}`;
}

interface VoipCallProps {
  callId: string;
  role: "caller" | "receiver";
  onEnded?: () => void;
}

type CallStatus = "connecting" | "ringing" | "connected" | "ended";

export function VoipCall({ callId, role, onEnded }: VoipCallProps) {
  const [status, setStatus] = useState<CallStatus>(role === "caller" ? "ringing" : "connecting");
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const silentCleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    wsRef.current?.close();
    pcRef.current = null;
    wsRef.current = null;
    streamRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    silentCleanup();
    setStatus("ended");
    onEnded?.();
  }, [onEnded, silentCleanup]);

  const startCall = useCallback(async () => {
    try {
      // Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      // Add local audio tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Play remote audio
      pc.ontrack = (event) => {
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.autoplay = true;
        }
        audioRef.current.srcObject = event.streams[0];
        audioRef.current.play().catch(() => {});
      };

      // Connect to signaling server
      const ws = new WebSocket(`${getWsUrl()}/api/contact/voip/signal`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "join", callId }));
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "joined") {
          // We joined the room
          if (role === "caller") {
            // Caller creates and sends the offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(JSON.stringify({ type: "offer", sdp: offer }));
            setStatus("ringing");
          }
          return;
        }

        if (msg.type === "peer-joined") {
          // The other party joined - if we're the caller, resend offer
          if (role === "caller" && pc.localDescription) {
            ws.send(JSON.stringify({ type: "offer", sdp: pc.localDescription }));
          }
          return;
        }

        if (msg.type === "offer" && role === "receiver") {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(JSON.stringify({ type: "answer", sdp: answer }));
          return;
        }

        if (msg.type === "answer" && role === "caller") {
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          }
          return;
        }

        if (msg.type === "ice-candidate" && msg.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch {}
          return;
        }

        if (msg.type === "peer-left") {
          cleanup();
          return;
        }

        if (msg.type === "ended") {
          cleanup();
          return;
        }
      };

      ws.onerror = () => {
        setError("Connection failed. Check if the signaling server is running.");
      };

      // Send ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
        }
      };

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setStatus("connected");
          timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
        } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          cleanup();
        }
      };
    } catch (err) {
      setError("Microphone access denied. Please allow microphone access and try again.");
    }
  }, [callId, role, cleanup]);

  const hangUp = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "ended", callId }));
    cleanup();
  }, [callId, cleanup]);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Auto-start for caller, wait for accept for receiver
  useEffect(() => {
    if (role === "caller") {
      startCall();
    }
    return () => silentCleanup();
  }, []);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 py-12 text-white text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-6">
              <PhoneOff className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-semibold">Connection Error</h2>
            <p className="text-white/80 mt-3 max-w-xs mx-auto">{error}</p>
          </div>
          <div className="p-6">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full h-12 rounded-xl"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "ended") {
    return (
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-gray-600 to-slate-700 px-6 py-12 text-white text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-6">
              <PhoneOff className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-semibold">Call Ended</h2>
            <p className="text-white/80 mt-3">
              Duration: <span className="font-mono font-semibold">{formatDuration(duration)}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Receiver: show accept/decline before connecting
  if (role === "receiver" && status === "connecting") {
    return (
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-12 text-white text-center">
            {/* Pulsing animation */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="absolute w-24 h-24 rounded-full bg-white/20 animate-ping" />
              <div className="absolute w-28 h-28 rounded-full bg-white/10 animate-pulse" />
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/30">
                <PhoneIncoming className="h-10 w-10" />
              </div>
            </div>
            <h2 className="text-xl font-semibold">Incoming Call</h2>
            <p className="text-white/80 mt-3 max-w-xs mx-auto">
              Someone is trying to contact you about your vehicle
            </p>
          </div>
          <div className="p-6 flex gap-4">
            <Button
              variant="destructive"
              className="flex-1 h-14 text-base rounded-xl"
              onClick={cleanup}
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Decline
            </Button>
            <Button
              className="flex-1 h-14 text-base rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              onClick={startCall}
            >
              <Phone className="h-5 w-5 mr-2" />
              Accept
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active call UI
  const isConnected = status === "connected";
  const gradientClass = isConnected
    ? "from-green-500 to-emerald-600"
    : "from-blue-500 to-indigo-600";

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
        <div className={`bg-gradient-to-br ${gradientClass} px-6 py-10 text-white text-center`}>
          {/* Avatar with status indicator */}
          <div className="relative inline-flex items-center justify-center mb-6">
            {!isConnected && (
              <>
                <div className="absolute w-24 h-24 rounded-full bg-white/20 animate-ping" />
                <div className="absolute w-28 h-28 rounded-full bg-white/10 animate-pulse" />
              </>
            )}
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/30">
              <User className="h-10 w-10" />
            </div>
            {isConnected && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-400 border-2 border-white flex items-center justify-center">
                <Volume2 className="h-3 w-3" />
              </div>
            )}
          </div>

          <h2 className="text-xl font-semibold">
            {status === "ringing" ? "Calling..." : status === "connected" ? "Connected" : "Connecting..."}
          </h2>

          {isConnected && (
            <p className="text-4xl font-mono font-semibold mt-4" aria-live="polite">
              {formatDuration(duration)}
            </p>
          )}

          {status === "ringing" && (
            <p className="text-white/80 mt-3">
              Waiting for the other party to answer...
            </p>
          )}
        </div>

        {/* Call controls */}
        <div className="p-6">
          <div className="flex justify-center gap-6">
            <button
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className={`
                flex flex-col items-center justify-center w-20 h-20 rounded-2xl transition-all
                ${muted
                  ? "bg-red-100 text-red-600"
                  : "bg-muted hover:bg-muted/80 text-foreground"
                }
              `}
            >
              {muted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
              <span className="text-xs mt-1 font-medium">{muted ? "Unmute" : "Mute"}</span>
            </button>

            <button
              onClick={hangUp}
              aria-label="End call"
              className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/30"
            >
              <PhoneOff className="h-7 w-7" />
              <span className="text-xs mt-1 font-medium">End</span>
            </button>
          </div>
        </div>

        {/* Dev testing link */}
        {status === "ringing" && (
          <div className="px-6 pb-6">
            <div className="text-xs text-muted-foreground border rounded-xl p-4 bg-muted/30">
              <p className="font-medium mb-2">Testing Mode</p>
              <p className="mb-2">Open this link in another tab to answer:</p>
              <a
                href={`/call/${callId}`}
                target="_blank"
                rel="noopener"
                className="text-primary underline break-all text-xs"
              >
                {typeof window !== "undefined" ? `${window.location.origin}/call/${callId}` : `/call/${callId}`}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
