"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { updateProfile } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndStart, setDndStart] = useState("");
  const [dndEnd, setDndEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setEmergencyContact(user.emergencyContact ?? "");
      setDndEnabled(user.dndEnabled);
      setDndStart(user.dndStart ?? "");
      setDndEnd(user.dndEnd ?? "");
    }
  }, [user]);

  async function handleSave() {
    setLoading(true);
    setMessage("");
    const res = await updateProfile({
      name: name || undefined,
      email: email || undefined,
      emergencyContact: emergencyContact || undefined,
      dndEnabled,
      dndStart: dndStart || null,
      dndEnd: dndEnd || null,
    });
    if (res.success && res.data) {
      setUser(res.data);
      setMessage("Settings saved.");
    } else {
      setMessage(res.error ?? "Failed to save.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency">Emergency Contact</Label>
            <Input
              id="emergency"
              type="tel"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="+919876543210"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Do Not Disturb</CardTitle>
          <CardDescription>Schedule quiet hours when notifications are paused.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dnd-toggle">Enable DND</Label>
            <Switch id="dnd-toggle" checked={dndEnabled} onCheckedChange={setDndEnabled} />
          </div>
          {dndEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dnd-start">Start Time</Label>
                <Input id="dnd-start" type="time" value={dndStart} onChange={(e) => setDndStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dnd-end">End Time</Label>
                <Input id="dnd-end" type="time" value={dndEnd} onChange={(e) => setDndEnd(e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {message && (
        <p className="text-sm text-center" role="status" aria-live="polite">
          {message}
        </p>
      )}

      <Button onClick={handleSave} disabled={loading} className="w-full min-h-[44px]">
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
