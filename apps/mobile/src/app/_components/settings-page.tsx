import { ChevronRight } from "lucide-react-native";
import { Fragment, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ViewProps,
} from "react-native";
import PageHeaderIconButton from "@/components/elements/page-header-icon-button";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_SETTINGS } from "@/constants/mock-mobile-data";
import { TIMER_PAGE } from "@/constants/pages";
import {
  BEHAVIOR_OPTIONS,
  SETTINGS_LINKS,
} from "@/constants/settings-constants";
import { cn } from "@/utils/cn";

const handleMockSettingsChange = () => undefined;

export interface SettingsPageProps extends Omit<ViewProps, "children"> {
  handleChangePage: (page: number) => void;
}

function SettingsPage({
  collapsable = false,
  className,
  handleChangePage,
  ...props
}: SettingsPageProps) {
  const { objective, purpose, selectedBehavior } = MOCK_SETTINGS;

  return (
    <View
      className={cn("flex-1 px-6 pt-2 pb-4", className)}
      collapsable={collapsable}
      {...props}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 gap-3">
          <View className="flex-row items-center justify-between pt-2">
            <View className="h-11 w-11" />
            <Text className="font-semibold text-lg">設定</Text>
            <PageHeaderIconButton
              accessibilityLabel="タイマー画面に移動"
              onPress={() => handleChangePage(TIMER_PAGE.page)}
            >
              <Icon as={ChevronRight} className="size-5 text-ring" />
            </PageHeaderIconButton>
          </View>

          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-7 py-3">
              <FormSection label="目的">
                <Input
                  className="h-12 rounded-xl border-border bg-card px-4 text-sm shadow-none"
                  editable={false}
                  placeholder="集中したいことを入力"
                  underlineColorAndroid="transparent"
                  value={objective}
                />
              </FormSection>

              <FormSection label="なぜ">
                <Textarea
                  className="min-h-[92px] rounded-xl border-border bg-card px-4 py-3 text-sm leading-6 shadow-none"
                  editable={false}
                  placeholder="なぜそれをやりたいのか、理由を書いてみよう"
                  underlineColorAndroid="transparent"
                  value={purpose}
                />
              </FormSection>

              <FormSection label="振る舞い">
                <View className="gap-2.5">
                  <View className="flex-row gap-2.5">
                    {BEHAVIOR_OPTIONS.slice(0, 3).map((behaviorOption) => (
                      <BehaviorChipButton
                        isSelected={selectedBehavior === behaviorOption.value}
                        key={behaviorOption.value}
                        label={behaviorOption.label}
                        onPress={handleMockSettingsChange}
                      />
                    ))}
                  </View>
                  <View className="flex-row gap-2.5">
                    {BEHAVIOR_OPTIONS.slice(3).map((behaviorOption) => (
                      <BehaviorChipButton
                        isSelected={selectedBehavior === behaviorOption.value}
                        key={behaviorOption.value}
                        label={behaviorOption.label}
                        onPress={handleMockSettingsChange}
                      />
                    ))}
                  </View>
                </View>
              </FormSection>

              <FormSection label="リンク">
                <Card className="gap-0 overflow-hidden rounded-xl border-0 bg-secondary py-0 shadow-none">
                  {SETTINGS_LINKS.map((settingLink, index) => (
                    <Fragment key={settingLink.url}>
                      {index > 0 ? <Separator /> : null}
                      <LinkRow
                        label={settingLink.label}
                        url={settingLink.url}
                      />
                    </Fragment>
                  ))}
                </Card>
              </FormSection>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

interface FormSectionProps {
  children: ReactNode;
  label: string;
}

function FormSection({ children, label }: FormSectionProps) {
  return (
    <View className="gap-2">
      <Label className="font-semibold text-foreground text-sm">{label}</Label>
      {children}
    </View>
  );
}

interface BehaviorChipButtonProps extends Omit<ButtonProps, "variant"> {
  isSelected: boolean;
  label: string;
}

function BehaviorChipButton({
  isSelected,
  label,
  className,
  ...props
}: BehaviorChipButtonProps) {
  return (
    <Button
      accessibilityState={{ selected: isSelected }}
      className={cn("h-10 flex-1 rounded-full shadow-none", className)}
      variant={isSelected ? "default" : "secondary"}
      {...props}
    >
      <Text className="text-center font-medium text-[13px]">{label}</Text>
    </Button>
  );
}

interface LinkRowProps {
  label: string;
  url: string;
}

function LinkRow({ label }: LinkRowProps) {
  return (
    <View className="h-12 flex-row items-center justify-between px-4">
      <Text className="text-sm">{label}</Text>
      <Icon as={ChevronRight} className="size-[18px] text-muted-foreground" />
    </View>
  );
}

export default SettingsPage;
