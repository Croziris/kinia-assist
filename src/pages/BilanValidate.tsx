import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function BilanValidate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [bilan, setBilan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBilan();
    }
  }, [id]);

  const fetchBilan = async () => {
    try {
      const { data, error } = await supabase
        .from("bilans")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setBilan(data);
    } catch (error) {
      console.error("Error fetching bilan:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le bilan",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

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
            <CardTitle>📋 Validation du bilan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Bilan en cours de structuration...</h2>
              <p className="text-muted-foreground">
                Cette fonctionnalité sera bientôt disponible.
              </p>
              <p className="text-sm text-muted-foreground">
                Le webhook n8n sera connecté prochainement pour traiter vos notes 
                et générer un bilan structuré.
              </p>
            </div>

            {bilan?.contenu_json?.notes_brutes && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Vos notes :</h3>
                <p className="text-sm whitespace-pre-wrap">
                  {bilan.contenu_json.notes_brutes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
