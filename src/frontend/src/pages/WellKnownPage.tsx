import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Copy, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

const VERIFICATION_TEXT = "domain-verification=onlysigned.com";

export default function WellKnownPage() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = ".well-known | OnlySigned";
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(VERIFICATION_TEXT);
    } catch {
      // Fallback for restricted contexts (iOS Safari, non-HTTPS)
      const ta = document.createElement("textarea");
      ta.value = VERIFICATION_TEXT;
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="max-w-xl mx-auto pt-8 space-y-6"
      data-ocid="well-known-page"
    >
      <div className="text-center space-y-2">
        <div className="h-12 w-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto">
          <ShieldCheck className="h-6 w-6 text-accent" />
        </div>
        <h1 className="font-display font-bold text-2xl text-foreground">
          Domain Verification
        </h1>
        <p className="text-sm text-muted-foreground">
          /.well-known endpoint for OnlySigned
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="pt-6 space-y-5">
          {/* Plain text output — the actual verification response */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Verification Response
            </p>
            <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-4 py-3">
              <code className="flex-1 font-mono text-sm text-foreground break-all select-all">
                {VERIFICATION_TEXT}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-shrink-0 min-h-[44px] sm:min-h-[36px] gap-1.5 text-xs border-border"
                data-ocid="well-known-copy-btn"
                aria-label="Copy verification text"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                    <span className="text-accent">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Active Endpoints
            </p>
            <div className="bg-muted/20 rounded-lg p-3 space-y-1.5 font-mono text-xs text-muted-foreground">
              <p>https://onlysigned.com/.well-known</p>
              <p>https://onlysigned-3nt.caffeine.xyz/.well-known</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Both endpoints return the verification text above, served by the
              backend canister's{" "}
              <code className="bg-muted/40 px-1 rounded">wellKnown()</code>{" "}
              function.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
