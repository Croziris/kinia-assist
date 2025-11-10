import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Loader2, Save, FileDown, ArrowLeft } from "lucide-react";

interface BilanData {
  identifiant: {
    nom: string;
    prenom: string;
    dateNaissance: string;
    telephone: string;
  };
  contexteMedical: {
    diagnostic: string;
    antecedents: string;
  };
  donneesCliniques: {
    bio: {
      plaintePatient: string;
      evaluationDouleur: string;
    };
    habitudesVie: {
      sommeilAlimentationActivite: string;
    };
  };
  environnement: {
    situationVieTravail: string;
  };
  facteursPsycho: {
    anxiete: boolean;
    peurMouvement: boolean;
    troublesHumeur: boolean;
    kinesiophobie: boolean;
  };
  regionCible: string[];
  objectifsPlan: {
    objectifsPatient: string;
    objectifsTraitement: string;
    moyensTraitement: string;
  };
  resume: string;
}

const REGIONS = [
  { id: "cou", label: "Cou" },
  { id: "epaule", label: "Épaule" },
  { id: "coude", label: "Coude" },
  { id: "poignet", label: "Poignet" },
  { id: "haut_dos", label: "Haut du dos" },
  { id: "bas_dos", label: "Bas du dos" },
  { id: "hanche", label: "Hanche" },
  { id: "genou", label: "Genou" },
  { id: "cheville", label: "Cheville" },
];

export default function BilanValidate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [bilanData, setBilanData] = useState<BilanData | null>(null);
  
  useEffect(() => {
    loadBilan();
  }, [id]);
  
  const loadBilan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      
      const { data, error } = await supabase
        .from("bilans")
        .select("contenu_json")
        .eq("id", id)
        .eq("kine_id", user.id)
        .single();
      
      if (error) throw error;
      
      setBilanData(data.contenu_json as unknown as BilanData);
    } catch (error) {
      console.error("Erreur chargement bilan:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le bilan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      
      const { error } = await supabase
        .from("bilans")
        .update({
          contenu_json: bilanData as any,
          statut: "validated",
        })
        .eq("id", id)
        .eq("kine_id", user.id);
      
      if (error) throw error;
      
      toast({
        title: "✅ Bilan sauvegardé",
        description: "Vos modifications ont été enregistrées",
      });
      
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleGeneratePDF = async () => {
    setGenerating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      
      console.log("📄 Génération PDF pour bilan:", id);
      console.log("📊 Données envoyées:", bilanData);
      
      // Appel au webhook n8n
      const response = await fetch("https://n8n.crozier-pierre.fr/webhook/bilan/pdf/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bilan_id: id,
          kine_id: user.id,
          data: bilanData
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("✅ PDF généré:", result);
      
      // Si le PDF a été uploadé sur Scaleway, le télécharger
      if (result.pdf_url) {
        // Ouvrir le PDF dans un nouvel onglet
        window.open(result.pdf_url, '_blank');
        
        toast({
          title: "✅ PDF généré avec succès",
          description: `Le PDF est disponible pendant 30 jours. Il a été ouvert dans un nouvel onglet.`,
        });
        
        // Rediriger vers l'historique après 2 secondes
        setTimeout(() => {
          navigate("/historique");
        }, 2000);
      }
      
    } catch (error: any) {
      console.error("❌ Erreur génération PDF:", error);
      
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer le PDF",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };
  
  const updateField = (path: string, value: any) => {
    setBilanData(prev => {
      if (!prev) return prev;
      
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };
  
  const toggleRegion = (regionId: string) => {
    setBilanData(prev => {
      if (!prev) return prev;
      
      const regions = prev.regionCible || [];
      const newRegions = regions.includes(regionId)
        ? regions.filter(r => r !== regionId)
        : [...regions, regionId];
      
      return { ...prev, regionCible: newRegions };
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5DC]">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B9D83]" />
      </div>
    );
  }
  
  if (!bilanData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5DC]">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Aucune donnée trouvée</p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")}
              className="mt-4 w-full"
            >
              Retour au dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#F5F5DC] pb-20 md:pb-0">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header avec boutons actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div className="flex-1">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            
            <h1 className="text-3xl sm:text-4xl font-black text-gray-800">
              Bilan kiné
            </h1>
            <p className="text-gray-600 mt-2">
              Complétez et modifiez le formulaire généré par l'IA
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleGeneratePDF}
              disabled={generating}
              className="w-full sm:w-auto"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération PDF...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Générer PDF
                </>
              )}
            </Button>
            
            <Button 
              size="lg"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#C5A572] hover:bg-[#b59562] w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Grid 3 colonnes responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* ========================================
              COLONNE 1 : Identifiant + Contexte
          ======================================== */}
          <div className="lg:col-span-1 xl:col-span-1 flex flex-col gap-6">
            
            {/* CARD : Identifiant patient */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl">👤 Identifiant patient</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={bilanData.identifiant?.nom || ""}
                    onChange={(e) => updateField('identifiant.nom', e.target.value)}
                    placeholder="Nom du patient"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={bilanData.identifiant?.prenom || ""}
                    onChange={(e) => updateField('identifiant.prenom', e.target.value)}
                    placeholder="Prénom du patient"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateNaissance">Date de naissance</Label>
                  <Input
                    id="dateNaissance"
                    type="date"
                    value={bilanData.identifiant?.dateNaissance || ""}
                    onChange={(e) => updateField('identifiant.dateNaissance', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={bilanData.identifiant?.telephone || ""}
                    onChange={(e) => updateField('identifiant.telephone', e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* CARD : Contexte médical */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl">🏥 Contexte Médical</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="diagnostic">Diagnostic (ordonnance)</Label>
                  <Textarea
                    id="diagnostic"
                    value={bilanData.contexteMedical?.diagnostic || ""}
                    onChange={(e) => updateField('contexteMedical.diagnostic', e.target.value)}
                    placeholder="Entrez le diagnostic..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="antecedents">Antécédents & Examens</Label>
                  <Textarea
                    id="antecedents"
                    value={bilanData.contexteMedical?.antecedents || ""}
                    onChange={(e) => updateField('contexteMedical.antecedents', e.target.value)}
                    placeholder="Notez les examens complémentaires..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* ========================================
              COLONNE 2 : Données cliniques + Objectifs
          ======================================== */}
          <div className="lg:col-span-2 xl:col-span-2 flex flex-col gap-6">
            
            {/* CARD : Données cliniques */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl">🩺 Données cliniques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Section Bio */}
                <div>
                  <h3 className="text-lg font-bold text-[#8B9D83] pb-3 border-b border-gray-200 mb-4">
                    Bio
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="plaintePatient">Plainte du patient</Label>
                      <Textarea
                        id="plaintePatient"
                        value={bilanData.donneesCliniques?.bio?.plaintePatient || ""}
                        onChange={(e) => updateField('donneesCliniques.bio.plaintePatient', e.target.value)}
                        placeholder="Décrivez la plainte principale..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="evaluationDouleur">Évaluation de la douleur & Tests</Label>
                      <Textarea
                        id="evaluationDouleur"
                        value={bilanData.donneesCliniques?.bio?.evaluationDouleur || ""}
                        onChange={(e) => updateField('donneesCliniques.bio.evaluationDouleur', e.target.value)}
                        placeholder="Niveaux de douleur, déclencheurs, tests cliniques..."
                        rows={6}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Section Habitudes de vie */}
                <div>
                  <h3 className="text-lg font-bold text-[#8B9D83] pb-3 border-b border-gray-200 mb-4">
                    Habitudes de vie
                  </h3>
                  
                  <div>
                    <Label htmlFor="habitudesVie">Sommeil, alimentation & activité physique</Label>
                    <Textarea
                      id="habitudesVie"
                      value={bilanData.donneesCliniques?.habitudesVie?.sommeilAlimentationActivite || ""}
                      onChange={(e) => updateField('donneesCliniques.habitudesVie.sommeilAlimentationActivite', e.target.value)}
                      placeholder="Qualité du sommeil, alimentation, activités..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* CARD : Objectifs & Plan */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl">🎯 Objectifs & Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="objectifsPatient">Objectifs patient</Label>
                    <Textarea
                      id="objectifsPatient"
                      value={bilanData.objectifsPlan?.objectifsPatient || ""}
                      onChange={(e) => updateField('objectifsPlan.objectifsPatient', e.target.value)}
                      placeholder="Objectifs rapportés par le patient..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="objectifsTraitement">Objectifs traitement</Label>
                    <Textarea
                      id="objectifsTraitement"
                      value={bilanData.objectifsPlan?.objectifsTraitement || ""}
                      onChange={(e) => updateField('objectifsPlan.objectifsTraitement', e.target.value)}
                      placeholder="Objectifs définis par le clinicien..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="moyensTraitement">Moyens traitement</Label>
                    <Textarea
                      id="moyensTraitement"
                      value={bilanData.objectifsPlan?.moyensTraitement || ""}
                      onChange={(e) => updateField('objectifsPlan.moyensTraitement', e.target.value)}
                      placeholder="Méthodes de traitement et interventions..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* CARD : Résumé */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl">📝 Résumé</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={bilanData.resume || ""}
                  onChange={(e) => updateField('resume', e.target.value)}
                  placeholder="Résumé concis de 2-3 lignes du bilan..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* ========================================
              COLONNE 3 : Environnement + Psycho + Région
          ======================================== */}
          <div className="lg:col-span-3 xl:col-span-1 flex flex-col gap-6">
            
            {/* CARD : Environnement */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl">🏠 Environnement</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="environnement">Situation de vie & travail</Label>
                  <Textarea
                    id="environnement"
                    value={bilanData.environnement?.situationVieTravail || ""}
                    onChange={(e) => updateField('environnement.situationVieTravail', e.target.value)}
                    placeholder="Environnement domestique, travail, cercle social..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* CARD : Facteurs psycho */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl">🧠 Facteurs psycho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={bilanData.facteursPsycho?.anxiete || false}
                    onCheckedChange={(checked) => updateField('facteursPsycho.anxiete', checked)}
                  />
                  <span className="text-base font-medium">Anxiété</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={bilanData.facteursPsycho?.peurMouvement || false}
                    onCheckedChange={(checked) => updateField('facteursPsycho.peurMouvement', checked)}
                  />
                  <span className="text-base font-medium">Peur du mouvement</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={bilanData.facteursPsycho?.troublesHumeur || false}
                    onCheckedChange={(checked) => updateField('facteursPsycho.troublesHumeur', checked)}
                  />
                  <span className="text-base font-medium">Troubles de l'humeur</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={bilanData.facteursPsycho?.kinesiophobie || false}
                    onCheckedChange={(checked) => updateField('facteursPsycho.kinesiophobie', checked)}
                  />
                  <span className="text-base font-medium">Kinésiophobie</span>
                </label>
              </CardContent>
            </Card>
            
            {/* CARD : Région cible */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl">🎯 Région cible</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map((region) => {
                    const isSelected = bilanData.regionCible?.includes(region.id);
                    
                    return (
                      <button
                        key={region.id}
                        onClick={() => toggleRegion(region.id)}
                        className={`
                          px-3 py-2 rounded-full text-sm font-medium transition-colors
                          ${isSelected 
                            ? 'bg-[#8B9D83]/20 text-[#8B9D83] font-bold ring-2 ring-[#8B9D83]' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                        `}
                      >
                        {region.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Bouton sauvegarder fixe mobile */}
        <div className="fixed bottom-20 md:bottom-4 right-4 z-40 md:hidden">
          <Button 
            size="lg"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#C5A572] hover:bg-[#b59562] shadow-lg"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
