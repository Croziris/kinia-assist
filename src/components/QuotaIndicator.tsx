import { Progress } from "@/components/ui/progress";

interface QuotaIndicatorProps {
  current: number;
  max: number;
  type: "bilans" | "messages";
}

export function QuotaIndicator({ current, max, type }: QuotaIndicatorProps) {
  const percentage = (current / max) * 100;
  const remaining = max - current;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {type === "bilans" ? "Bilans gratuits" : "Messages gratuits"}
        </span>
        <span className="font-medium">
          {remaining} / {max} restants
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      {remaining === 0 && (
        <p className="text-xs text-destructive">
          Quota épuisé - Passez Premium pour continuer
        </p>
      )}
    </div>
  );
}