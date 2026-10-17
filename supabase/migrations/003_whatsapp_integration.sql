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
