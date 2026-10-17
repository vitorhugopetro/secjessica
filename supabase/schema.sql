-- SecJessica - Banco de dados multi-empresa canônico (Supabase / PostgreSQL)
-- Execute este script no SQL Editor do Supabase.

create extension if not exists "uuid-ossp";

------------------------------------------------------------
-- 1. Empresas (cada cliente da secretária)
------------------------------------------------------------
create table if not exists companies (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  email text,
  phone text,
  address text,
  timezone text default 'America/Sao_Paulo',
  segment text,
  plan text default 'starter',
  status text default 'active',
  owner_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 2. Perfis de usuários (Supabase Auth)
------------------------------------------------------------
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text default 'secretary',
  avatar_url text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 3. Membros por empresa (multi-empresa)
------------------------------------------------------------
create table if not exists company_members (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'secretary',
  created_at timestamptz default now(),
  unique (company_id, user_id)
);

------------------------------------------------------------
-- 4. Serviços prestados pela empresa
------------------------------------------------------------
create table if not exists services (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  description text,
  duration_minutes integer default 60,
  price numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 5. Profissionais / Membros de equipe da empresa
------------------------------------------------------------
create table if not exists professionals (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  specialty text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 6. Clientes (pacientes/clientes atendidos pela empresa)
------------------------------------------------------------
create table if not exists clients (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  cpf_cnpj text,
  birth_date date,
  address text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 7. Contatos
------------------------------------------------------------
create table if not exists contacts (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  name text not null,
  role text,
  email text,
  phone text,
  whatsapp text,
  company_name text,
  type text,
  origin text,
  status text,
  notes text,
  is_primary boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 8. Agendamentos / Compromissos
------------------------------------------------------------
create table if not exists appointments (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  professional_id uuid references professionals(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text default 'scheduled',
  location text,
  meeting_link text,
  google_calendar_event_id text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 9. Tarefas administrativas
------------------------------------------------------------
create table if not exists tasks (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  title text not null,
  description text,
  category text,
  priority text default 'normal',
  status text default 'todo',
  due_at timestamptz,
  contact_id uuid references contacts(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  assigned_to uuid references profiles(id) on delete set null,
  created_by uuid references auth.users(id),
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 10. Modelos de mensagens
------------------------------------------------------------
create table if not exists message_templates (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  kind text not null,
  subject text,
  body text not null,
  variables text[] default '{}',
  active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 11. Conexões Google Calendar (por empresa)
------------------------------------------------------------
create table if not exists google_calendar_connections (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null unique,
  user_id uuid references auth.users(id) on delete set null,
  calendar_id text not null default 'primary',
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 12. Notificações do sistema
------------------------------------------------------------
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  company_id uuid references companies(id) on delete cascade,
  title text not null,
  body text,
  kind text,
  metadata jsonb default '{}',
  read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

------------------------------------------------------------
-- 13. Convites de usuários para empresa
------------------------------------------------------------
create table if not exists company_invitations (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  email text not null,
  role text default 'secretary',
  token text unique not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

------------------------------------------------------------
-- 14. Log de auditoria
------------------------------------------------------------
create table if not exists audit_logs (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

------------------------------------------------------------
-- Índices para Performance e Integridade
------------------------------------------------------------
create index if not exists idx_company_members_user_id on company_members(user_id);
create index if not exists idx_company_members_company_id on company_members(company_id);
create index if not exists idx_profiles_id on profiles(id);
create index if not exists idx_clients_company_id on clients(company_id);
create index if not exists idx_clients_name on clients(name);
create index if not exists idx_contacts_company_id on contacts(company_id);
create index if not exists idx_appointments_company_id on appointments(company_id);
create index if not exists idx_appointments_starts_at on appointments(starts_at);
create index if not exists idx_tasks_company_id on tasks(company_id);
create index if not exists idx_tasks_due_at on tasks(due_at);
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_gcc_company_id on google_calendar_connections(company_id);

------------------------------------------------------------
-- Habilitar Row Level Security (RLS)
------------------------------------------------------------
alter table companies enable row level security;
alter table profiles enable row level security;
alter table company_members enable row level security;
alter table services enable row level security;
alter table professionals enable row level security;
alter table clients enable row level security;
alter table contacts enable row level security;
alter table appointments enable row level security;
alter table tasks enable row level security;
alter table message_templates enable row level security;
alter table google_calendar_connections enable row level security;
alter table notifications enable row level security;
alter table company_invitations enable row level security;
alter table audit_logs enable row level security;

------------------------------------------------------------
-- Helper: empresas do usuário autenticado
------------------------------------------------------------
create or replace function user_company_ids()
returns uuid[] language sql stable as $$
  select coalesce(array_agg(company_id), '{}') from company_members where user_id = auth.uid();
$$;

------------------------------------------------------------
-- Políticas RLS
------------------------------------------------------------
-- Empresas
create policy "Companies: ver empresas onde é membro"
  on companies for select
  using (id = any(user_company_ids()));

create policy "Companies: criar empresa"
  on companies for insert
  with check (auth.uid() is not null);

create policy "Companies: atualizar empresa onde é admin"
  on companies for update
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = companies.id and cm.user_id = auth.uid() and cm.role = 'admin'
    )
  );

create policy "Companies: excluir empresa onde é admin"
  on companies for delete
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = companies.id and cm.user_id = auth.uid() and cm.role = 'admin'
    )
  );

-- Perfis
create policy "Profiles: ver próprio perfil"
  on profiles for select using (auth.uid() = id);

create policy "Profiles: atualizar próprio perfil"
  on profiles for update using (auth.uid() = id);

create policy "Profiles: inserir próprio perfil"
  on profiles for insert with check (auth.uid() = id);

-- Membros
create policy "CompanyMembers: ver membros da empresa"
  on company_members for select
  using (company_id = any(user_company_ids()));

create policy "CompanyMembers: gerenciar membros"
  on company_members for all
  using (
    company_id = any(user_company_ids()) and
    exists (
      select 1 from company_members cm
      where cm.company_id = company_members.company_id and cm.user_id = auth.uid() and cm.role = 'admin'
    )
  );

-- Serviços e Profissionais
create policy "Services: da empresa"
  on services for all using (company_id = any(user_company_ids()));

create policy "Professionals: da empresa"
  on professionals for all using (company_id = any(user_company_ids()));

-- Clientes, Contatos, Agendamentos, Tarefas e Modelos
create policy "Clients: CRUD da empresa"
  on clients for all using (company_id = any(user_company_ids()));

create policy "Contacts: CRUD da empresa"
  on contacts for all using (company_id = any(user_company_ids()));

create policy "Appointments: CRUD da empresa"
  on appointments for all using (company_id = any(user_company_ids()));

create policy "Tasks: CRUD da empresa"
  on tasks for all using (company_id = any(user_company_ids()));

create policy "MessageTemplates: CRUD da empresa"
  on message_templates for all using (company_id = any(user_company_ids()));

create policy "GCC: da empresa"
  on google_calendar_connections for all using (company_id = any(user_company_ids()));

create policy "Invitations: da empresa"
  on company_invitations for all using (company_id = any(user_company_ids()));

create policy "Notifications: do usuário"
  on notifications for all using (user_id = auth.uid());

create policy "Audit: ler da empresa"
  on audit_logs for select using (company_id = any(user_company_ids()));

create policy "Audit: inserir"
  on audit_logs for insert with check (true);

------------------------------------------------------------
-- Trigger automação updated_at
------------------------------------------------------------
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  for t in (
    select tablename from pg_tables where schemaname='public'
      and tablename in ('companies','profiles','services','professionals','clients','contacts',
                        'appointments','tasks','message_templates','google_calendar_connections')
  ) loop
    execute format(
      $f$
      drop trigger if exists trg_%s_updated_at on %I;
      create trigger trg_%s_updated_at
      before update on %I
      for each row
      execute function update_updated_at()
      $f$,
      t.tablename, t.tablename, t.tablename, t.tablename
    );
  end loop;
end $$;
