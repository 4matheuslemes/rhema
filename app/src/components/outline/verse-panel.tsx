"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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

  const panelRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  /*
   * Quando o painel é aberto em tablet/desktop,
   * leva suavemente o usuário até ele.
   */
  useEffect(() => {
    if (!isPanelOpen || !selectedVerse || isMobile) return;

    const timer = window.setTimeout(() => {
      panelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [isPanelOpen, selectedVerse, isMobile]);

  useEffect(() => {
    if (!selectedVerse || !isPanelOpen) return;

    const verse = selectedVerse;

    async function fetchVerses() {
      setLoading(true);
      setVerseContent([]);

      const startVerse = verse.verse;
      const endVerse =
        verse.verseEnd ?? verse.verse;

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

  if (!isPanelOpen || !selectedVerse) {
    return null;
  }

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
        <div className="flex flex-col gap-4">
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

  /*
   * CELULAR
   */
  if (isMobile) {
    return (
      <Drawer
        open={isPanelOpen}
        onClose={closeVersePanel}
        title={selectedVerse.text}
        description="Tradução do Novo Mundo"
      >
        <div className="pt-2">
          {content}
        </div>
      </Drawer>
    );
  }

  /*
   * TABLET + DESKTOP
   */
  return (
    <div
      ref={panelRef}
      className="verse-side-panel w-full min-w-0"
    >
      <Card
        padding="md"
        className="
          w-full
          border-[var(--accent)]/30
          shadow-md
        "
      >
        <div className="flex items-center justify-between mb-4 border-b border-[var(--border)] pb-3">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-lg text-[var(--primary)] truncate">
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
            className="
              h-8
              w-8
              shrink-0
              text-[var(--ink-muted)]
              hover:text-[var(--ink)]
              hover:bg-[var(--background)]
            "
          >
            <X size={18} />
          </Button>
        </div>

        {content}
      </Card>
    </div>
  );
}