import { View, Text, Pressable } from "react-native";
import { Card } from "@/components/ui/card";
import { MessageCircle, Phone, AlertTriangle } from "lucide-react-native";
import { colors } from "@/lib/constants/colors";

interface ActionCardsProps {
  onWhatsApp: () => void;
  onCall: () => void;
  onEmergency: () => void;
}

export function ActionCards({ onWhatsApp, onCall, onEmergency }: ActionCardsProps) {
  const actions = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      description: "Send a message to the owner",
      color: "#25D366",
      onPress: onWhatsApp,
    },
    {
      icon: Phone,
      label: "VoIP Call",
      description: "Call the owner anonymously",
      color: colors.primary,
      onPress: onCall,
    },
    {
      icon: AlertTriangle,
      label: "Emergency",
      description: "Report an emergency incident",
      color: colors.destructive,
      onPress: onEmergency,
    },
  ];

  return (
    <View className="gap-3">
      <Text className="text-lg font-semibold text-foreground">
        Choose an Action
      </Text>
      {actions.map((action) => (
        <Pressable key={action.label} onPress={action.onPress}>
          <Card className="flex-row items-center gap-4">
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: action.color + "15" }}
            >
              <action.icon size={24} color={action.color} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                {action.label}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {action.description}
              </Text>
            </View>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}
