"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyButton({ text, dark }: { text: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={copy}
      className={cn(
        "h-8 w-8 shrink-0",
        dark && "text-muted-foreground/70 hover:text-white hover:bg-gray-800"
      )}
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </Button>
  );
}