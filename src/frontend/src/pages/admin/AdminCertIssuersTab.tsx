import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Award, BadgeCheck, XCircle } from "lucide-react";
import { ExternalLink } from "lucide-react";
/**
 * Admin Certificate Issuers Tab — manage Certificate Issuers, verify, revoke, change subtype.
 */
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";

function actorCall<T>(
  actor: unknown,
  method: string,
  ...args: unknown[]
): Promise<T> {
  const a = actor as Record<string, (...x: unknown[]) => Promise<T>>;
  if (!a[method]) throw new Error(`Actor method ${method} not available`);
  return a[method](...args);
}

interface UserProfile {
  id: string;
  userNumber: bigint | number;
  displayName: string;
  username?: string[];
  profileType: string;
  issuerSubtype?: string[];
  isVerified: boolean;
  followerCount: bigint | number;
  isAdmin: boolean;
}

const ISSUER_SUBTYPES = ["Celebrity", "Institution", "Government"];

const SUBTYPE_COLORS: Record<string, string> = {
  Celebrity: "border-chart-3/40 text-chart-3",
  Institution: "border-primary/40 text-primary",
  Government: "border-chart-5/40 text-chart-5",
};

export default function AdminCertIssuersTab() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [revokeTarget, setRevokeTarget] = useState<UserProfile | null>(null);
  const [changeSubtypeTarget, setChangeSubtypeTarget] =
    useState<UserProfile | null>(null);
  const [newSubtype, setNewSubtype] = useState("Celebrity");

  const { data: rawUsers, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => actorCall(actor, "getAllUsers"),
    enabled: !!actor && !isFetching,
  });

  const allUsers = (rawUsers ?? []) as UserProfile[];
  const issuers = allUsers.filter(
    (u) => u.profileType === "CertificateIssuer" || u.profileType === "Issuer",
  );
  const pendingVerification = allUsers.filter(
    (u) =>
      !(u.profileType === "CertificateIssuer" || u.profileType === "Issuer") &&
      typeof u.followerCount !== "undefined" &&
      (typeof u.followerCount === "bigint"
        ? Number(u.followerCount)
        : u.followerCount) >= 500,
  );

  const setCertIssuerMut = useMutation({
    mutationFn: ({
      userId,
      isIssuer,
      subtype,
    }: { userId: string; isIssuer: boolean; subtype?: string }) =>
      actorCall(
        actor,
        "setCertificateIssuerStatus",
        userId,
        isIssuer,
        subtype ?? null,
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      if (vars.isIssuer) {
        toast.success("Certificate Issuer status granted");
      } else {
        toast.success("Certificate Issuer status revoked");
      }
      setRevokeTarget(null);
      setChangeSubtypeTarget(null);
    },
    onError: () => toast.error("Failed to update Certificate Issuer status"),
  });

  function toNum(v: bigint | number): number {
    return typeof v === "bigint" ? Number(v) : v;
  }

  function getSubtype(user: UserProfile): string {
    return (
      (Array.isArray(user.issuerSubtype)
        ? user.issuerSubtype[0]
        : user.issuerSubtype) ?? "Unknown"
    );
  }

  return (
    <div className="space-y-8">
      {/* Active Certificate Issuers */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Active Certificate Issuers
          </h2>
          <Badge className="bg-accent/20 text-accent border-0">
            {issuers.length}
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {["c1", "c2", "c3", "c4"].map((k) => (
              <Skeleton key={k} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : issuers.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-6 py-10 text-center">
            <Award className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No Certificate Issuers yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  {[
                    "Display Name",
                    "Username",
                    "Subtype",
                    "Followers",
                    "Verified",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {issuers.map((user) => {
                  const subtype = getSubtype(user);
                  const username = Array.isArray(user.username)
                    ? user.username[0]
                    : user.username;
                  return (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-muted/20"
                      data-ocid="admin-issuer-row"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {user.displayName}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground text-xs">
                        {username ? `@${username}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${SUBTYPE_COLORS[subtype] ?? "border-border text-muted-foreground"}`}
                        >
                          {subtype}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {toNum(user.followerCount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.isVerified ? (
                          <BadgeCheck className="inline h-4 w-4 text-accent" />
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to="/users/$userId"
                            params={{ userId: user.id }}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 text-xs"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-primary"
                            onClick={() => {
                              setChangeSubtypeTarget(user);
                              setNewSubtype(subtype);
                            }}
                            data-ocid="admin-change-subtype-btn"
                          >
                            Change Subtype
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive"
                            onClick={() => setRevokeTarget(user)}
                            data-ocid="admin-revoke-issuer-btn"
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Revoke
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pending Verification (eligible but not yet issuers) */}
      {pendingVerification.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Pending Verification
            </h2>
            <Badge variant="outline" className="border-chart-3/40 text-chart-3">
              {pendingVerification.length} eligible
            </Badge>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            These users have 500+ followers and are eligible to become
            Certificate Issuers.
          </p>
          <div className="space-y-3">
            {pendingVerification.map((user) => {
              const username = Array.isArray(user.username)
                ? user.username[0]
                : user.username;
              return (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3"
                  data-ocid="admin-pending-issuer-row"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {username ? `@${username} • ` : ""}
                      {toNum(user.followerCount).toLocaleString()} followers
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      defaultValue="Celebrity"
                      onValueChange={(v) => {
                        setCertIssuerMut.mutate({
                          userId: user.id,
                          isIssuer: true,
                          subtype: v,
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ISSUER_SUBTYPES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="h-8 bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={() =>
                        setCertIssuerMut.mutate({
                          userId: user.id,
                          isIssuer: true,
                          subtype: "Celebrity",
                        })
                      }
                      data-ocid="admin-verify-issuer-btn"
                    >
                      <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                      Verify
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Revoke Confirm Dialog */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(o) => {
          if (!o) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Revoke Certificate Issuer Status
            </AlertDialogTitle>
            <AlertDialogDescription>
              Remove Certificate Issuer status from {revokeTarget?.displayName}?
              They will no longer be able to sign and certify assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                revokeTarget &&
                setCertIssuerMut.mutate({
                  userId: revokeTarget.id,
                  isIssuer: false,
                })
              }
              className="bg-destructive text-destructive-foreground"
            >
              Revoke Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Subtype Dialog */}
      <AlertDialog
        open={!!changeSubtypeTarget}
        onOpenChange={(o) => {
          if (!o) setChangeSubtypeTarget(null);
        }}
      >
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Change Issuer Subtype</AlertDialogTitle>
            <AlertDialogDescription>
              Update the Certificate Issuer subtype for{" "}
              {changeSubtypeTarget?.displayName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <Select value={newSubtype} onValueChange={setNewSubtype}>
              <SelectTrigger data-ocid="admin-change-subtype-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ISSUER_SUBTYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                changeSubtypeTarget &&
                setCertIssuerMut.mutate({
                  userId: changeSubtypeTarget.id,
                  isIssuer: true,
                  subtype: newSubtype,
                })
              }
              className="bg-primary text-primary-foreground"
            >
              Update Subtype
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
