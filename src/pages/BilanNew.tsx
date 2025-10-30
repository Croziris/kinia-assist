import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BilanNew() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au dashboard
        </Button>

        <div className="text-center space-y-4 py-12">
          <div className="text-6xl">📋</div>
          <h1 className="text-3xl font-bold">Créer un nouveau bilan</h1>
          <p className="text-muted-foreground">
            Le formulaire de création de bilan sera disponible prochainement.
          </p>
          <p className="text-sm text-muted-foreground">
            Cette fonctionnalité inclura : upload de notes, traitement IA via n8n,
            validation et génération PDF.
          </p>
        </div>
      </main>
    </div>
  );
}