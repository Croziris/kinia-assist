-- Ajouter colonne contenu_markdown à la table bilans
ALTER TABLE bilans ADD COLUMN IF NOT EXISTS contenu_markdown TEXT;