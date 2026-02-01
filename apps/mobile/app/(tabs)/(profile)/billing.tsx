import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Receipt } from "lucide-react-native";
import { Header } from "@/components/layout/header";
import { BillingRow } from "@/components/payments/billing-row";
import { EmptyState } from "@/components/layout/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useBillingHistory } from "@/lib/hooks/use-subscription";

export default function BillingScreen() {
  const { data: history, isLoading } = useBillingHistory();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title="Billing History" showBack />
      {isLoading ? (
        <Spinner fullScreen />
      ) : !history?.length ? (
        <EmptyState
          icon={Receipt}
          title="No Billing History"
          description="Your payment history will appear here"
        />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BillingRow
              amount={item.amount}
              currency={item.currency}
              status={item.status}
              createdAt={item.createdAt}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      )}
    </SafeAreaView>
  );
}
