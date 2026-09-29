"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { findBookByName, BIBLE_BOOKS } from "@/lib/bible-books";
import { useDebounce } from "@/hooks/use-debounce";

interface VerseSearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (verse: { book: number; chapter: number; verse: number; text: string }) => void;
}

export function VerseSearchPopup({ isOpen, onClose, onSelect }: VerseSearchPopupProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    async function searchVerse() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      // Parse query like "Joao 3:16" or "Jo 3:16"
      const match = debouncedQuery.match(/^([\w\sçãõáéíóú]+?)\s+(\d+)[:\.,]?(\d+)?$/i);
      if (!match) {
        setResults([]);
        return;
      }

      const [_, bookQuery, chapterStr, verseStr] = match;
      const book = findBookByName(bookQuery);

      if (!book) {
        setResults([]);
        return;
      }

      setLoading(true);
      const supabase = createClient();

      let q = supabase
        .from("bible_verses")
        .select("book_number, book_name, chapter, verse, text")
        .eq("book_number", book.number)
        .eq("chapter", parseInt(chapterStr));

      if (verseStr) {
        q = q.eq("verse", parseInt(verseStr));
      }
      const { data, error } = await q.order("verse", { ascending: true }).limit(10);

      if (error) {
        console.error("Erro ao buscar versículo:", error);
        setResults([]);
      } else if (data) {
        setResults(data);
      }
      setLoading(false);
    }

    searchVerse();
  }, [debouncedQuery]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm p-4">
        <DialogHeader className="mb-3">
          <DialogTitle>Inserir Versículo</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-[var(--ink-muted)]" />
          <Input
            ref={inputRef}
            placeholder="Ex: João 3:16"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoComplete="off"
          />
        </div>

        <div className="mt-4 min-h-[150px] max-h-[300px] overflow-y-auto">
          {loading && (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-[var(--ink-muted)]" />
            </div>
          )}

          {!loading && results.length === 0 && query.length > 2 && (
            <p className="text-center text-sm text-[var(--ink-muted)] mt-8">
              Nenhum versículo encontrado.<br />
              <span className="text-xs">Digite "Livro Capítulo:Versículo"</span>
            </p>
          )}

          {!loading && results.map((v) => (
            <button
              key={`${v.book_number}-${v.chapter}-${v.verse}`}
              onClick={() => onSelect({
                book: v.book_number,
                chapter: v.chapter,
                verse: v.verse,
                text: `${v.book_name} ${v.chapter}:${v.verse}`
              })}
              className="w-full text-left p-3 hover:bg-[var(--background)] rounded-md transition-colors mb-1 group"
            >
              <div className="font-semibold text-[var(--primary)] text-sm group-hover:text-[var(--accent)] transition-colors">
                {v.book_name} {v.chapter}:{v.verse}
              </div>
              <div className="text-xs text-[var(--ink-muted)] line-clamp-2 mt-1">
                {v.text}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
