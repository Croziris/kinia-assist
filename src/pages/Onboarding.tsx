import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    rpps: "",
    adresse: "",
    telephone: ""
  });
  
  const handleComplete = async () => {
    if (!formData.nom || !formData.prenom) {
      toast({
        title: "Informations manquantes",
        description: "Le nom et prénom sont obligatoires",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      
      // Sauvegarder les infos
      const { error } = await supabase
        .from("profiles")
        .update({
          ...formData,
          onboarding_completed: true
        })
        .eq("id", user.id);
      
      if (error) throw error;
      
      toast({
        title: "✅ Bienvenue !",
        description: "Votre profil a été configuré avec succès",
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Erreur onboarding:", error);
      toast({
        title: "Erreur",
        description: "Impossible de terminer la configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5DC] to-white flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="text-center space-y-2">
            <div className="text-4xl">👋</div>
            <CardTitle className="text-2xl">Bienvenue sur Kiné Assistant</CardTitle>
            <p className="text-muted-foreground">
              Configurons votre profil professionnel
            </p>
          </div>
          <Progress value={step * 33} className="mt-4" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Étape 1 : Identité</h3>
              
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  name="given-name"
                  autoComplete="given-name"
                  value={formData.prenom}
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                  placeholder="Jean"
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  name="family-name"
                  autoComplete="family-name"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  placeholder="Dupont"
                />
              </div>
              
              <Button 
                onClick={() => setStep(2)}
                disabled={!formData.nom || !formData.prenom}
                className="w-full bg-[#8B9D83] hover:bg-[#7a8a72]"
              >
                Suivant →
              </Button>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Étape 2 : Informations professionnelles</h3>
              
              <div className="space-y-2">
                <Label htmlFor="rpps">Numéro RPPS (optionnel)</Label>
                <Input
                  id="rpps"
                  value={formData.rpps}
                  onChange={(e) => setFormData({...formData, rpps: e.target.value})}
                  placeholder="12345678901"
                  maxLength={11}
                />
                <p className="text-xs text-muted-foreground">
                  11 chiffres - Requis pour les bilans officiels
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone professionnel</Label>
                <Input
                  id="telephone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  placeholder="06 12 34 56 78"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  ← Retour
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  className="flex-1 bg-[#8B9D83] hover:bg-[#7a8a72]"
                >
                  Suivant →
                </Button>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Étape 3 : Adresse du cabinet</h3>
              
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse (optionnel)</Label>
                <Textarea
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                  placeholder="15 rue de la Santé&#10;75014 Paris"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  ← Retour
                </Button>
                <Button 
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 bg-[#8B9D83] hover:bg-[#7a8a72]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Configuration...
                    </>
                  ) : (
                    "Terminer ✓"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
