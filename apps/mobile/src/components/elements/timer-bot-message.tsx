import { Bot } from "lucide-react-native";
import { View } from "react-native";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useTimer } from "@/contexts/timer-context";

function TimerBotMessage() {
  const { timerMessageState } = useTimer();
  const { hasMessage, message } = timerMessageState;

  if (!hasMessage) {
    return null;
  }

  return (
    <View className="w-full flex-row items-end gap-3">
      <Avatar alt="Bot" className="size-12">
        <AvatarFallback className="bg-secondary">
          <Icon as={Bot} className="size-6 text-primary" />
        </AvatarFallback>
      </Avatar>
      <Card className="flex-1 gap-0 rounded-t-3xl rounded-br-3xl rounded-bl-2xl border-0 bg-muted p-4 shadow-none">
        <Text className="text-base text-popover-foreground">{message}</Text>
      </Card>
    </View>
  );
}

export default TimerBotMessage;
