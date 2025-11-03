import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft, Plus } from "lucide-react";
import TopRightControls from "@/components/TopRightControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DeviceItem {
  id: string;
  type: "brand" | "model" | "category" | "tag" | "media" | "url";
  name: string;
  value: string;
  description?: string;
  created_at?: string;
}

export default function AdminAddDevice() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"brand" | "model" | "category" | "tag" | "media" | "url" | null>(null);
  const [items, setItems] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleOpenDialog = (type: "brand" | "model" | "category" | "tag" | "media" | "url") => {
    setDialogMode(type);
    setIsDialogOpen(true);
  };

  const handleSave = async (formData: any) => {
    try {
      if (!formData.name) {
        toast({
          title: "Error",
          description: "Name is required",
          variant: "destructive",
        });
        return;
      }

      const newItem: DeviceItem = {
        id: Date.now().toString(),
        type: dialogMode!,
        name: formData.name,
        value: formData.value || "",
        description: formData.description || undefined,
        created_at: new Date().toISOString(),
      };

      setItems([...items, newItem]);
      setIsDialogOpen(false);
      setDialogMode(null);

      toast({
        title: "Success",
        description: `${dialogMode} added successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setItems(items.filter(item => item.id !== id));
    toast({
      title: "Success",
      description: "Item deleted successfully",
    });
  };

  const getTypeLabel = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="page-container">
      <TopRightControls />
      <header className="flex items-center justify-between mb-8 w-full max-w-2xl">
        <div className="flex items-center gap-2">
          <Link to="/admin">
            <Button variant="ghost" size="icon" aria-label="Back to Admin">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="icon" aria-label="Go home">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold">Add Device</h1>
        <div className="w-10" />
      </header>

      <div className="button-container max-w-2xl">
        {["brand", "model", "category", "tag", "media", "url"].map((type) => (
          <Dialog key={type} open={isDialogOpen && dialogMode === type} onOpenChange={(open) => {
            if (!open) {
              setIsDialogOpen(false);
              setDialogMode(null);
            }
          }}>
            <DialogTrigger asChild>
              <button
                className="nav-button flex items-center justify-center gap-2"
                onClick={() => handleOpenDialog(type as any)}
              >
                <Plus size={20} />
                + {getTypeLabel(type)}
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add {getTypeLabel(type)}</DialogTitle>
              </DialogHeader>
              <DeviceItemForm
                type={type as any}
                onSave={handleSave}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setDialogMode(null);
                }}
              />
            </DialogContent>
          </Dialog>
        ))}
      </div>

      <div className="w-full max-w-2xl mt-8 grid gap-4">
        {["brand", "model", "category", "tag", "media", "url"].map((type) => {
          const typeItems = items.filter(item => item.type === type);
          if (typeItems.length === 0) return null;

          return (
            <div key={type} className="border rounded-lg p-4">
              <h2 className="font-bold text-lg mb-4">{getTypeLabel(type)}s</h2>
              <div className="space-y-2">
                {typeItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border rounded flex justify-between items-start bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      {item.value && <div className="text-sm text-muted-foreground">{item.value}</div>}
                      {item.description && <div className="text-sm mt-1">{item.description}</div>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      aria-label="Delete"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="w-full max-w-2xl mt-8 text-center text-muted-foreground">
          <p>Add items by clicking the buttons above</p>
        </div>
      )}
    </div>
  );
}

function DeviceItemForm({
  type,
  onSave,
  onCancel,
}: {
  type: "brand" | "model" | "category" | "tag" | "media" | "url";
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    value: "",
    description: "",
  });

  const getFieldLabels = () => {
    switch (type) {
      case "brand":
        return { name: "Brand Name", value: "Manufacturer", description: "Description" };
      case "model":
        return { name: "Model Name", value: "Model Code", description: "Specifications" };
      case "category":
        return { name: "Category Name", value: "Category Code", description: "Description" };
      case "tag":
        return { name: "Tag Name", value: "Tag ID", description: "Description" };
      case "media":
        return { name: "Media Name", value: "Media URL", description: "Description" };
      case "url":
        return { name: "URL Name", value: "URL Link", description: "Description" };
      default:
        return { name: "Name", value: "Value", description: "Description" };
    }
  };

  const labels = getFieldLabels();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(formData);
        setFormData({ name: "", value: "", description: "" });
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="name">{labels.name}</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder={`Enter ${labels.name.toLowerCase()}`}
        />
      </div>

      <div>
        <Label htmlFor="value">{labels.value}</Label>
        <Input
          id="value"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          placeholder={`Enter ${labels.value.toLowerCase()}`}
        />
      </div>

      <div>
        <Label htmlFor="description">{labels.description}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter description (optional)"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
