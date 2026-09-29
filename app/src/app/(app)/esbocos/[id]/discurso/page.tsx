"use client";

import { useEffect, use, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { EditorProvider } from "@/components/outline/editor-context";
import { toast } from "sonner";
import OutlineDiscourse from "@/components/outline/outline-discourse";

interface Outline {
    id: string;
    title: string;
    category: string | null;
    content: any;
}

export default function DiscoursePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const router = useRouter();
    const { id } = use(params);

    const [outline, setOutline] = useState<Outline | null>(
        null
    );

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadOutline() {
            const supabase = createClient();

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            const { data, error } = await supabase
                .from("outlines")
                .select("id, title, category, content")
                .eq("id", id)
                .eq("user_id", user.id)
                .single();

            if (error || !data) {
                console.error("Erro ao carregar discurso:", error);

                toast.error(
                    "Não foi possível carregar este discurso."
                );

                router.push("/esbocos");
                return;
            }

            setOutline(data);
            setLoading(false);
        }

        loadOutline();
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2
                    className="h-8 w-8 animate-spin"
                    style={{ color: "var(--primary)" }}
                />
            </div>
        );
    }

    if (!outline) {
        return null;
    }

    return (
        <EditorProvider>
            <OutlineDiscourse
                title={outline.title}
                category={outline.category}
                content={outline.content}
            />
        </EditorProvider>
    );
}