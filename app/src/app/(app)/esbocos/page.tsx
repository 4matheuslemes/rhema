"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, FileText, MoreVertical, Trash2, Copy } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

export default function OutlinesPage() {
  const [outlines, setOutlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const supabase = createClient();

  useEffect(() => {
    fetchOutlines();
  }, [debouncedSearch]);

  async function fetchOutlines() {
    setLoading(true);
    let q = supabase
      .from("outlines")
      .select("id, title, category, updated_at")
      .order("updated_at", { ascending: false });

    if (debouncedSearch) {
      q = q.ilike("title", `%${debouncedSearch}%`);
    }

    const { data, error } = await q;
    if (!error && data) {
      setOutlines(data);
    }
    setLoading(false);
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation
    if (!confirm("Tem certeza que deseja excluir este esboço?")) return;
    
    const { error } = await supabase.from("outlines").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir esboço.");
    } else {
      toast.success("Esboço excluído.");
      fetchOutlines();
    }
  };

  const handleDuplicate = async (outline: any, e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation
    
    const { data: fullOutline } = await supabase
      .from("outlines")
      .select("*")
      .eq("id", outline.id)
      .single();
      
    if (!fullOutline) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("outlines").insert({
      user_id: user.id,
      title: `${fullOutline.title} (Cópia)`,
      category: fullOutline.category,
      content: fullOutline.content,
    });

    if (error) {
      toast.error("Erro ao duplicar esboço.");
    } else {
      toast.success("Esboço duplicado.");
      fetchOutlines();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <AppHeader 
        title="Meus Esboços" 
        right={
          <Button asChild variant="primary" size="sm" className="h-9 px-4 text-sm rounded-full">
            <Link href="/esbocos/novo">
              <Plus size={16} className="-ml-1 mr-1" /> Novo
            </Link>
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-[var(--ink-muted)]" />
        <Input
          placeholder="Buscar esboços..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-[var(--surface)] border-transparent shadow-sm"
        />
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-[var(--surface)] rounded-xl opacity-50" />
            ))}
          </div>
        ) : outlines.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mb-4 text-[var(--ink-muted)]">
              <FileText size={32} />
            </div>
            <h3 className="font-display font-semibold text-lg text-[var(--ink)] mb-1">Nenhum esboço</h3>
            <p className="text-body-sm text-[var(--ink-muted)] mb-6">
              {search ? "Nenhum resultado encontrado." : "Você ainda não criou nenhum esboço."}
            </p>
            {!search && (
              <Button asChild variant="secondary">
                <Link href="/esbocos/novo">Criar meu primeiro esboço</Link>
              </Button>
            )}
          </div>
        ) : (
          outlines.map((outline) => (
            <Link key={outline.id} href={`/esbocos/${outline.id}`}>
              <Card interactive padding="sm" className="flex items-start gap-4 hover:border-[var(--primary)]/30 group">
                <div className="w-12 h-12 rounded-lg bg-[var(--background)] flex items-center justify-center text-[var(--primary)] shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="font-display font-medium text-[var(--ink)] truncate mb-1">
                    {outline.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">{outline.category}</Badge>
                    <span className="text-caption text-[var(--ink-muted)]">
                      {formatRelativeDate(outline.updated_at)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:flex-row">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--ink-muted)]" onClick={(e) => handleDuplicate(outline, e)} title="Duplicar">
                    <Copy size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={(e) => handleDelete(outline.id, e)} title="Excluir">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
