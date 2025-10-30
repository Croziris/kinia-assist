import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, Edit, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

export default function BilanValidate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bilan, setBilan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  
  useEffect(() => {
    loadBilan();
  }, [id]);
  
  const loadBilan = async () => {
    try {
      const { data, error } = await supabase
        .from("bilans")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      
      setBilan(data);
      setEditedContent(data.contenu_markdown || data.contenu_json?.notes_brutes || "");
    } catch (err) {
      console.error("Erreur chargement bilan:", err);
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
    try {
      const { error } = await supabase
        .from("bilans")
        .update({ contenu_markdown: editedContent })
        .eq("id", id);
      
      if (error) throw error;
      
      setBilan({ ...bilan, contenu_markdown: editedContent });
      setIsEditing(false);
      
      toast({
        title: "✅ Enregistré !",
        description: "Vos modifications ont été sauvegardées.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder",
        variant: "destructive",
      });
    }
  };
  
  const handleValidate = () => {
    toast({
      title: "🚧 Prochaine étape",
      description: "Sélection du template et insertion patient (Sprint 4)",
    });
    // navigate(`/bilan/finalize/${id}`); // À implémenter Sprint 4
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!bilan) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Bilan introuvable</h1>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au dashboard
        </Button>

        <div className="space-y-6">
          {/* Header avec actions */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">✅ Validation du bilan</h1>
              <p className="text-muted-foreground mt-1">
                Vérifiez et modifiez le contenu avant de finaliser
              </p>
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                  <Button onClick={handleValidate} className="bg-primary hover:bg-primary/90">
                    Valider et continuer →
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <Separator />
          
          {/* Contenu du bilan */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Bilan structuré</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[600px] font-mono text-sm"
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{bilan.contenu_markdown || editedContent}</ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
