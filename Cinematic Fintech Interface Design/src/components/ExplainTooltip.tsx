import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface ExplainTooltipProps {
  children: string;
  title?: string;
}

export function ExplainTooltip({ children, title }: ExplainTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center justify-center p-1 rounded-full transition-all hover:scale-110"
            style={{
              background: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          className="max-w-xs p-4 backdrop-blur-xl"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {title && <p className="mb-2" style={{ color: "var(--primary)" }}>{title}</p>}
          <p className="text-sm" style={{ color: "var(--foreground)" }}>{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
