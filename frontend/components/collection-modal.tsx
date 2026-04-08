"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";

type Collection = {
  id: string;
  name: string;
  description: string | null;
  recipe_count: number;
};

type CollectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  editingCollection?: Collection | null;
};

export function CollectionModal({
  isOpen,
  onClose,
  onSave,
  editingCollection,
}: CollectionModalProps) {
  const [name, setName] = useState(editingCollection?.name || "");
  const [description, setDescription] = useState(editingCollection?.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Collection name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(name.trim(), description.trim());
      setName("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save collection");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="w-full max-w-md border border-sand bg-white p-6">
        <h2 className="font-display text-2xl text-ink">
          {editingCollection ? "Edit Collection" : "New Collection"}
        </h2>
        <p className="mt-2 text-sm text-ink/70">
          {editingCollection
            ? "Update your collection details"
            : "Create a new collection to organize your recipes"}
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <div>
            <label htmlFor="collection-name" className="block text-sm font-semibold uppercase tracking-wider text-ink/55">
              Name
            </label>
            <input
              id="collection-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="e.g., Weeknight Dinners"
              disabled={isSaving}
              className="mt-2 w-full border border-sand bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent disabled:opacity-60"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="collection-description" className="block text-sm font-semibold uppercase tracking-wider text-ink/55">
              Description (Optional)
            </label>
            <textarea
              id="collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Quick and easy meals for busy evenings"
              disabled={isSaving}
              className="mt-2 w-full border border-sand bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent disabled:opacity-60"
            />
          </div>

          {error && (
            <div className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-sm border border-ink bg-ink px-6 py-3 text-sm font-semibold text-canvas transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : editingCollection ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="border border-sand bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
