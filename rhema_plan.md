# Rhema - Plano de Implementação

**Rhema** é um aplicativo web focado na preparação e armazenamento de esboços de discursos e estudos bíblicos, atuando como um "aplicativo irmão" do Kairós.

## 1. Identidade Visual
A interface do Rhema compartilha o mesmo Design System do Kairós.
- **Tipografia**: Fraunces (Títulos/Display) e Inter (Corpo do texto).
- **Cores**:
  - Primary: `#1E3A5F` (Navy)
  - Accent: `#B8934A` (Gold)
  - Success: `#6B9080` (Sage)
- **Tema**: Suporte a modo claro (padrão) e escuro.

## 2. Estrutura do Banco de Dados (Supabase)

Para o perfeito funcionamento do Rhema, execute as seguintes migrações/scripts SQL no Supabase:

```sql
-- 1. Perfis de Usuário
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger para criar perfil automaticamente após signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, is_admin)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', false);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Tabela de Esboços
create table outlines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  category text,
  content jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) para outlines
alter table outlines enable row level security;

create policy "Users can view their own outlines" on outlines for select
  using (auth.uid() = user_id);

create policy "Users can insert their own outlines" on outlines for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own outlines" on outlines for update
  using (auth.uid() = user_id);

create policy "Users can delete their own outlines" on outlines for delete
  using (auth.uid() = user_id);

-- 3. Tabela de Versículos Bíblicos
create table bible_verses (
  id bigint generated always as identity primary key,
  book_number smallint not null,
  book_name text not null,
  chapter smallint not null,
  verse smallint not null,
  text text not null
);

-- Índice para busca rápida de versículos
create index idx_bible_verses_lookup on bible_verses(book_number, chapter, verse);
```

## 3. Script de Importação da Bíblia
O projeto inclui um script em `scripts/import-bible.ts` projetado para ser executado localmente. Este script utiliza `adm-zip` e `node-html-parser` para:
1. Extrair os arquivos XHTML do `nwt_T.epub`.
2. Identificar a marcação de `<span id="chapterX_verseY">`.
3. Processar e agrupar os nós de texto.
4. Inserir em lote na tabela `bible_verses` do Supabase via a Service Role Key.

**Como executar:**
```bash
npx tsx scripts/import-bible.ts
```

## 4. O Editor (Tiptap)
O coração da aplicação é um editor rico baseado em Tiptap, implementado em `src/components/outline/outline-editor.tsx`.
- Utiliza uma barra de ferramentas com formatação padrão (Negrito, Itálico, Listas, H1, H2).
- **Node Customizado**: `BibleVerseNode` renderiza os versículos inseridos como "chips" clicáveis (`bible-verse-chip`).
- Ao clicar no chip, abre-se um painel (Desktop) ou uma Drawer (Mobile) consumindo o contexto `EditorContext`.

## 5. Próximos Passos
O aplicativo foi completamente implementado (scaffold, componentes, editor, telas de auth, etc.). Resta apenas:
1. Executar as migrações no banco (Supabase).
2. Adicionar o arquivo `.env.local` na raiz de `rhema/app/` com as chaves do Supabase.
3. Executar o script `import-bible.ts` uma única vez para popular o banco.
4. Testar o app com `npm run dev`.
