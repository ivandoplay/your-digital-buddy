-- Create test account for development
-- Credentials: teste@teste.com / teste123

-- Create auth user (idempotent)
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  confirmation_sent_at,
  last_sign_in_at,
  aud,
  role,
  instance_id
) VALUES (
  'teste@teste.com',
  crypt('teste123', gen_salt('bf')),
  now(),
  '',
  now(),
  now(),
  'authenticated',
  'authenticated',
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('teste123', gen_salt('bf')),
  email_confirmed_at = now(),
  confirmation_sent_at = now(),
  last_sign_in_at = now';

-- Create usuario record if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'usuarios'
  ) THEN
    INSERT INTO public.usuarios (id, email, nome, created_at, updated_at)
    SELECT id, email, 'Usuário Teste', now(), now()
    FROM auth.users
    WHERE email = 'teste@teste.com'
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;