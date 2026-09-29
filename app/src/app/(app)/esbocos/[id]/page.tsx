"use client";

import { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { Share2, Loader2, Check, Mic2 } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function OutlineEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const isNew = id === "novo";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "idle"
  >("idle");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(
    OUTLINE_CATEGORIES[0]
  );
  const [content, setContent] = useState<any>({
    type: "doc",
    content: [],
  });

  const supabase = createClient();

  const hasLoaded = useRef(isNew);
  const isCreating = useRef(false);

  // ============================================================
  // LOAD OUTLINE
  // ============================================================

  useEffect(() => {
    if (isNew) {
      hasLoaded.current = true;
      return;
    }

    hasLoaded.current = false;

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

      // Só libera o autosave depois que o conteúdo
      // original do banco terminou de carregar.
      hasLoaded.current = true;
    }

    loadOutline();
  }, [id, isNew, router, supabase]);

  // ============================================================
  // AUTOSAVE
  // ============================================================

  const debouncedContent = useDebounce(content, 2000);
  const debouncedTitle = useDebounce(title, 2000);

  useEffect(() => {
    // Nunca salva durante o carregamento inicial.
    if (!hasLoaded.current || loading) return;

    // ============================================================
    // NOVO ESBOÇO
    // ============================================================

    if (isNew) {
      // Impede dois INSERTs para o mesmo esboço.
      if (isCreating.current) return;

      const hasText =
        title.trim().length > 0 ||
        (content?.content && content.content.length > 0);

      // Não cria registro vazio.
      if (!hasText) return;

      isCreating.current = true;

      async function createOutline() {
        setSaveStatus("saving");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          isCreating.current = false;
          setSaveStatus("idle");
          return;
        }

        const { data, error } = await supabase
          .from("outlines")
          .insert({
            user_id: user.id,
            title: title.trim() || "Sem título",
            category,
            content,
          })
          .select("id")
          .single();

        if (error || !data) {
          console.error("Erro ao criar esboço:", error);
          isCreating.current = false;
          setSaveStatus("idle");
          return;
        }

        setSaveStatus("saved");
        router.replace(`/esbocos/${data.id}`);
      }

      createOutline();
      return;
    }

    // ============================================================
    // ESBOÇO EXISTENTE
    // ============================================================

    async function updateOutline() {
      setSaveStatus("saving");

      const { error } = await supabase
        .from("outlines")
        .update({
          title: title.trim() || "Sem título",
          category,
          content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Erro ao salvar esboço:", error);
        setSaveStatus("idle");
        return;
      }

      setSaveStatus("saved");

      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    }

    updateOutline();
  }, [
    debouncedContent,
    debouncedTitle,
    category,
    id,
    isNew,
    loading,
    router,
    supabase,
  ]);

  // ============================================================
  // SHARE
  // ============================================================

  const handleShare = async () => {
    let text = `${title}\n${category}\n\n`;

    try {
      const { generateText } = await import("@tiptap/core");
      const StarterKit = (await import("@tiptap/starter-kit")).default;

      const plainText = generateText(content, [StarterKit]);

      text += plainText;
    } catch (e) {
      text += "Baixe o Rhema para ver o conteúdo completo.";
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Esboço: ${title}`,
          text,
        });
      } catch (e) {
        // Usuário cancelou
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success(
        "Esboço copiado para a área de transferência"
      );
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <EditorProvider>
      <div className="outline-page flex flex-col h-full gap-4 pb-20">

        <AppHeader
          title=""
          right={
            <div className="flex items-center gap-2">

              {/* STATUS DE SALVAMENTO */}
              <span className="text-xs text-[var(--ink-muted)] flex items-center gap-1 w-20 justify-end">
                {saveStatus === "saving" && (
                  <>
                    <Loader2
                      size={12}
                      className="animate-spin"
                    />
                    Salvando
                  </>
                )}

                {saveStatus === "saved" && (
                  <>
                    <Check
                      size={12}
                      className="text-[var(--success)]"
                    />
                    Salvo
                  </>
                )}
              </span>

              {/* MODO DISCURSO */}
              {!isNew && (
                <Button
                  asChild
                  variant="primary"
                  size="sm"
                  className="h-9 px-3 rounded-full"
                >
                  <Link href={`/esbocos/${id}/discurso`}>
                    <Mic2 size={16} className="mr-1.5" />
                    Discursar
                  </Link>
                </Button>
              )}

              {/* COMPARTILHAR */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="h-9 w-9"
                title="Compartilhar"
              >
                <Share2 size={18} />
              </Button>

            </div>
          }
        />

        {/* ======================================================
            TITLE + CATEGORY
        ====================================================== */}

        <div className="flex flex-col gap-3 -mt-2">

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do esboço..."
            className="
              text-2xl
              font-display
              font-semibold
              h-auto
              py-2
              border-transparent
              bg-transparent
              px-0
              focus:border-transparent
              focus:ring-0
              placeholder:text-[var(--ink-muted)]/50
            "
          />

          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={OUTLINE_CATEGORIES.map((c) => ({
              value: c,
              label: c,
            }))}
            className="
              w-auto
              text-sm
              h-8
              bg-[var(--background)]
              border-transparent
            "
          />

        </div>

        {/* ======================================================
            EDITOR + STUDY PANEL
        ====================================================== */}

        <div className="editor-with-panel mt-2">

          <div className="
            min-w-0
            w-full
            bg-[var(--surface)]
            border
            border-[var(--border)]
            rounded-xl
            p-4
            shadow-sm
          ">
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