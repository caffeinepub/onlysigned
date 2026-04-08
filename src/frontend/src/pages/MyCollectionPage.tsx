import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  FolderOpen,
  Layers,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ItemType, SaleMethod } from "../backend-types";
import ConnectWall from "../components/ConnectWall";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateCollection,
  useListForSale,
  useMyCollections,
} from "../hooks/useQueries";
import { formatAmount } from "../lib/utils";

type Collection = Record<string, unknown>;

const CURRENCIES = ["ICP", "ckBTC", "ckUSDC", "ckUSDT"] as const;
const SALE_METHODS = ["Direct", "Auction"] as const;

export default function MyCollectionPage() {
  const { identity } = useInternetIdentity();
  if (!identity) {
    return (
      <ConnectWall message="Connect your wallet to manage your collections." />
    );
  }
  return <CollectionContent />;
}

function CollectionContent() {
  const { data: collectionsRaw, isLoading } = useMyCollections();
  const createCollection = useCreateCollection();
  const listForSale = useListForSale();

  const collections = (collectionsRaw as Collection[] | undefined) ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Collection | null>(null);
  const [saleTarget, setSaleTarget] = useState<Collection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [salePrice, setSalePrice] = useState("");
  const [saleCurrency, setSaleCurrency] = useState<string>("ICP");
  const [saleMethod, setSaleMethod] = useState<SaleMethod>(SaleMethod.Direct);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Collection name is required.");
      return;
    }
    try {
      await createCollection.mutateAsync({
        name: newName,
        description: newDesc,
      });
      toast.success("Collection created!");
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
    } catch {
      toast.error("Failed to create collection.");
    }
  };

  const handleListForSale = async () => {
    if (!saleTarget) return;
    try {
      await listForSale.mutateAsync({
        itemType: ItemType.Collection,
        itemId: saleTarget.id as string,
        price: BigInt(Math.floor(Number.parseFloat(salePrice || "0") * 1e8)),
        currency: saleCurrency,
        saleMethod,
      });
      toast.success("Collection listed for sale!");
      setSaleTarget(null);
    } catch {
      toast.error("Failed to list collection.");
    }
  };

  return (
    <div className="space-y-6" data-ocid="my-collections-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            My Collections
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize and manage your digital asset collections
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-accent text-accent-foreground hover:bg-accent/80"
          data-ocid="create-collection-btn"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Collection
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["s1", "s2", "s3"].map((k) => (
            <Skeleton key={k} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 gap-4"
          data-ocid="collections-empty"
        >
          <Layers className="h-12 w-12 text-muted-foreground/30" />
          <div className="text-center">
            <p className="font-display font-semibold text-foreground">
              No collections yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first collection to start organizing your assets
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-accent text-accent-foreground hover:bg-accent/80"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <CollectionCard
              key={col.id as string}
              collection={col}
              onEdit={() => setEditTarget(col)}
              onSale={() => setSaleTarget(col)}
              onDelete={() => setDeleteTarget(col)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">
              Create New Collection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="col-name">Collection Name *</Label>
              <Input
                id="col-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My Collection"
                data-ocid="collection-name-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="col-desc">Description</Label>
              <Textarea
                id="col-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                placeholder="Describe this collection…"
                data-ocid="collection-desc-input"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCreate}
                disabled={createCollection.isPending}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80"
                data-ocid="collection-create-submit"
              >
                {createCollection.isPending ? "Creating…" : "Create Collection"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* List for sale modal */}
      <Dialog open={!!saleTarget} onOpenChange={() => setSaleTarget(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">
              List Collection for Sale
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Listing:{" "}
              <span className="font-medium text-foreground">
                {(saleTarget?.name as string) ?? ""}
              </span>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="sale-price">
                Price{" "}
                <span className="text-muted-foreground text-xs">
                  (0 for free)
                </span>
              </Label>
              <Input
                id="sale-price"
                placeholder="0.00"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                data-ocid="sale-price-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={saleCurrency} onValueChange={setSaleCurrency}>
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
                    {SALE_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleListForSale}
                disabled={listForSale.isPending}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80"
                data-ocid="sale-submit-btn"
              >
                {listForSale.isPending ? "Listing…" : "List for Sale"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSaleTarget(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation modal */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">
              Delete Collection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {(deleteTarget?.name as string) ?? "this collection"}
              </span>
              ? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  toast.success("Collection deleted.");
                  setDeleteTarget(null);
                }}
                data-ocid="delete-confirm-btn"
              >
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit modal (placeholder — same fields as create) */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Collection Name</Label>
              <Input
                id="edit-name"
                defaultValue={(editTarget?.name as string) ?? ""}
                data-ocid="edit-collection-name-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                defaultValue={(editTarget?.description as string) ?? ""}
                rows={3}
                data-ocid="edit-collection-desc-input"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80"
                onClick={() => {
                  toast.success("Collection updated.");
                  setEditTarget(null);
                }}
                data-ocid="edit-collection-save-btn"
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditTarget(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CollectionCard({
  collection,
  onEdit,
  onSale,
  onDelete,
}: {
  collection: Collection;
  onEdit: () => void;
  onSale: () => void;
  onDelete: () => void;
}) {
  const isPublic = !!collection.isPublic;
  const isForSale = !!collection.isForSale;
  const assetCount = (collection.assetIds as unknown[])?.length ?? 0;

  return (
    <Card
      className="bg-card border-border hover:border-accent/30 transition-colors"
      data-ocid="collection-card"
    >
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            to="/collections/$collectionId"
            params={{ collectionId: collection.id as string }}
            className="font-display font-semibold text-foreground hover:text-accent transition-colors line-clamp-1"
            data-ocid="collection-card-link"
          >
            {(collection.name as string) ?? "Untitled"}
          </Link>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isPublic ? (
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {isForSale && (
              <Badge
                variant="outline"
                className="text-[10px] border-accent/40 text-accent px-1"
              >
                <Tag className="h-2.5 w-2.5 mr-0.5" />
                For Sale
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {!!collection.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {collection.description as string}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            <FolderOpen className="h-3 w-3 inline mr-1" />
            {assetCount} assets
          </span>
          {isForSale && !!collection.price && (
            <span className="text-accent">
              {formatAmount(
                collection.price as bigint,
                (collection.currency as "ICP") ?? "ICP",
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-auto">
            <Switch
              checked={isPublic}
              aria-label="Toggle privacy"
              data-ocid="collection-privacy-toggle"
            />
            <span>{isPublic ? "Public" : "Private"}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            data-ocid="collection-edit-btn"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSale}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-accent"
            data-ocid="collection-list-sale-btn"
          >
            <Tag className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            data-ocid="collection-delete-btn"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
