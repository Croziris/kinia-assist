import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const WEBHOOK_URL = "https://n8n.crozier-pierre.fr/webhook/bilan/intake/v2";

export default function BilanNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [piiDetails, setPiiDetails] = useState<string[]>([]);
  
  const MAX_CHARS = 5000;
  
  const handleGenerate = async () => {
    if (!notes.trim()) {
      toast({
        title: "Attention",
        description: "Veuillez saisir vos notes avant de générer le bilan.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setPiiDetails([]);
    
    try {
      // 1. Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Non authentifié");
      }
      
      // 2. Vérifier les quotas (si plan free)
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, credits_free")
        .eq("id", user.id)
        .single();
      
      if (profile?.plan === "free" && profile.credits_free <= 0) {
        toast({
          title: "Quota épuisé",
          description: "Vous avez utilisé vos 2 bilans gratuits. Passez Premium pour continuer.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }
      
      // 3. Appeler le webhook n8n
      console.log("Appel webhook n8n...");
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: notes,
          kine_id: user.id,
        }),
      });
      
      console.log("Statut response:", response.status);
      
      if (!response.ok && response.status !== 400) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Résultat:", result);
      
      // 4. Gérer les erreurs RGPD (HTTP 400 + success: false)
      if (!result.success) {
        if (result.error === "PII_DETECTED") {
          setError("⚠️ Données sensibles détectées dans vos notes !");
          setPiiDetails(result.details || []);
          setIsGenerating(false);
          return;
        } else {
          throw new Error(result.message || "Erreur inconnue");
        }
      }
      
      // 5. Créer le bilan dans Supabase
      const { data: bilan, error: insertError } = await supabase
        .from("bilans")
        .insert({
          kine_id: user.id,
          contenu_markdown: result.markdown,
          statut: "brouillon",
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // 6. Décrémenter le quota si free
      if (profile?.plan === "free") {
        await supabase
          .from("profiles")
          .update({ credits_free: profile.credits_free - 1 })
          .eq("id", user.id);
      }
      
      // 7. Logger l'utilisation
      await supabase.from("usage_logs").insert({
        kine_id: user.id,
        action_type: "bilan_generate",
        details: { bilan_id: bilan.id },
      });
      
      // 8. Succès : redirection
      toast({
        title: "✅ Bilan généré !",
        description: "Vous pouvez maintenant le valider et le modifier.",
      });
      
      navigate(`/bilan/validate/${bilan.id}`);
      
    } catch (err) {
      console.error("Erreur génération:", err);
      toast({
        title: "❌ Erreur",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
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

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              📋 Nouveau Bilan Kinésithérapeutique
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Étape 1 : Saisir vos notes de consultation
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Décrivez librement votre consultation. L'IA structurera automatiquement vos notes.
              </p>
              
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={`Exemple :\n\n• Contexte : Patient vient pour douleurs épaule droite depuis 3 semaines\n• Examen : Limitation abduction 90°, douleur arc douloureux positif\n• Tests : Jobe positif, Hawkins positif\n• Hypothèse : Tendinopathie supra-épineux\n• Objectifs : Diminuer douleur, récupérer amplitudes\n• Traitement : Massage transverse profond, renforcement excentrique`}
                className="min-h-[400px] font-mono text-sm"
                maxLength={MAX_CHARS}
              />
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">
                  {notes.length} / {MAX_CHARS} caractères
                </span>
                
                {notes.length > MAX_CHARS * 0.9 && (
                  <span className="text-xs text-orange-500 font-medium">
                    ⚠️ Approche de la limite
                  </span>
                )}
              </div>
            </div>
            
            {/* Avertissement RGPD */}
            <Alert className="border-orange-300 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Important :</strong> N'incluez AUCUNE donnée identifiante 
                (nom, prénom, date de naissance, adresse). Vous ajouterez les informations 
                patient à l'étape suivante de manière sécurisée.
              </AlertDescription>
            </Alert>
            
            {/* Affichage erreur RGPD */}
            {error && piiDetails.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <p className="font-bold mb-2">{error}</p>
                  <p className="text-sm mb-2">Veuillez retirer les éléments suivants :</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {piiDetails.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Bouton génération */}
            <Button
              onClick={handleGenerate}
              disabled={notes.trim().length === 0 || isGenerating}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyse en cours... (15-30 secondes)
                </>
              ) : (
                <>
                  ✨ Générer le bilan structuré
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              L'IA va analyser vos notes et les organiser en sections professionnelles. 
              Vous pourrez ensuite valider et modifier le contenu.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}