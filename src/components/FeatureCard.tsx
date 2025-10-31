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
      <Card className="p-6 lg:p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 hover:border-primary/40 transition-all">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4">
            <div className="text-4xl sm:text-5xl">{icon}</div>
            <div className="flex-1 space-y-2 max-w-full">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold break-words">{title}</h2>
              <p className="text-sm sm:text-base text-muted-foreground break-words px-2 sm:px-0">{description}</p>
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

          <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              ⏱️ <span>2 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              📄 <span className="hidden xs:inline">Documents structurés</span><span className="xs:hidden">Structurés</span>
            </div>
            <div className="flex items-center gap-2">
              🤖 <span className="hidden xs:inline">Alimenté par IA</span><span className="xs:hidden">IA</span>
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