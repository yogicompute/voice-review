"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { Download, ExternalLink, QrCode } from "lucide-react";
import Link from "next/link";

export function QrCard({
  url,
  dataUrl,
  businessName,
}: {
  url: string;
  dataUrl: string;
  businessName: string;
}) {
  function download() {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${businessName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-voicereview-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode size={15} /> QR review page
        </CardTitle>
        <CardDescription>
          Print this on receipts, tables, or packaging. Customers scan it to leave a voice review —
          no app, no code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="rounded-xl border border-border bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="QR code" width={176} height={176} className="size-44" />
          </div>

          <div className="flex-1 space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Public link
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border bg-secondary px-3 py-2 text-sm">
                  {url}
                </code>
                <CopyButton text={url} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={download}>
                <Download size={14} /> Download PNG
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href={url} target="_blank">
                  <ExternalLink size={14} /> Open page
                </Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Tip: add <code className="rounded bg-secondary px-1">?t=7</code> to the link to tag a
              table or location on the review.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
