import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

interface ChatbotCardProps {
  chatbot: {
    slug: string;
    titre: string;
    description: string;
    emoji: string;
    requires_premium: boolean;
    is_active: boolean;
  };
  isPremium: boolean;
  onOpen: (slug: string) => void;
  onUpgrade: () => void;
}

export function ChatbotCard({ chatbot, isPremium, onOpen, onUpgrade }: ChatbotCardProps) {
  const isLocked = chatbot.requires_premium && !isPremium;
  const isDisabled = !chatbot.is_active || isLocked;

  const handleClick = () => {
    if (isLocked) {
      onUpgrade();
    } else if (!isDisabled) {
      onOpen(chatbot.slug);
    }
  };

  return (
    <Card 
      className={`p-6 flex flex-col gap-4 transition-all hover:shadow-md ${
        isDisabled ? "opacity-60" : "cursor-pointer hover:border-primary"
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="text-4xl">{chatbot.emoji}</div>
        {chatbot.requires_premium && (
          <Badge variant="secondary" className="gap-1">
            {isLocked && <Lock className="h-3 w-3" />}
            💎 Premium
          </Badge>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <h3 className="font-semibold text-lg">{chatbot.titre}</h3>
        <p className="text-sm text-muted-foreground">{chatbot.description}</p>
      </div>

      <Button 
        variant={isLocked ? "outline" : "default"}
        className="w-full"
        disabled={!chatbot.is_active && !isLocked}
      >
        {isLocked ? "🔒 Débloquer" : chatbot.is_active ? "Ouvrir" : "Bientôt"}
      </Button>
    </Card>
  );
}