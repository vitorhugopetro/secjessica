-- SecJessica - Migração 004: 10 Otimizações e Recursos Avançados de WhatsApp
-- 1. Botões interativos, 2. Cron D-1, 3. Pré-atendimento/Anamnese, 4. Localização (Waze/Maps/Uber)
-- 5. Pix OCR, 6. NPS Pós-atendimento, 7. Fila de espera, 8. Tags de contatos, 9. Ausência noturna, 10. Fallback 1-clique

------------------------------------------------------------
-- 1. Campos extras em whatsapp_instances
------------------------------------------------------------
alter table if exists whatsapp_instances
  add column if not exists interactive_buttons boolean default true,
  add column if not exists business_hours_start text default '08:00',
  add column if not exists business_hours_end text default '18:00',
  add column if not exists business_days integer[] default '{1,2,3,4,5}',
  add column if not exists out_of_hours_message text default 'Olá! Agradecemos seu contato. Nosso atendimento funciona de segunda a sexta das 08h às 18h. Retornaremos sua mensagem pontualmente no próximo horário útil.',
  add column if not exists nps_enabled boolean default true,
  add column if not exists nps_delay_hours integer default 2,
  add column if not exists anamnese_enabled boolean default true,
  add column if not exists waitlist_enabled boolean default true,
  add column if not exists pix_ocr_enabled boolean default true;

------------------------------------------------------------
-- 2. Tags e Segmentação em contacts
------------------------------------------------------------
alter table if exists contacts
  add column if not exists tags text[] default '{}';

------------------------------------------------------------
-- 3. Fila de Espera para Encaixes de Desistências
------------------------------------------------------------
create table if not exists appointment_waitlist (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  patient_name text not null,
  phone text not null,
  professional_id uuid references professionals(id) on delete set null,
  preferred_shift text default 'any', -- 'morning', 'afternoon', 'any'
  preferred_days text, -- ex: 'segunda, quarta'
  priority integer default 1,
  status text not null default 'waiting', -- 'waiting', 'notified', 'accepted', 'declined', 'expired'
  notified_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

------------------------------------------------------------
-- 4. Pesquisas de Satisfação (NPS Pós-Atendimento)
------------------------------------------------------------
create table if not exists nps_surveys (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  appointment_id uuid references appointments(id) on delete set null,
  patient_name text not null,
  phone text not null,
  score integer check (score >= 1 and score <= 5),
  feedback text,
  sent_at timestamptz default now(),
  answered_at timestamptz,
  status text not null default 'sent' -- 'sent', 'answered', 'expired'
);

------------------------------------------------------------
-- 5. Formulários de Pré-Atendimento e Anamnese Rápida
------------------------------------------------------------
create table if not exists pre_anamnese_forms (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  appointment_id uuid references appointments(id) on delete cascade not null,
  patient_name text not null,
  phone text not null,
  birth_date date,
  cpf text,
  chief_complaint text, -- queixa principal / sintomas
  allergies text, -- alergias conhecidas
  chronic_diseases text, -- comorbidades
  current_medications text, -- medicamentos em uso
  emergency_contact text, -- contato de emergência
  filled_at timestamptz default now(),
  status text not null default 'completed'
);

------------------------------------------------------------
-- 6. Detecção e Registro de Comprovantes Pix via OCR
------------------------------------------------------------
create table if not exists pix_receipts (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  appointment_id uuid references appointments(id) on delete set null,
  sender_phone text not null,
  detected_amount numeric(10,2),
  detected_date timestamptz,
  transaction_id text,
  bank_name text,
  raw_ocr_text text,
  image_url text,
  status text not null default 'pending_verification', -- 'pending_verification', 'confirmed', 'rejected'
  verified_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

------------------------------------------------------------
-- 7. Índices e RLS
------------------------------------------------------------
create index if not exists idx_waitlist_company on appointment_waitlist(company_id);
create index if not exists idx_waitlist_status on appointment_waitlist(status);
create index if not exists idx_nps_company on nps_surveys(company_id);
create index if not exists idx_anamnese_company on pre_anamnese_forms(company_id);
create index if not exists idx_anamnese_appointment on pre_anamnese_forms(appointment_id);
create index if not exists idx_pix_receipts_company on pix_receipts(company_id);

alter table appointment_waitlist enable row level security;
alter table nps_surveys enable row level security;
alter table pre_anamnese_forms enable row level security;
alter table pix_receipts enable row level security;

create policy "waitlist_isolation" on appointment_waitlist for all using (company_id = any(user_company_ids()));
create policy "nps_isolation" on nps_surveys for all using (company_id = any(user_company_ids()));
create policy "anamnese_isolation" on pre_anamnese_forms for all using (company_id = any(user_company_ids()));
create policy "pix_receipts_isolation" on pix_receipts for all using (company_id = any(user_company_ids()));
