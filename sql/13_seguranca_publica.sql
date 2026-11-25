-- =====================================================================
-- AgendaMogi — Migração 13: Segurança pública (revogar EXECUTE do anon)
-- Onde rodar: Supabase > SQL Editor > New query > colar tudo > Run
-- Pré-requisito: Migração 03 executada; Edge Function create-booking publicada.
-- =====================================================================
-- Após ativar o Turnstile, a criação de agendamento passa pela Edge Function
-- (service role). Revoga-se o EXECUTE do anon na RPC para que não seja
-- chamada direto pelo navegador.
revoke execute on function public.create_public_appointment(text, uuid, uuid, timestamptz, text, text, text, boolean, text)
  from anon, authenticated;