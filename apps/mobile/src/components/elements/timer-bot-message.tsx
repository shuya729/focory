import { View } from "react-native";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useTimer } from "@/contexts/timer-context";

const focoryIcon = require("../../../assets/images/focory.png");

function TimerBotMessage() {
  const { timerMessageState } = useTimer();
  const { hasMessage, message } = timerMessageState;

  if (!hasMessage) {
    return null;
  }

  return (
    <View className="w-full flex-row items-end gap-3">
      <Avatar alt="Focory" className="size-11">
        <AvatarImage source={focoryIcon} />
        <AvatarFallback className="bg-secondary">
          <Text className="font-semibold text-primary text-xs">F</Text>
        </AvatarFallback>
      </Avatar>
      <Card className="flex-1 gap-0 rounded-t-3xl rounded-br-3xl rounded-bl-2xl border-0 bg-muted p-4 shadow-none">
        <Text className="text-base text-popover-foreground">{message}</Text>
      </Card>
    </View>
  );
}

export default TimerBotMessage;
