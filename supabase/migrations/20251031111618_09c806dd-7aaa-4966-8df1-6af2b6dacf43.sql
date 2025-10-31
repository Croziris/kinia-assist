-- Ajouter colonne onboarding_completed
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Créer bucket pour les logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos', 
  'logos', 
  true, 
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Politique RLS pour le bucket logos
CREATE POLICY "Users can upload own logo" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own logo" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Public can view logos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'logos');