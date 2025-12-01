import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ProgramResponse, TherapistInfo, PdfGenerationPayload } from "@/types/exercises";

const PDF_WEBHOOK_URL = "https://n8n.crozier-pierre.fr/webhook/assistant-exercices-pdf";

const getDifficultyColor = (difficulte: number) => {
  if (difficulte <= 2) return "bg-green-100 text-green-800";
  if (difficulte <= 4) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
};

export default function ExerciseProgramPdfPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const initialState = location.state as {
    sessionId: string;
    kineId: string;
    program: ProgramResponse;
  } | null;

  const [program, setProgram] = useState<ProgramResponse | null>(initialState?.program || null);
  const [commentsByExerciseId, setCommentsByExerciseId] = useState<Record<string, string>>({});
  const [therapist, setTherapist] = useState<TherapistInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!program) {
      navigate("/chatbot/creation-exercices");
      return;
    }

    const fetchTherapistInfo = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // TODO: adapter les noms de colonnes si besoin
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nom, prenom, rpps, telephone, adresse, logo_url")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Erreur chargement profil kiné", error);
        return;
      }

      // Récupération de l'email depuis auth
      const email = user.email || "";

      setTherapist({
        id: data.id,
        firstName: data.prenom || "",
        lastName: data.nom || "",
        email: email,
        rppsNumber: data.rpps || "",
        phone: data.telephone || "",
        clinicAddress: data.adresse || "",
        logoUrl: data.logo_url,
      });
    };

    fetchTherapistInfo();
  }, [program, navigate]);

  const handleChangeComment = (id: string, value: string) => {
    setCommentsByExerciseId((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleDownloadPdf = async () => {
    if (!program || !therapist) return;

    setIsSubmitting(true);
    try {
      const enrichedExercises = program.exercises.map((ex) => ({
        ...ex,
        comment: commentsByExerciseId[ex.id] ?? "",
      }));

      const payload: PdfGenerationPayload = {
        sessionId: initialState?.sessionId ?? "",
        kineId: therapist.id,
        therapist,
        program: {
          mode: program.mode,
          summary: program.summary,
          exercises: enrichedExercises,
        },
      };

      const response = await fetch(PDF_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erreur webhook PDF: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // TODO: aligner le format avec n8n
      const pdfUrl = data.pdfUrl as string | undefined;
      if (pdfUrl) {
        window.open(pdfUrl, "_blank");
        toast({
          title: "✅ PDF généré",
          description: "Le PDF a été ouvert dans un nouvel onglet",
        });
      } else {
        console.error("pdfUrl manquant dans la réponse n8n", data);
        toast({
          title: "❌ Erreur",
          description: "URL du PDF manquante dans la réponse",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur génération PDF", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!program) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/chatbot/creation-exercices")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la création
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Prévisualisation du programme d'exercices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Résumé */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Résumé du programme</h3>
              <p className="text-muted-foreground">{program.summary}</p>
              <Badge variant="outline" className="mt-2">
                {program.mode === "quick_session" ? "Séance rapide" : "Programme à domicile"}
              </Badge>
            </div>

            {/* Exercices */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Exercices ({program.exercises.length})</h3>
              {program.exercises.map((exercise) => (
                <Card key={exercise.id} className="border-l-4 border-l-primary/30">
                  <CardContent className="pt-6 space-y-3">
                    <div>
                      <h4 className="font-semibold text-base mb-2">{exercise.titre}</h4>
                      <p className="text-sm text-muted-foreground">{exercise.descriptionPatient}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{exercise.region}</Badge>
                      <Badge variant="outline">{exercise.phase}</Badge>
                      <Badge className={getDifficultyColor(exercise.difficulte)}>
                        Difficulté: {exercise.difficulte}/5
                      </Badge>
                      {exercise.materiel && exercise.materiel.length > 0 && (
                        <Badge variant="secondary">Matériel: {exercise.materiel.join(", ")}</Badge>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Commentaires / Modalités d'exécution
                      </label>
                      <Textarea
                        value={commentsByExerciseId[exercise.id] ?? ""}
                        onChange={(e) => handleChangeComment(exercise.id, e.target.value)}
                        placeholder="Nombre de répétitions, séries, fois par jour, jours par semaine, détails supplémentaires..."
                        className="text-sm"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Informations du kiné */}
            {therapist && (
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-lg mb-4">Informations du kinésithérapeute</h3>
                <div className="flex gap-4">
                  {therapist.logoUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={therapist.logoUrl}
                        alt="Logo cabinet"
                        className="w-16 h-16 object-contain rounded"
                      />
                    </div>
                  )}
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">
                      {therapist.firstName} {therapist.lastName}
                    </p>
                    {therapist.rppsNumber && <p className="text-muted-foreground">RPPS: {therapist.rppsNumber}</p>}
                    {therapist.email && <p className="text-muted-foreground">Email: {therapist.email}</p>}
                    {therapist.phone && <p className="text-muted-foreground">Tél: {therapist.phone}</p>}
                    {therapist.clinicAddress && (
                      <p className="text-muted-foreground">Adresse: {therapist.clinicAddress}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bouton de téléchargement */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleDownloadPdf}
                disabled={isSubmitting || !therapist || !program}
                size="lg"
              >
                <Download className="mr-2 h-4 w-4" />
                {isSubmitting ? "Génération en cours..." : "Télécharger le PDF"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
