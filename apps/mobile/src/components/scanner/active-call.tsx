import { CallInterface } from "./call-interface";

interface ActiveCallProps {
  status: "connecting" | "connected" | "ended";
  duration: number;
  isMuted: boolean;
  isSpeaker: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onHangUp: () => void;
}

export function ActiveCall(props: ActiveCallProps) {
  return <CallInterface {...props} />;
}
