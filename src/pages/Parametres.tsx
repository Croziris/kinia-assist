import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Calendar, TrendingUp } from "lucide-react";

export default function Parametres() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    rpps: "",
    adresse: "",
    telephone: "",
    logo_url: "",
  });

  // Synchroniser formData avec le profil quand il se charge
  useEffect(() => {
    if (profile) {
      setFormData({
        prenom: profile.prenom || "",
        nom: profile.nom || "",
        rpps: profile.rpps || "",
        adresse: profile.adresse || "",
        telephone: profile.telephone || "",
        // @ts-ignore - logo_url column will be available after types refresh
        logo_url: profile.logo_url || "",
      });
    }
  }, [profile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "Le logo ne doit pas dépasser 2MB",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      
      // Upload vers Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-logo.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);
      
      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      
      toast({
        title: "✅ Logo uploadé",
        description: "N'oubliez pas d'enregistrer vos modifications",
      });
    } catch (error) {
      console.error("Erreur upload:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'uploader le logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          prenom: formData.prenom,
          nom: formData.nom,
          rpps: formData.rpps,
          adresse: formData.adresse,
          telephone: formData.telephone,
          logo_url: formData.logo_url,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "✅ Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
      
      await refreshProfile();
      setIsEditing(false);
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

  const handleCancel = () => {
    // Réinitialiser les données avec le profil actuel
    if (profile) {
      setFormData({
        prenom: profile.prenom || "",
        nom: profile.nom || "",
        rpps: profile.rpps || "",
        adresse: profile.adresse || "",
        telephone: profile.telephone || "",
        // @ts-ignore
        logo_url: profile.logo_url || "",
      });
    }
    setIsEditing(false);
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
              <CardContent className="space-y-6">
                {/* Logo cabinet */}
                <div className="space-y-2">
                  <Label>Logo du cabinet</Label>
                  {isEditing ? (
                    <div className="flex items-center gap-4">
                      {formData.logo_url && (
                        <img 
                          src={formData.logo_url} 
                          alt="Logo" 
                          className="h-16 w-16 rounded object-contain border"
                        />
                      )}
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploading}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG ou SVG. Max 2MB.
                        </p>
                      </div>
                      {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {formData.logo_url ? (
                        <img 
                          src={formData.logo_url} 
                          alt="Logo" 
                          className="h-16 w-16 rounded object-contain border"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded border border-dashed flex items-center justify-center text-muted-foreground text-xs">
                          Aucun logo
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Prénom et Nom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prénom</Label>
                    {isEditing ? (
                      <Input
                        name="given-name"
                        autoComplete="given-name"
                        value={formData.prenom}
                        onChange={(e) =>
                          setFormData({ ...formData, prenom: e.target.value })
                        }
                        placeholder="Jean"
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-muted rounded-md">
                        {formData.prenom || "Non renseigné"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Nom</Label>
                    {isEditing ? (
                      <Input
                        name="family-name"
                        autoComplete="family-name"
                        value={formData.nom}
                        onChange={(e) =>
                          setFormData({ ...formData, nom: e.target.value })
                        }
                        placeholder="Dupont"
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 bg-muted rounded-md">
                        {formData.nom || "Non renseigné"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">
                    {user?.email || "Non renseigné"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    L'email ne peut pas être modifié
                  </p>
                </div>

                {/* RPPS */}
                <div className="space-y-2">
                  <Label>Numéro RPPS</Label>
                  {isEditing ? (
                    <>
                      <Input
                        value={formData.rpps}
                        onChange={(e) =>
                          setFormData({ ...formData, rpps: e.target.value })
                        }
                        placeholder="12345678901"
                        maxLength={11}
                        pattern="[0-9]{11}"
                      />
                      <p className="text-xs text-muted-foreground">
                        11 chiffres - Requis pour les bilans officiels
                      </p>
                    </>
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {formData.rpps || "Non renseigné"}
                    </p>
                  )}
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <Label>Téléphone professionnel</Label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      autoComplete="tel"
                      value={formData.telephone}
                      onChange={(e) =>
                        setFormData({ ...formData, telephone: e.target.value })
                      }
                      placeholder="06 12 34 56 78"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                      {formData.telephone || "Non renseigné"}
                    </p>
                  )}
                </div>

                {/* Adresse */}
                <div className="space-y-2">
                  <Label>Adresse du cabinet</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.adresse}
                      onChange={(e) =>
                        setFormData({ ...formData, adresse: e.target.value })
                      }
                      placeholder="123 rue de la Santé&#10;75014 Paris"
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted rounded-md whitespace-pre-wrap">
                      {formData.adresse || "Non renseigné"}
                    </p>
                  )}
                </div>

                {/* Boutons */}
                {isEditing ? (
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex-1 sm:flex-none"
                    >
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={isSaving} 
                      className="flex-1 sm:flex-none bg-[#8B9D83] hover:bg-[#7a8a72]"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        "Enregistrer"
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="w-full sm:w-auto bg-[#8B9D83] hover:bg-[#7a8a72]"
                  >
                    Modifier mes informations
                  </Button>
                )}
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