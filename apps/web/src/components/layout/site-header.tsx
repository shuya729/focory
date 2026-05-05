import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
                  className="font-medium text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <details className="group relative md:hidden">
          <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
            <Menu aria-hidden="true" className="size-5 group-open:hidden" />
            <X aria-hidden="true" className="hidden size-5 group-open:block" />
            <span className="sr-only">メニューを開く</span>
          </summary>
          <nav
            aria-label="モバイルナビゲーション"
            className="absolute top-12 right-0 z-20 w-56 rounded-xl border border-border bg-surface p-2 shadow-lg"
          >
            <ul className="flex flex-col">
              {SITE_NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    className="block rounded-lg px-3 py-2 font-medium text-foreground text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
