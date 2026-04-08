/**
 * Admin Username NFTs Tab — view all minted NFTs, mint new NFTs, transfer NFTs.
 * Purchase offers have been moved to the dedicated Offers tab.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAllUsernameNFTs,
  useMintUsernameNFT,
  useTransferUsernameNFT,
} from "../../hooks/useQueries";
import { formatDate, formatPrincipal } from "../../lib/utils";

import type { UsernameNFT } from "../../backend-types";

export default function AdminUsernameNFTsTab() {
  const { data: nftsRaw, isLoading } = useAllUsernameNFTs();
  const mintMut = useMintUsernameNFT();
  const transferMut = useTransferUsernameNFT();

  const [mintUsername, setMintUsername] = useState("");
  const [mintPrincipal, setMintPrincipal] = useState("");
  const [transferNftId, setTransferNftId] = useState("");
  const [transferPrincipal, setTransferPrincipal] = useState("");

  const nfts = (nftsRaw ?? []) as UsernameNFT[];

  const handleMint = () => {
    if (!mintUsername.trim() || !mintPrincipal.trim()) return;
    mintMut.mutate(
      { username: mintUsername.trim(), principal: mintPrincipal.trim() },
      {
        onSuccess: () => {
          toast.success(`Username NFT "@${mintUsername}" minted successfully`);
          setMintUsername("");
          setMintPrincipal("");
        },
        onError: (e) => toast.error(`Mint failed: ${e.message}`),
      },
    );
  };

  const handleTransfer = () => {
    if (!transferNftId.trim() || !transferPrincipal.trim()) return;
    transferMut.mutate(
      { username: transferNftId.trim(), toPrincipal: transferPrincipal.trim() },
      {
        onSuccess: () => {
          toast.success("Username NFT transferred successfully");
          setTransferNftId("");
          setTransferPrincipal("");
        },
        onError: (e) => toast.error(`Transfer failed: ${e.message}`),
      },
    );
  };

  return (
    <div className="space-y-8">
      {/* Minted NFTs List */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Minted Username NFTs
          </h2>
          <Badge className="bg-accent/20 text-accent border-0">
            {nfts.length}
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {["n1", "n2", "n3", "n4"].map((k) => (
              <Skeleton key={k} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : nfts.length === 0 ? (
          <div
            className="rounded-lg border border-border bg-card px-6 py-12 text-center"
            data-ocid="admin-nfts-empty"
          >
            <p className="text-muted-foreground">
              No username NFTs have been minted yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  {[
                    "Username",
                    "Owner",
                    "Minted By",
                    "Minted Date",
                    "Transfers",
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
                {nfts.map((nft) => (
                  <tr
                    key={nft.id}
                    className="transition-colors hover:bg-muted/20"
                    data-ocid="admin-nft-row"
                  >
                    <td className="px-4 py-3 font-medium text-accent">
                      @{nft.username}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {formatPrincipal(nft.ownerPrincipal.toString())}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {formatPrincipal(nft.mintedBy.toString())}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                      {formatDate(nft.mintedAt)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-sm">
                      {nft.transferHistory.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Mint + Transfer Forms */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Mint Form */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4 text-accent" />
              Mint New Username NFT
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="mint-username">Username</Label>
              <Input
                id="mint-username"
                placeholder="e.g. satoshi"
                value={mintUsername}
                onChange={(e) => setMintUsername(e.target.value)}
                data-ocid="admin-mint-username-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mint-principal">Owner Principal</Label>
              <Input
                id="mint-principal"
                placeholder="aaaaa-aa…"
                value={mintPrincipal}
                onChange={(e) => setMintPrincipal(e.target.value)}
                data-ocid="admin-mint-principal-input"
              />
            </div>
            <Button
              onClick={handleMint}
              disabled={
                !mintUsername.trim() ||
                !mintPrincipal.trim() ||
                mintMut.isPending
              }
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 min-h-[44px] sm:min-h-[36px]"
              data-ocid="admin-mint-nft-btn"
            >
              {mintMut.isPending ? "Minting…" : "Mint Username NFT"}
            </Button>
            {mintMut.isSuccess && (
              <p className="text-xs text-accent text-center">
                ✓ Minted successfully
              </p>
            )}
            {mintMut.isError && (
              <p className="text-xs text-destructive text-center">
                {mintMut.error?.message ?? "Mint failed"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Transfer Form */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRight className="h-4 w-4 text-primary" />
              Transfer Username NFT
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="transfer-nft">Username</Label>
              <Input
                id="transfer-nft"
                placeholder="username or NFT ID"
                value={transferNftId}
                onChange={(e) => setTransferNftId(e.target.value)}
                data-ocid="admin-transfer-nft-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transfer-principal">New Owner Principal</Label>
              <Input
                id="transfer-principal"
                placeholder="aaaaa-aa…"
                value={transferPrincipal}
                onChange={(e) => setTransferPrincipal(e.target.value)}
                data-ocid="admin-transfer-principal-input"
              />
            </div>
            <Button
              onClick={handleTransfer}
              disabled={
                !transferNftId.trim() ||
                !transferPrincipal.trim() ||
                transferMut.isPending
              }
              variant="outline"
              className="w-full border-primary/40 text-primary hover:bg-primary/10 min-h-[44px] sm:min-h-[36px]"
              data-ocid="admin-transfer-nft-btn"
            >
              {transferMut.isPending ? "Transferring…" : "Transfer NFT"}
            </Button>
            {transferMut.isSuccess && (
              <p className="text-xs text-accent text-center">
                ✓ Transferred successfully
              </p>
            )}
            {transferMut.isError && (
              <p className="text-xs text-destructive text-center">
                {transferMut.error?.message ?? "Transfer failed"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
