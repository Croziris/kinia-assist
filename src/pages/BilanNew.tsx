import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function BilanNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const MAX_CHARS = 5000;

  const handleGenerate = async () => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour générer un bilan",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase
        .from("bilans")
        .insert({
          kine_id: user.id,
          contenu_json: { notes_brutes: notes },
          statut: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Bilan créé",
        description: "Analyse en cours...",
      });

      navigate(`/bilan/validate/${data.id}`);
    } catch (error) {
      console.error("Error creating bilan:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le bilan. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">📋 Nouveau Bilan Kinésithérapeutique</h1>
          <p className="text-muted-foreground">
            Saisissez vos notes de consultation pour générer un bilan structuré
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Étape 1 : Saisir vos notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Saisissez vos notes de consultation...&#10;&#10;Exemple :&#10;- Contexte et motif de consultation&#10;- Examens et tests réalisés&#10;- Observations cliniques&#10;- Objectifs thérapeutiques&#10;- Plan de traitement envisagé"
              className="min-h-[400px] resize-y"
              maxLength={MAX_CHARS}
            />

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                {notes.length} / {MAX_CHARS} caractères
              </span>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Attention :</strong> N'incluez pas de données identifiantes 
                (noms, prénoms, dates de naissance) dans vos notes.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleGenerate}
              disabled={notes.length === 0 || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                "Générer le bilan →"
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}