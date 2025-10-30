-- Create enum for user plans
CREATE TYPE public.user_plan AS ENUM ('free', 'premium');

-- Create enum for chatbot types
CREATE TYPE public.chatbot_type AS ENUM ('nomenclature', 'exercises', 'social_media', 'pricing', 'coming_soon');

-- Extend users with plan and credits (profiles table)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan user_plan NOT NULL DEFAULT 'free',
  credits_free INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create profiles automatically on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, plan, credits_free)
  VALUES (NEW.id, 'free', 2);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kine_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE,
  email TEXT,
  telephone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patients"
  ON public.patients FOR SELECT
  USING (auth.uid() = kine_id);

CREATE POLICY "Users can create their own patients"
  ON public.patients FOR INSERT
  WITH CHECK (auth.uid() = kine_id);

CREATE POLICY "Users can update their own patients"
  ON public.patients FOR UPDATE
  USING (auth.uid() = kine_id);

CREATE POLICY "Users can delete their own patients"
  ON public.patients FOR DELETE
  USING (auth.uid() = kine_id);

-- Templates table
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL,
  region TEXT NOT NULL,
  contenu_markdown TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by authenticated users"
  ON public.templates FOR SELECT
  TO authenticated
  USING (true);

-- Bilans table
CREATE TABLE public.bilans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kine_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  fichier_url TEXT,
  statut TEXT NOT NULL DEFAULT 'draft',
  contenu_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bilans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bilans"
  ON public.bilans FOR SELECT
  USING (auth.uid() = kine_id);

CREATE POLICY "Users can create their own bilans"
  ON public.bilans FOR INSERT
  WITH CHECK (auth.uid() = kine_id);

CREATE POLICY "Users can update their own bilans"
  ON public.bilans FOR UPDATE
  USING (auth.uid() = kine_id);

CREATE POLICY "Users can delete their own bilans"
  ON public.bilans FOR DELETE
  USING (auth.uid() = kine_id);

-- Chatbots table
CREATE TABLE public.chatbots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  type chatbot_type NOT NULL,
  requires_premium BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chatbots are viewable by authenticated users"
  ON public.chatbots FOR SELECT
  TO authenticated
  USING (true);

-- Chatbot conversations table
CREATE TABLE public.chatbot_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kine_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON public.chatbot_conversations FOR SELECT
  USING (auth.uid() = kine_id);

CREATE POLICY "Users can create their own conversations"
  ON public.chatbot_conversations FOR INSERT
  WITH CHECK (auth.uid() = kine_id);

CREATE POLICY "Users can update their own conversations"
  ON public.chatbot_conversations FOR UPDATE
  USING (auth.uid() = kine_id);

-- Usage logs table
CREATE TABLE public.usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kine_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs"
  ON public.usage_logs FOR SELECT
  USING (auth.uid() = kine_id);

CREATE POLICY "System can insert logs"
  ON public.usage_logs FOR INSERT
  WITH CHECK (true);

-- Insert default chatbots
INSERT INTO public.chatbots (slug, titre, description, emoji, type, requires_premium, is_active) VALUES
  ('nomenclature-ngap', 'Aide Nomenclature NGAP', 'Trouvez le bon code acte en quelques secondes', '📖', 'nomenclature', true, true),
  ('creation-exercices', 'Création d''Exercices', 'Programmes personnalisés pour vos patients', '💪', 'exercises', true, true),
  ('posts-reseaux', 'Posts Réseaux Sociaux', 'Contenu professionnel automatisé', '📱', 'social_media', true, true),
  ('actes-hors-nomenclature', 'Actes Hors Nomenclature', 'Devis et tarifs personnalisés', '💼', 'pricing', true, true),
  ('bientot-disponible', 'Bientôt disponible', 'Nouvelles fonctions en développement', '🔜', 'coming_soon', true, false);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bilans_updated_at
  BEFORE UPDATE ON public.bilans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chatbot_conversations_updated_at
  BEFORE UPDATE ON public.chatbot_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();