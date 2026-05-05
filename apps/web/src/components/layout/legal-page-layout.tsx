import { MarkdownRenderer } from "@/components/elements/markdown-renderer";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

interface LegalPageLayoutProps {
  content: string;
  title: string;
  updatedAt: string;
}

export function LegalPageLayout({
  content,
  title,
  updatedAt,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="mx-auto flex max-w-5xl flex-col items-center gap-2.5 px-6 pt-8 pb-6 text-center sm:pt-12 sm:pb-8 lg:px-12">
          <h1 className="font-bold text-[2rem] text-foreground leading-tight tracking-normal sm:text-5xl">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm">
            最終更新日: {updatedAt}
          </p>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 sm:pb-20">
          <article className="rounded-[1.125rem] border border-border/70 bg-card p-6 sm:rounded-3xl sm:p-12 lg:p-14">
            <MarkdownRenderer content={content} />
          </article>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
