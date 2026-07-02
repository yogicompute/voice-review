"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, ExternalLink, Share2 } from "lucide-react";

export function ShareCard({
  businessName,
  caption,
  shareUrl,
  cardUrl,
}: {
  id: string;
  businessName: string;
  caption: string;
  shareUrl: string;
  cardUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");

  const fullText = `${caption}\n${shareUrl}`;
  const fileName = `${businessName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-review.png`;

  async function copyCaption() {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  }

  // Native share — attaches the actual PNG + caption (mobile / supported browsers).
  async function nativeShare() {
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });

      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ title: businessName, text: fullText, files: [file] });
        return;
      }
      if (nav.share) {
        await nav.share({ title: businessName, text: fullText, url: shareUrl });
        return;
      }
      // Desktop with no share API: copy caption + open the image to save.
      await navigator.clipboard.writeText(fullText);
      window.open(cardUrl, "_blank");
      flash("No native share here — caption copied and card opened to save.");
    } catch {
      /* user cancelled */
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-5 sm:flex-row">
          {/* Card preview */}
          <a
            href={cardUrl}
            target="_blank"
            rel="noreferrer"
            className="block w-full shrink-0 overflow-hidden rounded-xl border border-border sm:w-52"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cardUrl} alt={`${businessName} review card`} className="aspect-square w-full object-cover" />
          </a>

          {/* Actions */}
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm font-medium">{businessName}</p>

            <textarea
              readOnly
              value={caption}
              rows={4}
              className="w-full resize-none rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
            />

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={nativeShare}>
                <Share2 size={14} /> Share
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={cardUrl} download={fileName}>
                  <Download size={14} /> Download
                </a>
              </Button>
              <Button size="sm" variant="outline" onClick={copyCaption}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy caption"}
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <a href={shareUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} /> Preview
                </a>
              </Button>
            </div>

            {notice && <p className="text-xs text-primary">{notice}</p>}
            <p className="text-xs text-muted-foreground/70">
              &ldquo;Share&rdquo; attaches the card image and caption on phones; on desktop, download
              the image and copy the caption to post.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
