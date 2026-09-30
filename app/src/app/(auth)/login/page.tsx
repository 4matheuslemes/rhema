"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { RhemaMark } from "@/components/layout/rhema-mark";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha muito curta"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error("Credenciais inválidas. Verifique e tente novamente.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10 flex flex-col items-center">
        {/* Símbolo do Rhema — SVG inline, aspas brancas sobre balão bordô */}
        <div className="mb-4 drop-shadow-md">
          <RhemaMark size={80} />
        </div>
        <h1 className="font-display font-semibold text-3xl text-[var(--ink)]">
          {APP_NAME}
        </h1>
        <p className="text-caption text-[var(--ink-muted)] mt-1">
          {APP_DESCRIPTION}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            error={!!errors.email}
            {...register("email")}
          />
        </Field>

        <Field label="Senha" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={!!errors.password}
            {...register("password")}
          />
        </Field>

        <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-2 w-full">
          Entrar
        </Button>
      </form>

      <p className="text-center text-caption text-[var(--ink-muted)] mt-8">
        Acesso restrito a convidados
      </p>
    </div>
  );
}
