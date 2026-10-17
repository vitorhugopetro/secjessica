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
