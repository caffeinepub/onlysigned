/**
 * Admin Settings Tab — Admin role reassignment (Reclaim Admin) and canister ID manual override.
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy, ServerCog, Shield, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { useReclaimAdmin } from "../../hooks/useQueries";
import { copyToClipboard, formatPrincipal } from "../../lib/utils";

function detectEnvCanisterId(): string | null {
  const v1 = import.meta.env.VITE_BACKEND_CANISTER_ID as string | undefined;
  if (v1) return v1;
  const v2 = import.meta.env.VITE_CANISTER_ID_BACKEND as string | undefined;
  if (v2) return v2;
  return null;
}

export default function AdminSettingsTab() {
  const { principal } = useAuth();
  const reclaimAdmin = useReclaimAdmin();

  const detectedId = detectEnvCanisterId();
  const [manualId, setManualId] = useState(detectedId ?? "");
  const [copiedId, setCopiedId] = useState(false);

  const activeCanisterId = manualId.trim() || detectedId;

  const handleCopyId = async () => {
    if (!activeCanisterId) return;
    const ok = await copyToClipboard(activeCanisterId);
    if (ok) {
      setCopiedId(true);
      toast.success("Canister ID copied");
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      toast.error("Failed to copy — please copy manually");
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Admin Role Reassignment */}
      <Card className="border-accent/20 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-accent" />
            Admin Role Reassignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Reassign the admin role to your currently connected principal. This
            is useful to recover admin access or transfer admin privileges. Any
            existing admin will lose their admin status.
          </p>

          {/* Current principal display */}
          {principal ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-foreground">
                  Your Principal
                </span>
                <Badge
                  variant="outline"
                  className="ml-auto border-accent/40 text-accent text-xs"
                >
                  Connected
                </Badge>
              </div>
              <p className="font-mono text-xs text-muted-foreground break-all">
                {principal.toText()}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                No principal connected
              </p>
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-accent/40 text-accent hover:bg-accent/10 w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
                data-ocid="admin-reclaim-admin-btn"
                disabled={reclaimAdmin.isPending || !principal}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                {reclaimAdmin.isPending ? "Claiming…" : "Reclaim Admin Role"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-border bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Reclaim Admin Role</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reassign the admin role to your current principal
                  {principal ? ` (${formatPrincipal(principal.toText())})` : ""}
                  . Any existing admin will lose their admin privileges.
                  <br />
                  <br />
                  Your admin badge and full dashboard access will be available
                  immediately after this action.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    reclaimAdmin.mutate(undefined, {
                      onSuccess: () => {
                        toast.success(
                          "Admin role claimed — your access is now active",
                        );
                      },
                      onError: (e) => {
                        toast.error(`Failed: ${e.message}`);
                      },
                    });
                  }}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                  Confirm & Reclaim
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Canister ID Management */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ServerCog className="h-5 w-5 text-primary" />
            Canister ID
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            The backend canister ID is used for DNS configuration, IC dashboard
            monitoring, and ICRC-7 NFT verification.
          </p>

          {/* Auto-detected ID */}
          {detectedId && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Auto-Detected
              </Label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <code className="flex-1 min-w-0 font-mono text-xs text-foreground break-all">
                  {detectedId}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCopyId}
                  aria-label="Copy canister ID"
                  data-ocid="settings-copy-canister-id"
                  className="h-8 w-8 shrink-0"
                >
                  {copiedId ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Manual override */}
          <div className="space-y-1.5">
            <Label
              htmlFor="manual-canister-id"
              className="text-xs text-muted-foreground uppercase tracking-wider"
            >
              Manual Override
            </Label>
            <div className="flex gap-2">
              <Input
                id="manual-canister-id"
                placeholder="aaaaa-aa..."
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="font-mono text-xs"
                data-ocid="settings-manual-canister-id-input"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={async () => {
                  const id = manualId.trim();
                  if (!id) return;
                  const ok = await copyToClipboard(id);
                  if (ok) {
                    setCopiedId(true);
                    toast.success("Canister ID copied");
                    setTimeout(() => setCopiedId(false), 2000);
                  }
                }}
                aria-label="Copy manual canister ID"
                disabled={!manualId.trim()}
              >
                {copiedId ? (
                  <Check className="h-4 w-4 text-accent" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {!detectedId && (
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">
                Auto-detection failed
              </p>
              <p className="text-xs text-muted-foreground">
                To configure automatic detection, set{" "}
                <code className="rounded bg-muted px-1">
                  VITE_BACKEND_CANISTER_ID
                </code>{" "}
                in your environment variables. You can find the canister ID in:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Your Caffeine dashboard → Project → Canisters</li>
                <li>
                  <code className="rounded bg-muted px-1">dfx.json</code> or
                  deployment logs
                </li>
                <li>The IC dashboard at dashboard.internetcomputer.org</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
