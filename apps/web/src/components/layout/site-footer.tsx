import Image from "next/image";
import Link from "next/link";

import { SITE, SITE_FOOTER_GROUPS, SITE_FOOTER_LINKS } from "@/constants/site";

export function SiteFooter() {
  return (
    <footer className="bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-7 py-10 sm:gap-10 sm:px-8 sm:py-14 lg:px-16 lg:py-16">
        <div className="flex flex-col items-center justify-between gap-10 text-center md:flex-row md:items-start md:text-left">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <Image
              alt={SITE.name}
              className="h-auto w-30 sm:w-35"
              height={38}
              src="/images/logo.png"
              width={140}
            />
            <p className="text-muted-foreground text-sm">{SITE.tagline}</p>
          </div>

          <nav aria-label="フッターナビゲーション">
            <div className="hidden gap-20 md:flex">
              {SITE_FOOTER_GROUPS.map((group) => (
                <div className="flex flex-col gap-3" key={group.title}>
                  <p className="font-semibold text-foreground text-sm">
                    {group.title}
                  </p>
                  <ul className="flex flex-col gap-2.5">
                    {group.links.map((link) => (
                      <li key={`${link.href}-${link.label}`}>
                        <Link
                          className="text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          href={link.href}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <ul className="flex flex-col items-center gap-3 md:hidden">
              {SITE_FOOTER_LINKS.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    className="text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="h-px bg-border" />
        <p className="text-center text-muted-foreground text-xs md:text-left">
          {SITE.copyright}
        </p>
      </div>
    </footer>
  );
}
