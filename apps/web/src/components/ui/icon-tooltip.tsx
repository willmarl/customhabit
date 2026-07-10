import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type IconTooltipButtonProps = ComponentProps<typeof Button> & {
  tooltip: string;
  children: ReactNode;
};

export function IconTooltipButton({
  tooltip,
  children,
  ...props
}: IconTooltipButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

type IconTooltipWrapProps = {
  tooltip: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
};

export function IconTooltipWrap({
  tooltip,
  children,
  side,
}: IconTooltipWrapProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={6}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
