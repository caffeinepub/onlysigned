import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Edit2,
  FolderOpen,
  FolderPlus,
  Globe,
  Lock,
  MoreHorizontal,
  ShoppingBag,
  Tag,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Collection, SaleMethod } from "../backend-types";
import ConnectWall from "../components/ConnectWall";
import PageScaffold from "../components/PageScaffold";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin, useMyProfile } from "../hooks/useProfile";
import {
  useCreateCollection,
  useDeleteCollection,
  useMyCollections,
  useSetCollectionForSale,
  useUpdateCollection,
} from "../hooks/useQueries";

const CURRENCIES = ["ICP", "ckBTC", "ckUSDC", "ckUSDT"] as const;

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function CollectionsPage() {
  const { identity } = useInternetIdentity();
  if (!identity) {
    return (
      <ConnectWall message="Connect your wallet to manage your collections." />
    );
  }
  return <CollectionsContent />;
}

// ─── Content ──────────────────────────────────────────────────────────────────

function CollectionsContent() {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const isAdmin = useIsAdmin();
  const { data: collections, isLoading: collectionsLoading } =
    useMyCollections();

  const isCertificateIssuer = profile?.profileType === "CertificateIssuer";
  const isEligible = isAdmin || isCertificateIssuer;

  const [createOpen, setCreateOpen] = useState(false);

  if (profileLoading) {
    return (
      <PageScaffold title="Collections">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </PageScaffold>
    );
  }

  if (!isEligible) {
    return (
      <PageScaffold
        title="Collections"
        description="Organize your digital assets into named collections"
      >
        <UpgradePrompt />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      title="Collections"
      description="Organize and manage your digital asset collections"
      actions={
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[36px]"
          data-ocid="create-collection-btn"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          <span>New Collection</span>
        </Button>
      }
    >
      {collectionsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : !collections || collections.length === 0 ? (
        <EmptyState onCreateClick={() => setCreateOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <CollectionCard key={col.id} collection={col} />
          ))}
        </div>
      )}

      <CreateCollectionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </PageScaffold>
  );
}

// ─── Collection Card ──────────────────────────────────────────────────────────

function CollectionCard({ collection }: { collection: Collection }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [listForSaleOpen, setListForSaleOpen] = useState(false);

  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();
  const setForSale = useSetCollectionForSale();

  const handleTogglePrivacy = async () => {
    try {
      await updateCollection.mutateAsync({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        privacyPublic: !collection.privacyPublic,
        forSale: collection.forSale,
        salePrice: collection.salePrice,
        saleCurrency: collection.saleCurrency,
        saleMethod: collection.saleMethod,
      });
      toast.success(
        !collection.privacyPublic
          ? "Collection made public"
          : "Collection set to private",
      );
    } catch {
      toast.error("Failed to update privacy.");
    }
  };

  const handleDelist = async () => {
    try {
      await setForSale.mutateAsync({
        id: collection.id,
        forSale: false,
        salePrice: BigInt(0),
        saleCurrency: "ICP",
        saleMethod: "Direct" as SaleMethod,
      });
      toast.success("Collection delisted.");
    } catch {
      toast.error("Failed to delist collection.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCollection.mutateAsync(collection.id);
      toast.success("Collection deleted.");
      setDeleteConfirmOpen(false);
    } catch {
      toast.error("Failed to delete collection.");
    }
  };

  return (
    <Card
      className="bg-card border-border card-hover flex flex-col"
      data-ocid="collection-card"
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FolderOpen className="h-4 w-4 text-accent flex-shrink-0" />
            <Link
              to="/collections/$collectionId"
              params={{ collectionId: collection.id }}
              className="font-display font-semibold text-foreground truncate hover:text-accent transition-colors"
              data-ocid="collection-name-link"
            >
              {collection.name}
            </Link>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge
              variant="outline"
              className={
                collection.privacyPublic
                  ? "border-accent/40 text-accent text-[10px]"
                  : "border-border text-muted-foreground text-[10px]"
              }
            >
              {collection.privacyPublic ? (
                <Globe className="h-2.5 w-2.5 mr-1" />
              ) : (
                <Lock className="h-2.5 w-2.5 mr-1" />
              )}
              {collection.privacyPublic ? "Public" : "Private"}
            </Badge>
          </div>
        </div>
        {collection.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {collection.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between gap-3">
        {/* Sale status */}
        {collection.forSale && (
          <div className="flex items-center gap-2 bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">
            <Tag className="h-3.5 w-3.5 text-accent flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-accent truncate">
                Listed for{" "}
                {collection.salePrice === BigInt(0)
                  ? "Free"
                  : `${Number(collection.salePrice) / 1e8} ${collection.saleCurrency}`}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {collection.saleMethod}
              </p>
            </div>
          </div>
        )}

        <Separator className="opacity-30" />

        {/* Actions row */}
        <div className="flex flex-wrap gap-2">
          {/* Privacy toggle */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Switch
              checked={collection.privacyPublic}
              onCheckedChange={handleTogglePrivacy}
              disabled={updateCollection.isPending}
              data-ocid="collection-privacy-toggle"
            />
            <span className="text-xs text-muted-foreground">
              {collection.privacyPublic ? "Public" : "Private"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* List / Delist */}
            {collection.forSale ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelist}
                disabled={setForSale.isPending}
                className="text-muted-foreground hover:text-destructive h-8 px-2 text-xs min-h-[44px] sm:min-h-[32px]"
                data-ocid="delist-collection-btn"
              >
                <ShoppingBag className="h-3 w-3 mr-1" />
                Delist
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setListForSaleOpen(true)}
                className="text-muted-foreground hover:text-accent h-8 px-2 text-xs min-h-[44px] sm:min-h-[32px]"
                data-ocid="list-for-sale-btn"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Sell
              </Button>
            )}

            {/* Edit */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]"
              onClick={() => setEditOpen(true)}
              aria-label="Edit collection"
              data-ocid="edit-collection-btn"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]"
              onClick={() => setDeleteConfirmOpen(true)}
              aria-label="Delete collection"
              data-ocid="delete-collection-btn"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Edit dialog */}
      <EditCollectionDialog
        collection={collection}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      {/* List for Sale dialog */}
      <ListForSaleDialog
        collection={collection}
        open={listForSaleOpen}
        onClose={() => setListForSaleOpen(false)}
      />

      {/* Delete confirm dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Delete Collection?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {collection.name}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="min-h-[44px] sm:min-h-[36px]"
              data-ocid="delete-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCollection.isPending}
              className="min-h-[44px] sm:min-h-[36px]"
              data-ocid="delete-confirm-btn"
            >
              {deleteCollection.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Create Collection Dialog ─────────────────────────────────────────────────

function CreateCollectionDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Collection name is required.");
      return;
    }
    try {
      const id = await createCollection.mutateAsync({ name, description });
      // Apply privacy setting after create (create doesn't accept privacy flag directly)
      if (isPublic && id) {
        await updateCollection.mutateAsync({
          id: id as string,
          name,
          description,
          privacyPublic: true,
          forSale: false,
          salePrice: BigInt(0),
          saleCurrency: "ICP",
          saleMethod: "Direct" as SaleMethod,
        });
      }
      toast.success("Collection created!");
      setName("");
      setDescription("");
      setIsPublic(false);
      onClose();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to create collection.";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FolderPlus className="h-4 w-4 text-accent" />
            New Collection
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="create-col-name">Name *</Label>
            <Input
              id="create-col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Digital Art Series 2026"
              data-ocid="collection-name-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-col-desc">Description</Label>
            <Textarea
              id="create-col-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe this collection…"
              data-ocid="collection-desc-input"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              data-ocid="create-collection-privacy-toggle"
            />
            <Label className="text-sm">
              {isPublic ? "Public" : "Private (default)"}
            </Label>
          </div>
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="min-h-[44px] sm:min-h-[36px]"
            data-ocid="create-collection-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createCollection.isPending}
            className="bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[36px]"
            data-ocid="create-collection-submit-btn"
          >
            {createCollection.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Collection Dialog ───────────────────────────────────────────────────

function EditCollectionDialog({
  collection,
  open,
  onClose,
}: {
  collection: Collection;
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [isPublic, setIsPublic] = useState(collection.privacyPublic);
  const updateCollection = useUpdateCollection();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Collection name is required.");
      return;
    }
    try {
      await updateCollection.mutateAsync({
        id: collection.id,
        name,
        description,
        privacyPublic: isPublic,
        forSale: collection.forSale,
        salePrice: collection.salePrice,
        saleCurrency: collection.saleCurrency,
        saleMethod: collection.saleMethod,
      });
      toast.success("Collection updated.");
      onClose();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to update collection.";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-accent" />
            Edit Collection
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-col-name">Name *</Label>
            <Input
              id="edit-col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-ocid="edit-collection-name-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-col-desc">Description</Label>
            <Textarea
              id="edit-col-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-ocid="edit-collection-desc-input"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              data-ocid="edit-collection-privacy-toggle"
            />
            <Label className="text-sm">{isPublic ? "Public" : "Private"}</Label>
          </div>
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="min-h-[44px] sm:min-h-[36px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateCollection.isPending}
            className="bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[36px]"
            data-ocid="edit-collection-save-btn"
          >
            {updateCollection.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── List for Sale Dialog ─────────────────────────────────────────────────────

function ListForSaleDialog({
  collection,
  open,
  onClose,
}: {
  collection: Collection;
  open: boolean;
  onClose: () => void;
}) {
  const [price, setPrice] = useState("0");
  const [currency, setCurrency] = useState<string>("ICP");
  const [saleMethod, setSaleMethod] = useState<SaleMethod>(
    "Direct" as SaleMethod,
  );
  const setForSale = useSetCollectionForSale();

  const handleList = async () => {
    const priceNum = Number.parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast.error("Price must be a valid number (0 for free).");
      return;
    }
    try {
      await setForSale.mutateAsync({
        id: collection.id,
        forSale: true,
        salePrice: BigInt(Math.floor(priceNum * 1e8)),
        saleCurrency: currency,
        saleMethod,
      });
      toast.success("Collection listed for sale!");
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to list collection.";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            List for Sale
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Listing{" "}
            <span className="font-medium text-foreground">
              {collection.name}
            </span>{" "}
            on the marketplace.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="sale-price">
              Price{" "}
              <span className="text-xs text-muted-foreground">
                (0 for free)
              </span>
            </Label>
            <Input
              id="sale-price"
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              data-ocid="sale-price-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger data-ocid="sale-currency-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sale Method</Label>
              <Select
                value={saleMethod}
                onValueChange={(v) => setSaleMethod(v as SaleMethod)}
              >
                <SelectTrigger data-ocid="sale-method-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct">Direct</SelectItem>
                  <SelectItem value="Auction">Auction</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="min-h-[44px] sm:min-h-[36px]"
            data-ocid="list-for-sale-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            onClick={handleList}
            disabled={setForSale.isPending}
            className="bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[36px]"
            data-ocid="list-for-sale-submit-btn"
          >
            {setForSale.isPending ? "Listing…" : "List for Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 gap-6 text-center"
      data-ocid="collections-empty-state"
    >
      <div className="w-20 h-20 rounded-full bg-muted/40 border border-border flex items-center justify-center">
        <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h3 className="font-display text-lg font-bold text-foreground">
          No Collections Yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Create your first collection to organize your digital assets and issue
          signed certificates.
        </p>
      </div>
      <Button
        onClick={onCreateClick}
        className="bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[36px]"
        data-ocid="empty-create-collection-btn"
      >
        <FolderPlus className="h-4 w-4 mr-2" />
        Create First Collection
      </Button>
    </div>
  );
}

// ─── Upgrade Prompt ───────────────────────────────────────────────────────────

function UpgradePrompt() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 gap-6 text-center max-w-md mx-auto"
      data-ocid="collections-upgrade-prompt"
    >
      <div className="w-20 h-20 rounded-full bg-muted/40 border border-border flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-lg font-bold text-foreground">
          Certificate Issuer Access Required
        </h3>
        <p className="text-sm text-muted-foreground">
          Collections are available to Certificate Issuers. Upgrade your profile
          type to create collections and issue signed certificates.
        </p>
      </div>
      <Button
        asChild
        className="bg-accent text-accent-foreground hover:bg-accent/80 min-h-[44px] sm:min-h-[36px]"
        data-ocid="upgrade-profile-btn"
      >
        <Link to="/profile">Upgrade Profile</Link>
      </Button>
    </div>
  );
}
