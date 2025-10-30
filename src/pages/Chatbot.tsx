import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Chatbot() {
  const { slug } = useParams();
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

        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 py-12">
            <div className="text-6xl">🤖</div>
            <h1 className="text-3xl font-bold">Assistant {slug}</h1>
            <p className="text-muted-foreground">
              Cette fonctionnalité sera disponible prochainement.
            </p>
            <p className="text-sm text-muted-foreground">
              L'interface chatbot sera implémentée dans la prochaine étape avec
              connexion au webhook n8n et streaming des réponses.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}