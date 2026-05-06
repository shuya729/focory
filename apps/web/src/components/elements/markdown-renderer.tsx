import Link from "next/link";
import Markdown from "react-markdown";

import { cn } from "@/utils/cn";

interface MarkdownRendererProps {
  className?: string;
  content: string;
}

export function MarkdownRenderer({
  className,
  content,
}: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "space-y-6 text-foreground/75 text-sm leading-[1.85] md:text-[0.9375rem]",
        className
      )}
    >
      <Markdown
        components={{
          a({ children, href, node: _node, ...props }) {
            const linkHref = href ?? "#";

            if (linkHref.startsWith("/")) {
              return (
                <Link
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  href={linkHref}
                  {...props}
                >
                  {children}
                </Link>
              );
            }

            return (
              <a
                className="font-medium text-primary underline-offset-4 hover:underline"
                href={linkHref}
                rel="noreferrer"
                target="_blank"
                {...props}
              >
                {children}
              </a>
            );
          },
          blockquote({ children, node: _node, ...props }) {
            return (
              <blockquote
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground italic leading-[1.7]"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          h1({ children, node: _node, ...props }) {
            return (
              <h1
                className="font-bold text-2xl text-foreground tracking-normal md:text-3xl"
                {...props}
              >
                {children}
              </h1>
            );
          },
          h2({ children, node: _node, ...props }) {
            return (
              <h2
                className="pt-2 font-bold text-foreground text-lg tracking-normal md:text-2xl"
                {...props}
              >
                {children}
              </h2>
            );
          },
          li({ children, node: _node, ...props }) {
            return (
              <li className="pl-1 leading-[1.7]" {...props}>
                {children}
              </li>
            );
          },
          ol({ children, node: _node, ...props }) {
            return (
              <ol
                className="list-decimal space-y-2 pl-5 marker:text-primary"
                {...props}
              >
                {children}
              </ol>
            );
          },
          p({ children, node: _node, ...props }) {
            return (
              <p className="leading-[1.85]" {...props}>
                {children}
              </p>
            );
          },
          ul({ children, node: _node, ...props }) {
            return (
              <ul
                className="list-disc space-y-2 pl-5 marker:text-primary"
                {...props}
              >
                {children}
              </ul>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
