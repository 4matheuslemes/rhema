"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

const schema = z.object({
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function SetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Link de convite inválido ou expirado.");
        router.push("/login");
      } else {
        setChecking(false);
      }
    }
    checkSession();
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const supabase = createClient();
    
    const { error } = await supabase.auth.updateUser({
      password: data.password
    });
    
    if (error) {
      toast.error("Erro ao definir senha: " + error.message);
      setLoading(false);
      return;
    }
    
    toast.success("Senha definida com sucesso!");
    router.push("/");
    router.refresh();
  };

  if (checking) {
    return <div className="text-[var(--ink-muted)]">Verificando convite...</div>;
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <h1 className="font-display font-semibold text-3xl text-[var(--ink)]">
          Bem-vindo!
        </h1>
        <p className="text-caption text-[var(--ink-muted)] mt-2">
          Defina uma senha para acessar sua nova conta no Rhema.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Field label="Nova Senha" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            error={!!errors.password}
            {...register("password")}
          />
        </Field>

        <Field label="Confirmar Senha" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            error={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </Field>

        <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-2 w-full">
          Salvar Senha e Entrar
        </Button>
      </form>
    </div>
  );
}
