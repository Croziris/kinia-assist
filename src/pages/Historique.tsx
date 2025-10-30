import { Header } from "@/components/Header";

export default function Historique() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4 py-12">
          <div className="text-6xl">📚</div>
          <h1 className="text-3xl font-bold">Historique des Bilans</h1>
          <p className="text-muted-foreground">
            Vos bilans précédents apparaîtront ici.
          </p>
        </div>
      </main>
    </div>
  );
}