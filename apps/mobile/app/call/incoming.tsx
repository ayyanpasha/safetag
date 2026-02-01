import { useState } from "react";
import { useRouter } from "expo-router";
import { IncomingCallScreen } from "@/components/scanner/incoming-call";
import { ActiveCall } from "@/components/scanner/active-call";
import { useIncomingCall } from "@/lib/hooks/use-incoming-call";
import { useWebRTC } from "@/lib/hooks/use-webrtc";

export default function IncomingCallRoute() {
  const router = useRouter();
  const { incomingCall, acceptCall, declineCall } = useIncomingCall();
  const [accepted, setAccepted] = useState(false);

  const webrtc = useWebRTC({
    signalingUrl: incomingCall?.signalingUrl ?? "",
    callId: incomingCall?.callId ?? "",
    onEnded: () => router.dismissAll(),
  });

  if (!incomingCall) {
    router.dismissAll();
    return null;
  }

  if (accepted) {
    return (
      <ActiveCall
        status={webrtc.status}
        duration={webrtc.duration}
        isMuted={webrtc.isMuted}
        isSpeaker={webrtc.isSpeaker}
        onToggleMute={webrtc.toggleMute}
        onToggleSpeaker={webrtc.toggleSpeaker}
        onHangUp={() => {
          webrtc.hangUp();
          router.dismissAll();
        }}
      />
    );
  }

  return (
    <IncomingCallScreen
      callerInfo={incomingCall.callerInfo}
      onAccept={() => {
        setAccepted(true);
        acceptCall();
        webrtc.connect();
      }}
      onDecline={() => {
        declineCall();
        router.dismissAll();
      }}
    />
  );
}
