import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  variant?: "default" | "hero";
}

export function FeatureCard({ title, description, icon, onClick, variant = "default" }: FeatureCardProps) {
  if (variant === "hero") {
    return (
      <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 hover:border-primary/40 transition-all">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{icon}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2">{title}</h2>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </div>
          
          <Button 
            size="lg" 
            className="w-full sm:w-auto group"
            onClick={onClick}
          >
            Créer un nouveau bilan
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              ⏱️ <span>2 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              📄 <span>Documents structurés</span>
            </div>
            <div className="flex items-center gap-2">
              🤖 <span>Alimenté par IA</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="p-6 hover:shadow-md transition-all cursor-pointer hover:border-primary"
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className="text-4xl">{icon}</div>
        <div>
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
}