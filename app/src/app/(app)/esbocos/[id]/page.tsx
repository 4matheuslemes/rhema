"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Share2, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { OutlineEditor } from "@/components/outline/outline-editor";
import { EditorProvider } from "@/components/outline/editor-context";
import { VersePanel } from "@/components/outline/verse-panel";
import { OUTLINE_CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

export default function OutlineEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const isNew = id === "novo";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(OUTLINE_CATEGORIES[0]);
  const [content, setContent] = useState<any>({ type: "doc", content: [] });

  const supabase = createClient();
  const isFirstRender = useRef(true);

  // Load existing outline
  useEffect(() => {
    if (isNew) return;

    async function loadOutline() {
      const { data, error } = await supabase
        .from("outlines")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        toast.error("Erro ao carregar esboço");
        router.push("/esbocos");
        return;
      }

      setTitle(data.title);
      setCategory(data.category || OUTLINE_CATEGORIES[0]);
      setContent(data.content);
      setLoading(false);
    }

    loadOutline();
  }, [id, isNew, router, supabase]);

  // Autosave
  const debouncedContent = useDebounce(content, 2000);
  const debouncedTitle = useDebounce(title, 2000);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (loading || (!title && isNew)) return;

    async function autosave() {
      setSaveStatus("saving");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isNew) {
        const { data, error } = await supabase
          .from("outlines")
          .insert({
            user_id: user.id,
            title: title || "Sem título",
            category,
            content: debouncedContent,
          })
          .select("id")
          .single();

        if (!error && data) {
          router.replace(`/esbocos/${data.id}`);
        }
      } else {
        await supabase
          .from("outlines")
          .update({
            title: title || "Sem título",
            category,
            content: debouncedContent,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }

    autosave();
  }, [debouncedContent, debouncedTitle, category]);

  const handleShare = async () => {
    // Generate simple text representation
    // A robust implementation would recursively traverse the Tiptap JSON
    // but for this MVP we'll just extract text nodes.
    let text = `${title}\n${category}\n\n`;

    try {
      const { generateText } = await import('@tiptap/core');
      const StarterKit = (await import('@tiptap/starter-kit')).default;

      const plainText = generateText(content, [
        StarterKit,
      ]);
      text += plainText;
    } catch (e) {
      text += "Baixe o Rhema para ver o conteúdo completo.";
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Esboço: ${title}`,
          text: text,
        });
      } catch (e) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Esboço copiado para a área de transferência");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <EditorProvider>
      <div className="outline-page flex flex-col h-full gap-4 pb-20">
        <AppHeader
          title=""
          right={
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--ink-muted)] flex items-center gap-1 w-20 justify-end">
                {saveStatus === "saving" && <><Loader2 size={12} className="animate-spin" /> Salvando</>}
                {saveStatus === "saved" && <><Check size={12} className="text-[var(--success)]" /> Salvo</>}
              </span>
              <Button variant="ghost" size="icon" onClick={handleShare} className="h-9 w-9">
                <Share2 size={18} />
              </Button>
            </div>
          }
        />

        {/* Title and Category */}
        <div className="flex flex-col gap-3 -mt-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do esboço..."
            className="text-2xl font-display font-semibold h-auto py-2 border-transparent bg-transparent px-0 focus:border-transparent focus:ring-0 placeholder:text-[var(--ink-muted)]/50"
          />
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={OUTLINE_CATEGORIES.map(c => ({ value: c, label: c }))}
            className="w-auto text-sm h-8 bg-[var(--background)] border-transparent"
          />
        </div>

        {/* Editor Area with Study Panel */}
        <div className="editor-with-panel mt-2">
          <div className="min-w-0 w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
            <OutlineEditor
              initialContent={content}
              onChange={setContent}
            />
          </div>

          <VersePanel />
        </div>
      </div>
    </EditorProvider>
  );
}
