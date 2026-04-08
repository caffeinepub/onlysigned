/**
 * Admin Users Tab — search, list, manage all users, toggle admin, set Certificate Issuer.
 * Click a row to view user detail panel.
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Award,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
  Shield,
  ShieldOff,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { IssuerSubtype } from "../../backend-types";
import {
  useAllUsers,
  useSetCertificateIssuerStatus,
  useSetUserAdmin,
} from "../../hooks/useQueries";
import { formatDate, formatPrincipal } from "../../lib/utils";

interface UserProfile {
  id: string;
  userNumber: bigint | number;
  isAdmin: boolean;
  username?: string | string[];
  displayName: string;
  profileType: string;
  issuerSubtype?: string | string[];
  isVerified: boolean;
  followerCount: bigint | number;
  followeringCount?: bigint | number;
  bio?: string;
  email?: string | string[];
  personalUrl?: string | string[];
  createdAt?: bigint | number;
}

const PAGE_SIZE = 20;
const ISSUER_SUBTYPES = ["Celebrity", "Institution", "Government"] as const;

function toNum(v: bigint | number | undefined): number {
  if (v === undefined) return 0;
  return typeof v === "bigint" ? Number(v) : v;
}

function getUsername(u: UserProfile): string | undefined {
  return Array.isArray(u.username) ? u.username[0] : u.username;
}

function getSubtype(u: UserProfile): string | undefined {
  return Array.isArray(u.issuerSubtype) ? u.issuerSubtype[0] : u.issuerSubtype;
}

function getEmail(u: UserProfile): string | undefined {
  return Array.isArray(u.email) ? u.email[0] : u.email;
}

function getPersonalUrl(u: UserProfile): string | undefined {
  return Array.isArray(u.personalUrl) ? u.personalUrl[0] : u.personalUrl;
}

function isCertIssuer(u: UserProfile): boolean {
  return u.profileType === "CertificateIssuer" || u.profileType === "Issuer";
}

export default function AdminUsersTab() {
  const { data: rawUsers, isLoading } = useAllUsers();
  const setAdminMut = useSetUserAdmin();
  const setCertIssuerMut = useSetCertificateIssuerStatus();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [toggleAdminTarget, setToggleAdminTarget] =
    useState<UserProfile | null>(null);
  const [issuerTarget, setIssuerTarget] = useState<UserProfile | null>(null);
  const [issuerSubtype, setIssuerSubtype] = useState<string>("Celebrity");
  const [detailUser, setDetailUser] = useState<UserProfile | null>(null);

  const users: UserProfile[] = (rawUsers ?? []).map((u) => ({
    id: u.id.toString(),
    userNumber: u.userNumber,
    isAdmin: u.isAdmin,
    username: u.username,
    displayName: u.displayName,
    profileType: String(u.profileType),
    issuerSubtype: u.certIssuerSubtype,
    isVerified: u.isVerified,
    followerCount: u.followerCount,
    followeringCount: u.followingCount,
    bio: u.bio,
    email: u.email,
    personalUrl: u.personalUrl,
    createdAt: u.registrationTime,
  }));

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      const un = getUsername(u) ?? "";
      return (
        u.displayName.toLowerCase().includes(q) ||
        un.toLowerCase().includes(q) ||
        String(toNum(u.userNumber)).includes(q)
      );
    });
  }, [users, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, username, or user number…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="pl-10"
          data-ocid="admin-user-search"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} user{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {["u1", "u2", "u3", "u4", "u5", "u6"].map((k) => (
            <Skeleton key={k} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                {[
                  "#",
                  "Display Name",
                  "Username",
                  "Type",
                  "Badges",
                  "Followers",
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
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No users match your search
                  </td>
                </tr>
              ) : (
                paged.map((user) => {
                  const username = getUsername(user);
                  const subtype = getSubtype(user);
                  const certIssuer = isCertIssuer(user);
                  return (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-muted/20"
                      data-ocid="admin-user-row"
                    >
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {toNum(user.userNumber)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="font-medium text-foreground whitespace-nowrap hover:underline text-sm"
                          onClick={() => setDetailUser(user)}
                        >
                          {user.displayName}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {username ? `@${username}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {certIssuer
                            ? (subtype ?? "Issuer")
                            : user.profileType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {user.isAdmin && (
                            <Shield
                              className="h-4 w-4 text-primary"
                              aria-label="Admin"
                            />
                          )}
                          {user.isVerified && (
                            <BadgeCheck
                              className="h-4 w-4 text-accent"
                              aria-label="Verified"
                            />
                          )}
                          {certIssuer && (
                            <Award
                              className="h-4 w-4 text-chart-2"
                              aria-label="Certificate Issuer"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {toNum(user.followerCount).toLocaleString()}
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5">
                          <Link
                            to="/users/$userId"
                            params={{ userId: user.id }}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1 text-xs"
                              data-ocid="admin-view-profile-link"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-8 text-xs ${user.isAdmin ? "text-destructive" : "text-primary"}`}
                            onClick={() => setToggleAdminTarget(user)}
                            data-ocid="admin-toggle-admin-btn"
                          >
                            {user.isAdmin ? (
                              <ShieldOff className="h-3 w-3 mr-1" />
                            ) : (
                              <Shield className="h-3 w-3 mr-1" />
                            )}
                            {user.isAdmin ? "Revoke" : "Admin"}
                          </Button>
                          {certIssuer ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-destructive"
                              onClick={() =>
                                setCertIssuerMut.mutate(
                                  { target: user.id, isIssuer: false },
                                  {
                                    onSuccess: () =>
                                      toast.success("Issuer status revoked"),
                                    onError: () => toast.error("Failed"),
                                  },
                                )
                              }
                              data-ocid="admin-revoke-issuer-btn"
                            >
                              Revoke Issuer
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-accent"
                              onClick={() => {
                                setIssuerTarget(user);
                                setIssuerSubtype("Celebrity");
                              }}
                              data-ocid="admin-set-issuer-btn"
                            >
                              Set Issuer
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* User Detail Panel */}
      {detailUser && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setDetailUser(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDetailUser(null);
          }}
          role="presentation"
        >
          <div
            className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-base font-semibold text-foreground">
                User Profile
              </h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setDetailUser(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[70vh] px-5 py-4">
              {[
                {
                  label: "User #",
                  value: String(toNum(detailUser.userNumber)),
                },
                { label: "Display Name", value: detailUser.displayName },
                {
                  label: "Username",
                  value: getUsername(detailUser)
                    ? `@${getUsername(detailUser)}`
                    : undefined,
                },
                { label: "Profile Type", value: detailUser.profileType },
                { label: "Issuer Subtype", value: getSubtype(detailUser) },
                { label: "Email", value: getEmail(detailUser) },
                { label: "Personal URL", value: getPersonalUrl(detailUser) },
                {
                  label: "Followers",
                  value: toNum(detailUser.followerCount).toLocaleString(),
                },
                {
                  label: "Joined",
                  value: detailUser.createdAt
                    ? formatDate(detailUser.createdAt)
                    : undefined,
                },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label}>
                    <Label className="text-xs text-muted-foreground">
                      {label}
                    </Label>
                    <p className="mt-0.5 text-sm text-foreground break-all">
                      {value}
                    </p>
                  </div>
                ) : null,
              )}

              {detailUser.bio && (
                <div>
                  <Label className="text-xs text-muted-foreground">Bio</Label>
                  <p className="mt-0.5 text-sm text-foreground">
                    {detailUser.bio}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">
                  Principal
                </Label>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground break-all">
                  {detailUser.id}
                </p>
              </div>

              <Separator className="bg-border" />
              <div className="flex flex-wrap gap-2">
                {detailUser.isAdmin && (
                  <Badge
                    variant="outline"
                    className="border-primary/40 text-primary"
                  >
                    <Shield className="mr-1 h-3 w-3" /> Admin
                  </Badge>
                )}
                {detailUser.isVerified && (
                  <Badge
                    variant="outline"
                    className="border-accent/40 text-accent"
                  >
                    <BadgeCheck className="mr-1 h-3 w-3" /> Verified
                  </Badge>
                )}
                {isCertIssuer(detailUser) && (
                  <Badge
                    variant="outline"
                    className="border-chart-2/40 text-chart-2"
                  >
                    <Award className="mr-1 h-3 w-3" /> Certificate Issuer
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailUser(null)}
              >
                Close
              </Button>
              <Link to="/users/$userId" params={{ userId: detailUser.id }}>
                <Button
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <ExternalLink className="mr-1 h-3 w-3" /> View Public Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Admin Dialog */}
      <AlertDialog
        open={!!toggleAdminTarget}
        onOpenChange={(o) => {
          if (!o) setToggleAdminTarget(null);
        }}
      >
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleAdminTarget?.isAdmin ? "Revoke Admin" : "Grant Admin"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleAdminTarget?.isAdmin
                ? `Remove admin privileges from ${toggleAdminTarget.displayName}?`
                : `Make ${toggleAdminTarget?.displayName} an admin? They will have full platform control.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!toggleAdminTarget) return;
                setAdminMut.mutate(
                  {
                    target: toggleAdminTarget.id,
                    adminValue: !toggleAdminTarget.isAdmin,
                  },
                  {
                    onSuccess: () => {
                      toast.success("Admin status updated");
                      setToggleAdminTarget(null);
                    },
                    onError: () => toast.error("Failed to update admin status"),
                  },
                );
              }}
              className="bg-primary text-primary-foreground"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set Issuer Dialog */}
      <AlertDialog
        open={!!issuerTarget}
        onOpenChange={(o) => {
          if (!o) setIssuerTarget(null);
        }}
      >
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Set Certificate Issuer</AlertDialogTitle>
            <AlertDialogDescription>
              Grant Certificate Issuer status to {issuerTarget?.displayName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <Label
              htmlFor="issuer-subtype-select"
              className="mb-1 block text-sm text-muted-foreground"
            >
              Issuer Subtype
            </Label>
            <Select value={issuerSubtype} onValueChange={setIssuerSubtype}>
              <SelectTrigger
                id="issuer-subtype-select"
                data-ocid="admin-issuer-subtype-select"
              >
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
              onClick={() => {
                if (!issuerTarget) return;
                setCertIssuerMut.mutate(
                  {
                    target: issuerTarget.id,
                    isIssuer: true,
                    subtype:
                      IssuerSubtype[
                        issuerSubtype as keyof typeof IssuerSubtype
                      ],
                  },
                  {
                    onSuccess: () => {
                      toast.success("Certificate Issuer status set");
                      setIssuerTarget(null);
                    },
                    onError: () =>
                      toast.error("Failed to set Certificate Issuer status"),
                  },
                );
              }}
              className="bg-accent text-accent-foreground"
            >
              Set as Issuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
