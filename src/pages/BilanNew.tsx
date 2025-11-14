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
import { VoiceRecorder } from "@/components/VoiceRecorder";

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
      // 1. Auth check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // 2. Quota check
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
      console.log("📤 Appel webhook n8n avec notes:", notes);
      
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

      console.log("📥 Statut response:", response.status);

      // 4. Parser la réponse
      const result = await response.json();
      console.log("📊 Résultat complet:", result);

      // 5. Gérer les erreurs
      if (!result.success) {
        if (result.error === "PII_DETECTED") {
          let errorMessage = "⚠️ Données sensibles détectées !\n\n";
          
          if (result.details && result.details.length > 0) {
            errorMessage += "Veuillez retirer les éléments suivants :\n";
            result.details.forEach((detail: string) => {
              errorMessage += `• ${detail}\n`;
            });
          }
          
          errorMessage += "\n💡 Rappel : L'âge (ex: '45 ans') est accepté, mais pas la date de naissance complète.";
          
          setError(errorMessage);
          setPiiDetails(result.details || []);
          
          toast({
            title: "❌ Données personnelles détectées",
            description: "Veuillez modifier vos notes et retirer les informations sensibles",
            variant: "destructive",
            duration: 10000,
          });
          
          setIsGenerating(false);
          return;
        } else {
          throw new Error(result.message || "Erreur lors de la génération");
        }
      }

      // 6. CRITIQUE : Vérifier que result.data existe
      if (!result.data) {
        console.error("❌ Pas de données dans result:", result);
        throw new Error("Le webhook n'a pas retourné de données structurées");
      }

      console.log("✅ Données structurées reçues:", result.data);

      // 7. Sauvegarder dans Supabase
      console.log("💾 Sauvegarde dans Supabase...");
      
      const { data: bilan, error: insertError } = await supabase
        .from("bilans")
        .insert({
          kine_id: user.id,
          contenu_json: result.data,
          contenu_markdown: result.markdown || "",
          statut: "draft",
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ Erreur insertion Supabase:", insertError);
        throw insertError;
      }

      console.log("✅ Bilan créé avec ID:", bilan.id);
      console.log("✅ contenu_json sauvegardé:", bilan.contenu_json);

      // 8. Décrémenter les crédits (Free uniquement)
      if (profile?.plan === "free") {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ credits_free: profile.credits_free - 1 })
          .eq("id", user.id);

        if (updateError) {
          console.error("⚠️ Erreur décrémentation crédits:", updateError);
        }
      }

      // 9. Logger l'utilisation
      await supabase.from("usage_logs").insert({
        kine_id: user.id,
        action_type: "bilan_generate",
        details: { bilan_id: bilan.id },
      });

      // 10. Toast de succès
      toast({
        title: "✅ Bilan généré",
        description: "Votre bilan a été créé avec succès",
      });

      // 11. Rediriger vers validation
      console.log("➡️ Redirection vers /bilan/validate/" + bilan.id);
      navigate(`/bilan/validate/${bilan.id}`);

    } catch (error) {
      console.error("❌ Erreur génération:", error);
      
      setError(error instanceof Error ? error.message : "Une erreur est survenue");
      
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de générer le bilan",
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
            {/* Option 1 : Dictée vocale */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🎤 Option 1 : Dictée vocale
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enregistrez vos observations vocalement, l'IA transcrira automatiquement votre audio en texte.
              </p>
              
              <VoiceRecorder 
                onTranscriptComplete={(text) => {
                  setNotes(text);
                  // Scroll to textarea
                  setTimeout(() => {
                    const textarea = document.querySelector('textarea');
                    textarea?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }}
              />
            </div>

            {/* Séparateur "Ou" */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-semibold">
                  Ou
                </span>
              </div>
            </div>

            {/* Option 2 : Saisie manuelle */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                ✍️ Option 2 : Saisie manuelle
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Saisissez vos notes de consultation. L'IA structurera automatiquement vos notes.
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
            
            {/* Affichage erreur RGPD amélioré */}
            {error && (
              <Alert variant="destructive" className="border-red-500 bg-red-50">
                <AlertTriangle className="h-5 w-5" />
                <div className="space-y-3">
                  <AlertDescription className="whitespace-pre-line font-medium text-sm">
                    {error}
                  </AlertDescription>
                  
                  {/* Guide de correction visuel */}
                  <div className="p-3 bg-white rounded border border-red-200">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="font-semibold text-green-700 mb-1">✅ Exemples autorisés :</p>
                        <ul className="space-y-1 text-gray-600">
                          <li>• "Patient de 45 ans"</li>
                          <li>• "Homme retraité"</li>
                          <li>• "Région parisienne"</li>
                          <li>• "Initiales M.D."</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-red-700 mb-1">❌ Exemples interdits :</p>
                        <ul className="space-y-1 text-gray-600">
                          <li>• "M. Jean Dupont"</li>
                          <li>• "Né le 12/03/1978"</li>
                          <li>• "06.12.34.56.78"</li>
                          <li>• "15 rue de la Paix"</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setError(null);
                      setPiiDetails([]);
                    }}
                  >
                    Compris, je vais corriger mes notes
                  </Button>
                </div>
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