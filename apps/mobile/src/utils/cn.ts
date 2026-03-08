export function cn(...classes: (string | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
