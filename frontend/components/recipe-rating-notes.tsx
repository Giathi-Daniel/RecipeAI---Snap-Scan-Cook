"use client";

import { useState, useEffect } from "react";
import { StarRating } from "@/components/star-rating";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type RecipeRatingNotesProps = {
  savedRecipeId: string | null;
  initialRating: number | null;
  initialNotes: string | null;
};

export function RecipeRatingNotes({
  savedRecipeId,
  initialRating,
  initialNotes,
}: RecipeRatingNotesProps) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [notes, setNotes] = useState(initialNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setRating(initialRating);
    setNotes(initialNotes || "");
  }, [initialRating, initialNotes]);

  if (!savedRecipeId) {
    return null;
  }

  async function handleRatingChange(newRating: number) {
    const actualRating = newRating === 0 ? null : newRating;
    setRating(actualRating);
    await saveToDatabase(actualRating, notes);
  }

  function handleNotesChange(newNotes: string) {
    setNotes(newNotes);

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(() => {
      saveToDatabase(rating, newNotes);
    }, 1000);

    setSaveTimeout(timeout);
  }

  async function saveToDatabase(newRating: number | null, newNotes: string) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const { error } = await supabase
        .from("saved_recipes")
        .update({
          rating: newRating,
          notes: newNotes || null,
        })
        .eq("id", savedRecipeId);

      if (error) {
        setSaveMessage("Failed to save");
        console.error("Save error:", error);
      } else {
        setSaveMessage("Saved");
        setTimeout(() => setSaveMessage(null), 2000);
      }
    } catch (err) {
      setSaveMessage("Failed to save");
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="border border-sand bg-white p-6 print:hidden">
      <h3 className="font-display text-2xl text-ink">Your Rating & Notes</h3>
      <p className="mt-2 text-sm text-ink/70">
        Rate this recipe and add your personal cooking notes or modifications.
      </p>

      <div className="mt-5 space-y-5">
        <div>
          <label className="block text-sm font-semibold uppercase tracking-[0.16em] text-ink/55">
            Your Rating
          </label>
          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={rating} onRatingChange={handleRatingChange} size="lg" />
            {rating && (
              <span className="text-sm font-semibold text-ink">
                {rating} star{rating > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="recipe-notes"
              className="block text-sm font-semibold uppercase tracking-[0.16em] text-ink/55"
            >
              Personal Notes
            </label>
            {isSaving && (
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">
                Saving...
              </span>
            )}
            {saveMessage && !isSaving && (
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  saveMessage === "Saved" ? "text-herb" : "text-rose-700"
                }`}
              >
                {saveMessage}
              </span>
            )}
          </div>
          <textarea
            id="recipe-notes"
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add your cooking tips, modifications, or reminders here..."
            rows={6}
            className="mt-3 w-full border border-sand bg-canvas px-4 py-3 text-sm leading-6 text-ink outline-none transition focus:border-accent"
          />
          <p className="mt-2 text-xs text-ink/50">
            Notes save automatically as you type. Only you can see these notes.
          </p>
        </div>
      </div>
    </div>
  );
}
