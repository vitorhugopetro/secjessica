-- ================================================================
-- SecJessica: Esquema Completo Unificado de Banco de Dados (PostgreSQL)
-- Gerado em: 2026-10-17T23:36:48.939Z
-- Execute este script completo diretamente no SQL Editor do Supabase
-- ================================================================


-- >>> INICIO: supabase/schema.sql <<<

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


-- >>> FIM: supabase/schema.sql <<<


-- >>> INICIO: supabase/migrations/002_complete_entities.sql <<<

-- SecJessica - Migração 002: entidades completas (multi-empresa, RBAC, CRM, agenda, tarefas, notificações, auditoria)
-- Execute após supabase/schema.sql (migração 001).

------------------------------------------------------------
-- 0. Organizações (canônico; companies é o legado mantido pela app)
------------------------------------------------------------
create table if not exists organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  email text,
  phone text,
  address text,
  timezone text default 'America/Sao_Paulo',
  plan text default 'starter',
  status text default 'active',
  owner_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 1. Funções (roles) e permissões (RBAC)
------------------------------------------------------------
create table if not exists roles (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade,
  name text not null, -- admin_organizacao, secretaria, atendente, profissional, consulta
  key text not null unique, -- role_secretaria, role_admin_org
  description text,
  is_system boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists permissions (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null, -- contacts.view, appointments.create, reports.export
  description text,
  module text not null, -- crm, scheduling, organization, reports, integrations
  created_at timestamptz default now()
);

create table if not exists role_permissions (
  id uuid default uuid_generate_v4() primary key,
  role_id uuid references roles(id) on delete cascade not null,
  permission_id uuid references permissions(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (role_id, permission_id)
);

------------------------------------------------------------
-- 2. Membros de organização (já iniciado no schema 001; recriar aqui se não existir)
------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.tables where table_name='organization_members') then
    create table organization_members (
      id uuid default uuid_generate_v4() primary key,
      organization_id uuid references organizations(id) on delete cascade not null,
      user_id uuid references auth.users(id) on delete cascade not null,
      role_id uuid references roles(id) on delete set null,
      role text default 'secretary',
      created_at timestamptz default now(),
      unique (organization_id, user_id)
    );
  end if;
end $$;

------------------------------------------------------------
-- 3. Configurações da organização
------------------------------------------------------------
create table if not exists organization_settings (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade not null unique,
  timezone text default 'America/Sao_Paulo',
  working_hours jsonb default '{}',
  segment text,
  logo_url text,
  primary_color text default '#0ea5e9',
  notification_preferences jsonb default '{}',
  privacy_settings jsonb default '{}',
  data_retention_days integer default 730,
  operational boolean default false,
  onboarding_step integer default 0,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 4. Serviços e profissionais
------------------------------------------------------------
create table if not exists services (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  description text,
  duration_minutes integer default 60,
  price numeric(10,2),
  active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists professionals (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  phone text,
  specialty text,
  active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists professional_services (
  id uuid default uuid_generate_v4() primary key,
  professional_id uuid references professionals(id) on delete cascade not null,
  service_id uuid references services(id) on delete cascade not null,
  unique (professional_id, service_id)
);

------------------------------------------------------------
-- 5. Calendários e conexões Google (detalhado)
------------------------------------------------------------
create table if not exists calendars (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  provider text default 'google',
  provider_calendar_id text not null,
  is_primary boolean default false,
  sync_enabled boolean default true,
  last_sync_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists calendar_connections (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  provider text default 'google',
  provider_user_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  scope text,
  connected_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists calendar_event_mappings (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  appointment_id uuid references appointments(id) on delete set null,
  provider_event_id text not null,
  provider_calendar_id text not null,
  external_source text default 'google',
  last_synced_at timestamptz,
  sync_hash text,
  unique (provider_event_id, provider_calendar_id)
);

------------------------------------------------------------
-- 6. Agendamentos (estendidos) e participantes
------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='appointments' and column_name='professional_id') then
    alter table appointments add column professional_id uuid references professionals(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='appointments' and column_name='service_id') then
    alter table appointments add column service_id uuid references services(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='appointments' and column_name='calendar_event_id') then
    alter table appointments add column calendar_event_id text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='appointments' and column_name='sync_status') then
    alter table appointments add column sync_status text default 'local';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='appointments' and column_name='location') then
    alter table appointments add column location text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='appointments' and column_name='meeting_link') then
    alter table appointments add column meeting_link text;
  end if;
end $$;

create table if not exists appointment_participants (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references appointments(id) on delete cascade not null,
  contact_id uuid references contacts(id) on delete set null,
  professional_id uuid references professionals(id) on delete set null,
  role text, -- cliente, acompanhante, profissional
  created_at timestamptz default now()
);

------------------------------------------------------------
-- 7. Tarefas
------------------------------------------------------------
create table if not exists tasks (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  title text not null,
  description text,
  category text,
  priority text default 'normal', -- baixa, normal, alta, urgente
  status text default 'todo', -- todo, in_progress, waiting, done, cancelled
  due_at timestamptz,
  contact_id uuid references contacts(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id),
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists task_comments (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  comment text not null,
  created_at timestamptz default now()
);

------------------------------------------------------------
-- 8. Modelos de mensagem e notificações
------------------------------------------------------------
create table if not exists message_templates (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  kind text not null, -- confirmation, reminder, reschedule, cancellation, welcome, thank_you
  subject text,
  body text not null,
  variables jsonb default '[]',
  active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade null,
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  body text,
  kind text, -- invite, appointment_soon, conflict, sync_failed, token_expired, task_overdue
  read boolean default false,
  read_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists notification_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  email boolean default true,
  push boolean default true,
  whatsapp boolean default false,
  kinds jsonb default '{}',
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 9. Arquivos (metadata apenas; storage privado no Supabase Storage)
------------------------------------------------------------
create table if not exists files_metadata (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  bucket text not null,
  path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now()
);

------------------------------------------------------------
-- 10. Jobs de integração e auditoria estendida
------------------------------------------------------------
create table if not exists integration_jobs (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  service text not null, -- google_calendar
  action text not null,
  status text default 'pending', -- pending, processing, done, failed
  payload jsonb default '{}',
  error text,
  attempts integer default 0,
  max_attempts integer default 5,
  last_attempt_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists data_subject_requests (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  email text not null,
  kind text not null, -- access, rectification, erasure, portability
  status text default 'pending',
  responded_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists data_retention_rules (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade not null unique,
  appointments_days integer default 730,
  tasks_days integer default 730,
  notifications_days integer default 180,
  audit_logs_days integer default 730,
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- Índices de desempenho e integridade
------------------------------------------------------------
create index if not exists idx_roles_org on roles(organization_id);
create index if not exists idx_role_permissions_role on role_permissions(role_id);
create index if not exists idx_org_members_user on organization_members(user_id);
create index if not exists idx_services_org on services(organization_id);
create index if not exists idx_professionals_org on professionals(organization_id);
create index if not exists idx_prof_services_prof on professional_services(professional_id);
create index if not exists idx_calendars_org on calendars(organization_id);
create index if not exists idx_calendar_connections_org on calendar_connections(organization_id);
create index if not exists idx_event_mappings_appointment on calendar_event_mappings(appointment_id);
create index if not exists idx_appointments_professional on appointments(professional_id);
create index if not exists idx_appointments_service on appointments(service_id);
create index if not exists idx_tasks_org on tasks(organization_id);
create index if not exists idx_tasks_assigned on tasks(assigned_to);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_tasks_due on tasks(due_at);
create index if not exists idx_notifications_user on notifications(user_id);
create index if not exists idx_notifications_read on notifications(read);
create index if not exists idx_message_templates_org on message_templates(organization_id);
create index if not exists idx_integration_jobs_org on integration_jobs(organization_id);
create index if not exists idx_integration_jobs_status on integration_jobs(status);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at);

------------------------------------------------------------
-- RLS para novas tabelas
------------------------------------------------------------
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table organization_settings enable row level security;
alter table services enable row level security;
alter table professionals enable row level security;
alter table professional_services enable row level security;
alter table calendars enable row level security;
alter table calendar_connections enable row level security;
alter table calendar_event_mappings enable row level security;
alter table appointment_participants enable row level security;
alter table tasks enable row level security;
alter table task_comments enable row level security;
alter table message_templates enable row level security;
alter table notifications enable row level security;
alter table notification_preferences enable row level security;
alter table files_metadata enable row level security;
alter table integration_jobs enable row level security;
alter table data_subject_requests enable row level security;
alter table data_retention_rules enable row level security;

------------------------------------------------------------
-- Políticas RLS (isolamento por organização via organization_members)
------------------------------------------------------------
create or replace function user_org_ids()
returns uuid[] language sql stable as $$
  select array_agg(organization_id) from organization_members where user_id = auth.uid();
$$;

create policy "Roles: ver da organização"
  on roles for select using (organization_id = any(user_org_ids()));
create policy "Permissions: ver todas"
  on permissions for select using (true);
create policy "RolePermissions: ver da organização"
  on role_permissions for select using (role_id in (select id from roles where organization_id = any(user_org_ids())));

create policy "OrgSettings: da organização"
  on organization_settings for all using (organization_id = any(user_org_ids()));

create policy "Services: CRUD da organização"
  on services for all using (organization_id = any(user_org_ids()));
create policy "Professionals: CRUD da organização"
  on professionals for all using (organization_id = any(user_org_ids()));
create policy "ProfessionalServices: da organização"
  on professional_services for all
  using (professional_id in (select id from professionals where organization_id = any(user_org_ids())));

create policy "Calendars: da organização"
  on calendars for all using (organization_id = any(user_org_ids()));
create policy "CalendarConnections: da organização"
  on calendar_connections for all using (organization_id = any(user_org_ids()));
create policy "CalendarEventMappings: da organização"
  on calendar_event_mappings for all using (organization_id = any(user_org_ids()));
create policy "AppointmentParticipants: da organização"
  on appointment_participants for all
  using (appointment_id in (select id from appointments where organization_id = any(user_org_ids())));

create policy "Tasks: CRUD da organização"
  on tasks for all using (organization_id = any(user_org_ids()));
create policy "TaskComments: da tarefa"
  on task_comments for all
  using (task_id in (select id from tasks where organization_id = any(user_org_ids())));

create policy "MessageTemplates: da organização"
  on message_templates for all using (organization_id = any(user_org_ids()));
create policy "Notifications: do usuário da organização"
  on notifications for all using (
    (user_id = auth.uid()) or (organization_id = any(user_org_ids()))
  );
create policy "NotificationPreferences: do próprio usuário"
  on notification_preferences for all using (user_id = auth.uid());
create policy "FilesMetadata: da organização"
  on files_metadata for all using (organization_id = any(user_org_ids()));
create policy "IntegrationJobs: da organização"
  on integration_jobs for all using (organization_id = any(user_org_ids()));
create policy "DataSubjectRequests: da organização"
  on data_subject_requests for all using (organization_id = any(user_org_ids()));
create policy "DataRetentionRules: da organização"
  on data_retention_rules for all using (organization_id = any(user_org_ids()));

------------------------------------------------------------
-- Triggers updated_at
------------------------------------------------------------
do $$
begin
  for t in (
    select tablename from pg_tables where schemaname='public'
      and tablename in ('roles','permissions','role_permissions','organization_settings',
                        'services','professionals','professional_services','calendars',
                        'calendar_connections','calendar_event_mappings','appointment_participants',
                        'tasks','task_comments','message_templates','notifications',
                        'notification_preferences','files_metadata','integration_jobs',
                        'data_subject_requests','data_retention_rules')
  ) loop
    execute format(
      $f$
      create trigger trg_%s_updated_at
      before update on %I
      for each row
      execute function update_updated_at()
      $f$,
      t.tablename, t.tablename
    );
  end loop;
end $$;

-- Seeds RBAC do sistema
insert into permissions (key, description, module) values
 ('organization.view','Visualizar organização','organization'),
 ('organization.edit','Editar organização','organization'),
 ('members.manage','Gerenciar usuários e permissões','organization'),
 ('contacts.view','Visualizar contatos','crm'),
 ('contacts.create','Criar contatos','crm'),
 ('contacts.edit','Editar contatos','crm'),
 ('contacts.archive','Arquivar contatos','crm'),
 ('contacts.export','Exportar contatos','crm'),
 ('appointments.view','Visualizar agenda','scheduling'),
 ('appointments.create','Criar agendamentos','scheduling'),
 ('appointments.edit','Editar agendamentos','scheduling'),
 ('appointments.cancel','Cancelar agendamentos','scheduling'),
 ('tasks.view','Visualizar tarefas','scheduling'),
 ('tasks.admin','Administrar tarefas','scheduling'),
 ('reports.view','Consultar relatórios','reports'),
 ('reports.export','Exportar relatórios','reports'),
 ('integrations.configure','Configurar integrações','integrations'),
 ('audit.view','Consultar logs de auditoria','audit')
on conflict (key) do nothing;

insert into roles (organization_id, name, key, is_system) values
 (null, 'Administrador da plataforma', 'role_platform_admin', true)
on conflict (key) do nothing;


-- >>> FIM: supabase/migrations/002_complete_entities.sql <<<


-- >>> INICIO: supabase/migrations/003_whatsapp_integration.sql <<<

-- SecJessica - Migração 003: Integração Completa com WhatsApp
-- Suporte a Evolution API, Z-API, Meta Cloud API e Disparos Manuais / Híbridos

------------------------------------------------------------
-- 1. Tabela de Instâncias / Conexões de WhatsApp
------------------------------------------------------------
create table if not exists whatsapp_instances (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  provider text not null default 'evolution_api', -- 'evolution_api', 'z_api', 'meta_cloud', 'manual'
  instance_name text not null,
  phone_number text,
  status text not null default 'disconnected', -- 'connected', 'disconnected', 'qrcode', 'connecting'
  api_url text,
  api_key text,
  webhook_secret text,
  auto_reply boolean default false,
  auto_confirm_appointments boolean default true,
  reminder_hours_before integer default 24,
  business_hours_only boolean default false,
  qr_code_base64 text,
  last_connected_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (company_id)
);

------------------------------------------------------------
-- 2. Tabela de Mensagens e Histórico de Atendimento WhatsApp
------------------------------------------------------------
create table if not exists whatsapp_messages (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  contact_id uuid references contacts(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  phone text not null,
  direction text not null default 'outbound', -- 'outbound', 'inbound'
  message text not null,
  status text not null default 'sent', -- 'queued', 'sent', 'delivered', 'read', 'failed'
  template_kind text, -- 'confirmation', 'reminder', 'pix', 'reschedule', 'custom'
  provider_message_id text,
  error_message text,
  created_at timestamptz default now()
);

------------------------------------------------------------
-- 3. Tabela de Respostas Rápidas (Quick Replies da Secretária)
------------------------------------------------------------
create table if not exists whatsapp_quick_replies (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  title text not null,
  shortcut text not null, -- ex: /pix, /horarios, /endereco
  content text not null,
  category text default 'geral', -- 'agendamento', 'financeiro', 'localizacao', 'preparo'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 4. Índices para performance e isolamento multi-empresa
------------------------------------------------------------
create index if not exists idx_whatsapp_instances_company on whatsapp_instances(company_id);
create index if not exists idx_whatsapp_messages_company on whatsapp_messages(company_id);
create index if not exists idx_whatsapp_messages_phone on whatsapp_messages(phone);
create index if not exists idx_whatsapp_messages_appointment on whatsapp_messages(appointment_id);
create index if not exists idx_whatsapp_quick_replies_company on whatsapp_quick_replies(company_id);

------------------------------------------------------------
-- 5. Row Level Security (RLS)
------------------------------------------------------------
alter table whatsapp_instances enable row level security;
alter table whatsapp_messages enable row level security;
alter table whatsapp_quick_replies enable row level security;

create policy "whatsapp_instances_isolation"
  on whatsapp_instances for all using (company_id = any(user_company_ids()));

create policy "whatsapp_messages_isolation"
  on whatsapp_messages for all using (company_id = any(user_company_ids()));

create policy "whatsapp_quick_replies_isolation"
  on whatsapp_quick_replies for all using (company_id = any(user_company_ids()));


-- >>> FIM: supabase/migrations/003_whatsapp_integration.sql <<<

