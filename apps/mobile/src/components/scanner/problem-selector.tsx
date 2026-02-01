import { View, Text, Pressable } from "react-native";
import type { ProblemType } from "@safetag/shared-types";

interface ProblemSelectorProps {
  selected: ProblemType | null;
  onSelect: (problem: ProblemType) => void;
}

const problems: { value: ProblemType; label: string }[] = [
  { value: "WRONG_PARKING", label: "Wrong Parking" },
  { value: "GETTING_TOWED", label: "Getting Towed" },
  { value: "LIGHTS_ON", label: "Lights On" },
  { value: "BLOCKING_DRIVEWAY", label: "Blocking Driveway" },
  { value: "ALARM_GOING_OFF", label: "Alarm Going Off" },
  { value: "DOOR_OPEN", label: "Door Open" },
  { value: "OTHER", label: "Other" },
];

export function ProblemSelector({ selected, onSelect }: ProblemSelectorProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">
        What's the issue?
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {problems.map((p) => (
          <Pressable
            key={p.value}
            onPress={() => onSelect(p.value)}
            className={`rounded-full border px-4 py-2 ${
              selected === p.value
                ? "border-primary bg-primary/10"
                : "border-border bg-card"
            }`}
          >
            <Text
              className={`text-sm ${
                selected === p.value
                  ? "font-semibold text-primary"
                  : "text-foreground"
              }`}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
