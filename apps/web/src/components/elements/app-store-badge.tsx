import { Apple } from "lucide-react";

import { SITE } from "@/constants/site";
import { cn } from "@/utils/cn";

interface AppStoreBadgeProps {
  className?: string;
  href?: string;
}

export function AppStoreBadge({
  className,
  href = SITE.appStoreHref,
}: AppStoreBadgeProps) {
  return (
    <a
      aria-label="App Store で Focory を入手"
      className={cn(
        "inline-flex h-14 w-45 items-center gap-2.5 rounded-xl bg-foreground px-4 py-2.5 text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
      href={href}
    >
      <Apple aria-hidden="true" className="size-7 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="text-[0.625rem] opacity-85">Download on the</span>
        <span className="font-semibold text-lg">App Store</span>
      </span>
    </a>
  );
}
