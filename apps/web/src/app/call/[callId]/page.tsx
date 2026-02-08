"use client";

import { useParams } from "next/navigation";
import { VoipCall } from "@/components/scanner/voip-call";

export default function AnswerCallPage() {
  const params = useParams<{ callId: string }>();
  const callId = params?.callId;

  if (!callId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Invalid call ID</p>
      </div>
    );
  }

  return <VoipCall callId={callId} role="receiver" />;
}
