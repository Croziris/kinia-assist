import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";

export default function Patients() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4 py-12">
          <div className="text-6xl">👥</div>
          <h1 className="text-3xl font-bold">Gestion des Patients</h1>
          <p className="text-muted-foreground">
            Cette section sera développée prochainement.
          </p>
        </div>
      </main>
    </div>
  );
}