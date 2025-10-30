import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

const premiumFeatures = [
  "✨ Bilans illimités",
  "💬 Messages chatbot illimités",
  "📖 Accès complet à la nomenclature NGAP",
  "💪 Création d'exercices personnalisés",
  "📱 Générateur de posts réseaux sociaux",
  "💼 Devis actes hors nomenclature",
  "🎯 Support prioritaire",
  "🔄 Futures fonctionnalités en avant-première",
];

export function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            💎 Passez Premium
          </DialogTitle>
          {reason && (
            <DialogDescription className="text-base pt-2">
              {reason}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold">29€</div>
              <div className="text-sm text-muted-foreground">par mois</div>
            </div>
          </div>

          <div className="space-y-2">
            <Button className="w-full" size="lg">
              S'abonner maintenant
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              Peut-être plus tard
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Sans engagement • Annulation à tout moment
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}