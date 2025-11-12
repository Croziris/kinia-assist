import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, FileDown, Trash2, AlertCircle, Loader2, FileText, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Historique() {
  const navigate = useNavigate();
  const [bilans, setBilans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBilans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      setLoading(true);

      const { data, error } = await supabase
        .from("bilans")
        .select(`
          id,
          created_at,
          updated_at,
          statut,
          contenu_json,
          pdf_url,
          pdf_expire_at,
          pdf_downloaded
        `)
        .eq("kine_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBilans(data || []);
    } catch (error) {
      console.error("Erreur chargement bilans:", error);
      toast.error("Impossible de charger les bilans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilans();
  }, []);

  const calculateDaysLeft = (expireDate: string | null) => {
    if (!expireDate) return null;
    
    const now = new Date();
    const expire = new Date(expireDate);
    const diffTime = expire.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "exported":
        return { label: "📄 PDF généré", variant: "default" as const };
      case "validated":
        return { label: "✅ Validé", variant: "secondary" as const };
      default:
        return { label: "📝 Brouillon", variant: "outline" as const };
    }
  };

  const getResumePreview = (contenuJson: any) => {
    if (!contenuJson) return "Aucun résumé disponible";
    return contenuJson.resume || "Aucun résumé disponible";
  };

  const handleDelete = async (bilanId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce bilan ?")) return;

    try {
      const { error } = await supabase
        .from("bilans")
        .delete()
        .eq("id", bilanId);

      if (error) throw error;

      toast.success("Bilan supprimé");
      loadBilans();
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Impossible de supprimer le bilan");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement des bilans...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Historique des Bilans</h1>
          <p className="text-muted-foreground">
            Retrouvez tous vos bilans créés
          </p>
        </div>

        {bilans.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-gray-100 p-6">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Aucun bilan pour le moment
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Créez votre premier bilan en quelques minutes grâce à l'IA
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => navigate("/bilan/new")}
                  className="bg-[#8B9D83] hover:bg-[#7a8c73]"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Créer mon premier bilan
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bilans.map((bilan) => {
              const statusBadge = getStatusBadge(bilan.statut);
              const daysLeft = calculateDaysLeft(bilan.pdf_expire_at);
              const resumePreview = getResumePreview(bilan.contenu_json);
              
              return (
                <Card key={bilan.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    {/* Header avec date */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Créé le {new Date(bilan.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                        {bilan.updated_at !== bilan.created_at && (
                          <p className="text-xs text-gray-400">
                            Modifié le {new Date(bilan.updated_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Badges de statut */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                      
                      {bilan.pdf_url && daysLeft !== null && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${daysLeft <= 7 ? 'border-orange-500 text-orange-700' : ''} ${daysLeft <= 0 ? 'border-red-500 text-red-700' : ''}`}
                        >
                          {daysLeft > 0 ? `Expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}` : 'Expiré'}
                        </Badge>
                      )}
                      
                      {bilan.pdf_downloaded && (
                        <Badge variant="outline" className="text-xs bg-green-50 border-green-300 text-green-700">
                          ✓ Téléchargé
                        </Badge>
                      )}
                    </div>

                    {/* Résumé */}
                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {resumePreview}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {/* Bouton Modifier (si pas exported) */}
                      {bilan.statut !== "exported" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/bilan/validate/${bilan.id}`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </Button>
                      )}
                      
                      {/* Bouton Télécharger PDF (si exported et pas expiré) */}
                      {bilan.statut === "exported" && bilan.pdf_url && daysLeft && daysLeft > 0 && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            window.open(bilan.pdf_url, '_blank');
                            toast.success("PDF ouvert dans un nouvel onglet");
                          }}
                          className="bg-[#C5A572] hover:bg-[#b59562]"
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          Télécharger PDF
                        </Button>
                      )}
                      
                      {/* Message si PDF expiré */}
                      {bilan.statut === "exported" && bilan.pdf_url && daysLeft !== null && daysLeft <= 0 && (
                        <span className="text-sm text-red-600 italic flex items-center">
                          <AlertCircle className="mr-1 h-4 w-4" />
                          PDF expiré - Veuillez régénérer
                        </span>
                      )}
                      
                      {/* Message si pas encore de PDF */}
                      {bilan.statut === "validated" && !bilan.pdf_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/bilan/validate/${bilan.id}`)}
                          className="border-[#8B9D83] text-[#8B9D83] hover:bg-[#8B9D83] hover:text-white"
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          Générer PDF
                        </Button>
                      )}
                      
                      {/* Bouton Supprimer */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(bilan.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}