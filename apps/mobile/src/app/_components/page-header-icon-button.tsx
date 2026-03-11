import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface PageHeaderIconButtonProps extends ButtonProps {}

function PageHeaderIconButton({
  className,
  hitSlop = 8,
  size = "icon",
  variant = "ghost",
  ...props
}: PageHeaderIconButtonProps) {
  return (
    <Button
      className={cn("h-11 w-11 rounded-full shadow-none", className)}
      hitSlop={hitSlop}
      size={size}
      variant={variant}
      {...props}
    />
  );
}

export default PageHeaderIconButton;
