import Image from "next/image";

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
        "inline-flex h-12 w-40 shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-14 sm:w-45",
        className
      )}
      href={href}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="size-full object-contain"
        height={40}
        src="/images/app-store-badge.svg"
        unoptimized
        width={109}
      />
    </a>
  );
}
