import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: profile } = await serverSupabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const { email, origin } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }

    const requestUrl = new URL(req.url);
    const baseUrl = origin || requestUrl.origin;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: email,
      options: {
        redirectTo: `${baseUrl}/definir-senha`,
      }
    });

    if (error) {
      if (error.message.toLowerCase().includes("user already exists") || error.message.toLowerCase().includes("already registered")) {
        return NextResponse.json({ error: "Esse e-mail já tem conta no Rhema." }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ inviteUrl: data.properties?.action_link });

  } catch (error: any) {
    console.error("Invite generation error:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar convite." },
      { status: 500 }
    );
  }
}
