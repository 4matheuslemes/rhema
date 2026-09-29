"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/layout/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      setProfile({ ...data, email: user.email });
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col gap-5">
      <AppHeader title="Perfil" right={<ThemeToggle />} />

      {profile && (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center">
              <User size={28} />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-[var(--ink)]">
                {profile.full_name || "Usuário"}
              </h2>
              <p className="text-body-sm text-[var(--ink-muted)]">{profile.email}</p>
            </div>
          </div>
          
          {profile.is_admin && (
            <div className="bg-[var(--accent)]/10 text-[var(--accent)] p-3 rounded-lg flex items-start gap-3 mt-2">
              <ShieldAlert size={18} className="mt-0.5 shrink-0" />
              <div className="text-sm">
                <strong>Administrador</strong>
                <p className="opacity-90 mt-0.5">Você tem permissão para gerar links de convite para novos usuários.</p>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="mt-4">
        <Button variant="secondary" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-transparent shadow-sm" onClick={handleLogout}>
          <LogOut size={18} className="mr-2" />
          Sair do Aplicativo
        </Button>
      </div>
    </div>
  );
}
