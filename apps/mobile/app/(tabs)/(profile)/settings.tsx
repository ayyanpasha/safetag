import { useState, useEffect } from "react";
import { View, Text, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { updateProfile } from "@/lib/api/auth";
import { useBiometric } from "@/lib/hooks/use-biometric";
import { colors } from "@/lib/constants/colors";

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const bio = useBiometric();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [emergencyContact, setEmergencyContact] = useState(
    user?.emergencyContact ?? ""
  );
  const [dndEnabled, setDndEnabled] = useState(user?.dndEnabled ?? false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    bio.checkAvailability();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateProfile({
      name: name || undefined,
      email: email || undefined,
      emergencyContact: emergencyContact || undefined,
      dndEnabled,
    });
    if (res.success && res.data) setUser(res.data);
    setSaving(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title="Settings" showBack />
      <View className="flex-1 px-4 gap-4 pt-4">
        <Input label="Name" value={name} onChangeText={setName} />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Input
          label="Emergency Contact"
          value={emergencyContact}
          onChangeText={setEmergencyContact}
          keyboardType="phone-pad"
        />

        <Card className="flex-row items-center justify-between">
          <Text className="text-base text-foreground">Do Not Disturb</Text>
          <Switch
            value={dndEnabled}
            onValueChange={setDndEnabled}
            trackColor={{ true: colors.primary }}
          />
        </Card>

        {bio.isAvailable ? (
          <Card className="flex-row items-center justify-between">
            <Text className="text-base text-foreground">Biometric Login</Text>
            <Switch
              value={bio.isEnabled}
              onValueChange={(v) => { v ? bio.enable() : bio.disable(); }}
              trackColor={{ true: colors.primary }}
            />
          </Card>
        ) : null}

        <Button onPress={handleSave} loading={saving}>
          Save
        </Button>
      </View>
    </SafeAreaView>
  );
}
