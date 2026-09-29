"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEditorContext } from "./editor-context";
import { createClient } from "@/lib/supabase/client";

interface VerseContent {
  verse: number;
  text: string;
}

export function VersePanel() {
  const { isPanelOpen, closeVersePanel, selectedVerse } =
    useEditorContext();

  const [verseContent, setVerseContent] = useState<VerseContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!selectedVerse || !isPanelOpen) return;

    const verse = selectedVerse;

    async function fetchVerses() {
      setLoading(true);
      setVerseContent([]);

      const supabase = createClient();

      const startVerse = verse.verse;
      const endVerse = verse.verseEnd ?? verse.verse;

      const { data, error } = await supabase
        .from("bible_verses")
        .select("verse, text")
        .eq("book_number", verse.book)
        .eq("chapter", verse.chapter)
        .gte("verse", startVerse)
        .lte("verse", endVerse)
        .order("verse", { ascending: true });

      if (error) {
        console.error("Error fetching verses:", error);
        setVerseContent([]);
      } else {
        setVerseContent(data ?? []);
      }

      setLoading(false);
    }

    fetchVerses();
  }, [selectedVerse, isPanelOpen]);

  if (!isPanelOpen || !selectedVerse) return null;

  const content = (
    <div className="flex flex-col gap-4">
      {loading ? (
        <div className="flex items-center justify-center p-8 text-[var(--ink-muted)]">
          <Loader2 className="animate-spin w-6 h-6" />
        </div>
      ) : verseContent.length === 0 ? (
        <p className="text-body font-sans text-[var(--ink-muted)]">
          Não foi possível carregar o texto deste versículo.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {verseContent.map((verse) => (
            <p
              key={verse.verse}
              className="text-body font-sans text-[var(--ink)] leading-relaxed"
            >
              <sup className="font-semibold text-[var(--accent)] mr-1">
                {verse.verse}
              </sup>

              {verse.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        open={isPanelOpen}
        onClose={closeVersePanel}
        title={selectedVerse.text}
        description="Tradução do Novo Mundo"
      >
        <div className="pt-2">{content}</div>
      </Drawer>
    );
  }

  return (
    <div className="verse-side-panel">
      <Card
        padding="md"
        className="sticky top-4 border-[var(--accent)]/30 shadow-md"
      >
        <div className="flex items-center justify-between mb-4 border-b border-[var(--border)] pb-3">
          <div>
            <h3 className="font-display font-semibold text-lg text-[var(--primary)]">
              {selectedVerse.text}
            </h3>

            <p className="text-2xs text-[var(--ink-muted)] uppercase tracking-wider mt-0.5">
              Tradução do Novo Mundo
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={closeVersePanel}
            className="h-8 w-8 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--background)]"
          >
            <X size={18} />
          </Button>
        </div>

        {content}
      </Card>
    </div>
  );
}