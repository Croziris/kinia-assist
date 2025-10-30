import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Calendar, TrendingUp } from "lucide-react";

export default function Parametres() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: profile?.nom || "",
    prenom: profile?.prenom || "",
    rpps: profile?.rpps || "",
    adresse: profile?.adresse || "",
    telephone: profile?.telephone || "",
  });

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
      
      refreshProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      toast({
        title: "Email envoyé",
        description: "Consultez votre boîte mail pour réinitialiser votre mot de passe.",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email de réinitialisation.",
        variant: "destructive",
      });
    }
  };

  const isPremium = profile?.plan === "premium";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">⚙️ Paramètres du compte</h1>

        <Tabs defaultValue="profil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="profil">Profil</TabsTrigger>
            <TabsTrigger value="abonnement">Abonnement</TabsTrigger>
            <TabsTrigger value="securite">Sécurité</TabsTrigger>
          </TabsList>

          {/* ONGLET PROFIL */}
          <TabsContent value="profil">
            <Card>
              <CardHeader>
                <CardTitle>📝 Informations professionnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) =>
                        setFormData({ ...formData, prenom: e.target.value })
                      }
                      placeholder="Jean"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) =>
                        setFormData({ ...formData, nom: e.target.value })
                      }
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    L'email ne peut pas être modifié
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rpps">N° RPPS</Label>
                    <Input
                      id="rpps"
                      value={formData.rpps}
                      onChange={(e) =>
                        setFormData({ ...formData, rpps: e.target.value })
                      }
                      placeholder="12345678901"
                      maxLength={11}
                    />
                    <p className="text-xs text-muted-foreground">11 chiffres</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      value={formData.telephone}
                      onChange={(e) =>
                        setFormData({ ...formData, telephone: e.target.value })
                      }
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse du cabinet</Label>
                  <Textarea
                    id="adresse"
                    value={formData.adresse}
                    onChange={(e) =>
                      setFormData({ ...formData, adresse: e.target.value })
                    }
                    placeholder="123 rue de la Santé&#10;75014 Paris"
                    className="min-h-[100px]"
                  />
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer les modifications"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET ABONNEMENT */}
          <TabsContent value="abonnement">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isPremium ? (
                    <>
                      💎 Abonnement Premium
                      <Badge variant="secondary">Actif</Badge>
                    </>
                  ) : (
                    <>🆓 Compte Gratuit</>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isPremium ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Statut</span>
                        <span className="font-medium text-green-600">Actif ✅</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Plan</span>
                        <span className="font-medium">Premium (29€/mois)</span>
                      </div>
                      {profile?.plan_expires_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Expire le</span>
                          <span className="font-medium">
                            {new Date(profile.plan_expires_at).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Utilisation ce mois
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Bilans générés</span>
                          <span className="font-medium">Illimité ∞</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Messages chatbots</span>
                          <span className="font-medium">Illimité ∞</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <Button variant="outline" className="w-full" disabled>
                        Gérer mon abonnement
                        <span className="text-xs ml-2">(Prochainement)</span>
                      </Button>
                      <Button variant="ghost" className="w-full text-destructive" disabled>
                        Annuler l'abonnement
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center space-y-4 py-4">
                      <p className="text-muted-foreground">
                        Vous utilisez actuellement la version gratuite.
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Crédits restants</span>
                          <span className="font-medium">
                            {profile?.credits_free || 0}/2 bilans
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        Passez Premium pour :
                      </h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="text-green-600">✅</span>
                          Bilans illimités
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-600">✅</span>
                          Tous les chatbots accessibles
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-600">✅</span>
                          Historique complet
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-600">✅</span>
                          Support prioritaire
                        </li>
                      </ul>
                    </div>

                    <Button className="w-full" size="lg" disabled>
                      Passer Premium - 29€/mois →
                      <span className="text-xs ml-2">(Prochainement)</span>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET SÉCURITÉ */}
          <TabsContent value="securite">
            <Card>
              <CardHeader>
                <CardTitle>🔒 Sécurité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Mot de passe</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Réinitialisez votre mot de passe en recevant un lien par email
                  </p>
                  <Button onClick={handlePasswordReset} variant="outline">
                    Changer mon mot de passe
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Sessions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Déconnectez-vous de tous les appareils
                  </p>
                  <Button variant="outline" disabled>
                    Se déconnecter de tous les appareils
                    <span className="text-xs ml-2">(Prochainement)</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}