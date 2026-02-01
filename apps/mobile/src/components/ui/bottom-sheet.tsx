import { Modal, View, Pressable, type ViewProps } from "react-native";

interface BottomSheetProps extends ViewProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  className,
  ...props
}: BottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50" onPress={onClose} />
      <View
        className={`rounded-t-3xl bg-card px-6 pb-10 pt-6 ${className ?? ""}`}
        {...props}
      >
        <View className="mb-4 h-1 w-10 self-center rounded-full bg-border" />
        {children}
      </View>
    </Modal>
  );
}
