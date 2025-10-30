-- Ajouter les champs manquants à la table profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;

-- Mettre l'utilisateur admin en premium
-- Note: On ne peut pas filtrer par email directement dans profiles
-- On doit d'abord créer une fonction pour récupérer l'email depuis auth.users
CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = user_id;
$$;

-- Maintenant on peut mettre à jour le profil
UPDATE profiles 
SET 
  plan = 'premium',
  credits_free = 999999,
  plan_expires_at = '2099-12-31'
WHERE get_user_email(id) = 'crz.pierre13@gmail.com';