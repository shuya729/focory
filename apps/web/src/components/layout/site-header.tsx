import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SITE, SITE_NAV_ITEMS } from "@/constants/site";

export function SiteHeader() {
  return (
    <header className="bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8 lg:px-16">
        <Link
          aria-label={`${SITE.name} ホーム`}
          className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          href="/"
        >
          <Image
            alt={SITE.name}
            className="h-auto w-27.5 sm:w-35"
            height={38}
            priority
            src="/images/logo.png"
            width={140}
          />
        </Link>

        <nav aria-label="メインナビゲーション" className="hidden md:block">
          <ul className="flex items-center gap-10">
            {SITE_NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  className="font-medium text-base text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Popover>
          <PopoverTrigger
            aria-label="メニューを開く"
            className="group inline-flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:hidden"
          >
            <Menu
              aria-hidden="true"
              className="size-5 group-data-[state=open]:hidden"
            />
            <X
              aria-hidden="true"
              className="hidden size-5 group-data-[state=open]:block"
            />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-58 rounded-2xl border-border bg-popover p-2 shadow-md md:hidden"
            sideOffset={8}
          >
            <nav aria-label="モバイルナビゲーション">
              <ul className="flex flex-col gap-1">
                {SITE_NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      className="block rounded-xl px-3.5 py-2.5 font-medium text-foreground text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
