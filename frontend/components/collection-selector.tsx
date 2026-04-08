"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

type Collection = {
  id: string;
  name: string;
  description: string | null;
  recipe_count: number;
};

type CollectionSelectorProps = {
  selectedCollectionIds: string[];
  onSelectionChange: (collectionIds: string[]) => void;
  collections: Collection[];
  onCreateNew?: () => void;
};

export function CollectionSelector({
  selectedCollectionIds,
  onSelectionChange,
  collections,
  onCreateNew,
}: CollectionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleCollection = (collectionId: string) => {
    if (selectedCollectionIds.includes(collectionId)) {
      onSelectionChange(selectedCollectionIds.filter((id) => id !== collectionId));
    } else {
      onSelectionChange([...selectedCollectionIds, collectionId]);
    }
  };

  const selectedCount = selectedCollectionIds.length;

  return (
    <div className="relative">
      <label className="block text-sm font-semibold uppercase tracking-wider text-ink/55">
        Collections (Optional)
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-2 w-full border border-sand bg-white px-4 py-3 text-left text-sm text-ink transition hover:border-accent"
      >
        {selectedCount === 0
          ? "Select collections..."
          : `${selectedCount} collection${selectedCount === 1 ? "" : "s"} selected`}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto border border-sand bg-white">
            {collections.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-ink/70">No collections yet</p>
                {onCreateNew && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onCreateNew();
                    }}
                    className="mt-2 text-sm font-semibold text-accent hover:underline"
                  >
                    Create your first collection
                  </button>
                )}
              </div>
            ) : (
              <>
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => toggleCollection(collection.id)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-sand px-4 py-3 text-left transition hover:bg-canvas",
                      selectedCollectionIds.includes(collection.id) && "bg-canvas",
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 border border-sand transition",
                        selectedCollectionIds.includes(collection.id)
                          ? "border-ink bg-ink"
                          : "bg-white",
                      )}
                    >
                      {selectedCollectionIds.includes(collection.id) && (
                        <svg
                          className="h-full w-full text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink">{collection.name}</p>
                      {collection.description && (
                        <p className="mt-1 text-xs text-ink/60">{collection.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-ink/45">{collection.recipe_count}</span>
                  </button>
                ))}
                {onCreateNew && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onCreateNew();
                    }}
                    className="w-full border-t border-sand bg-canvas px-4 py-3 text-left text-sm font-semibold text-accent transition hover:bg-sand"
                  >
                    + Create New Collection
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
