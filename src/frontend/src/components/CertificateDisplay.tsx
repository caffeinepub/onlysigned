import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn, copyToClipboard, formatDate } from "../lib/utils";

interface Signer {
  principal: string;
  displayName?: string;
  isVerified?: boolean;
  signedAt?: bigint;
  certIssuerType?: string;
}

interface CertificateData {
  id: string;
  sequenceNumber: number | bigint;
  assetTitle: string;
  assetId?: string;
  creatorPrincipal?: string;
  creatorName?: string;
  creatorType?: string;
  signers?: Signer[];
  issuedAt?: bigint;
  shareableUrl?: string;
  icrc7TokenId?: string | bigint;
}

interface CertificateDisplayProps {
  certificate: CertificateData;
  showDownload?: boolean;
  showValidate?: boolean;
  compact?: boolean;
  className?: string;
  onDownload?: () => void;
}

export default function CertificateDisplay({
  certificate,
  showDownload = true,
  showValidate = true,
  compact = false,
  className,
  onDownload,
}: CertificateDisplayProps) {
  const [copying, setCopying] = useState(false);
  const seqNum =
    typeof certificate.sequenceNumber === "bigint"
      ? Number(certificate.sequenceNumber)
      : certificate.sequenceNumber;

  const handleCopyLink = async () => {
    const url = certificate.shareableUrl ?? window.location.href;
    setCopying(true);
    const ok = await copyToClipboard(url);
    if (ok) {
      toast.success("Certificate link copied!");
    } else {
      toast.error("Failed to copy — please copy the URL manually.");
    }
    setTimeout(() => setCopying(false), 1500);
  };

  return (
    <Card
      className={cn(
        "border border-accent/20 bg-card relative overflow-hidden",
        className,
      )}
      data-ocid="certificate-display"
    >
      {/* Decorative top accent bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/60 via-accent to-accent/60" />

      <CardHeader className={cn("pb-3", compact ? "pt-4 px-4" : "pt-5 px-5")}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ShieldCheck className="h-4 w-4 text-accent flex-shrink-0" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Certificate of Authenticity
              </span>
              <Badge
                variant="outline"
                className="border-accent/40 text-accent text-[10px] px-1.5 py-0"
              >
                ICRC-7 NFT
              </Badge>
            </div>
            <h3 className="font-display font-bold text-foreground truncate">
              {certificate.assetTitle}
            </h3>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-display font-bold text-2xl text-accent">
              #{seqNum}
            </div>
            <div className="text-xs text-muted-foreground">Copy</div>
          </div>
        </div>
      </CardHeader>

      <Separator className="opacity-30" />

      <CardContent
        className={cn(
          "space-y-4",
          compact ? "pt-3 px-4 pb-4" : "pt-4 px-5 pb-5",
        )}
      >
        {/* Certificate metadata */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground mb-0.5">Certificate ID</p>
            <p className="font-mono text-foreground truncate">
              {certificate.id.slice(0, 16)}…
            </p>
          </div>
          {certificate.issuedAt && (
            <div>
              <p className="text-muted-foreground mb-0.5">Issued</p>
              <p className="text-foreground">
                {formatDate(certificate.issuedAt)}
              </p>
            </div>
          )}
          {certificate.icrc7TokenId !== undefined && (
            <div className="col-span-2">
              <p className="text-muted-foreground mb-0.5">ICRC-7 Token ID</p>
              <p className="font-mono text-xs text-muted-foreground truncate">
                {certificate.icrc7TokenId.toString()}
              </p>
            </div>
          )}
        </div>

        {/* Creator / Certificate Issuer */}
        {certificate.creatorName && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Certificate Issuer</span>
            <div className="flex items-center gap-1.5">
              {certificate.creatorPrincipal ? (
                <Link
                  to="/users/$userId"
                  params={{ userId: certificate.creatorPrincipal }}
                  className="font-medium text-foreground hover:text-accent transition-colors"
                >
                  {certificate.creatorName}
                </Link>
              ) : (
                <span className="font-medium text-foreground">
                  {certificate.creatorName}
                </span>
              )}
              {certificate.creatorType && (
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 border-border/40 text-muted-foreground"
                >
                  {certificate.creatorType}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Multi-signer list */}
        {certificate.signers && certificate.signers.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Signed by ({certificate.signers.length})
            </p>
            <div className="space-y-1">
              {certificate.signers.map((signer) => (
                <div
                  key={signer.principal}
                  className="flex items-center justify-between text-xs bg-muted/30 rounded px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    {signer.isVerified && (
                      <CheckCircle className="h-3 w-3 text-accent" />
                    )}
                    {signer.displayName ? (
                      <Link
                        to="/users/$userId"
                        params={{ userId: signer.principal }}
                        className="font-medium text-foreground hover:text-accent transition-colors"
                      >
                        {signer.displayName}
                      </Link>
                    ) : (
                      <span className="font-mono text-muted-foreground">
                        {signer.principal.slice(0, 12)}…
                      </span>
                    )}
                    {signer.certIssuerType && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 border-border/40 text-muted-foreground"
                      >
                        {signer.certIssuerType}
                      </Badge>
                    )}
                  </div>
                  {signer.signedAt && (
                    <span className="text-muted-foreground">
                      {formatDate(signer.signedAt)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Authenticity badge */}
        <div className="flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-accent flex-shrink-0" />
          <span className="text-xs text-accent font-medium">
            Verifiable on-chain · Fakes are impossible
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex-1 border-border/60 text-xs min-h-[44px] sm:min-h-[36px]"
            data-ocid="certificate-copy-link"
          >
            {copying ? (
              <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-accent" />
            ) : (
              <Copy className="h-3.5 w-3.5 mr-1.5" />
            )}
            {copying ? "Copied!" : "Copy Link"}
          </Button>

          {showValidate && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1 border-accent/30 text-accent hover:bg-accent/10 text-xs min-h-[44px] sm:min-h-[36px]"
            >
              <Link
                to="/validate"
                search={{ certId: certificate.id }}
                data-ocid="certificate-validate-btn"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Validate
              </Link>
            </Button>
          )}

          {showDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="flex-1 border-border/60 text-xs min-h-[44px] sm:min-h-[36px]"
              data-ocid="certificate-download-btn"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
