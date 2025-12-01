import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lock, Unlock, TrendingDown, TrendingUp, Gamepad2 } from "lucide-react";
import { ProgramResponse } from "@/types/exercises";

interface ProgramPanelExercisesProps {
  program: ProgramResponse | null;
  onToggleSelect: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRequestAdaptation: (id: string, type: 'easier' | 'harder' | 'fun') => void;
  isLoading: boolean;
}

const getDifficultyColor = (difficulte: number) => {
  if (difficulte <= 2) return "bg-green-500/10 text-green-700";
  if (difficulte <= 3) return "bg-yellow-500/10 text-yellow-700";
  return "bg-red-500/10 text-red-700";
};

export const ProgramPanelExercises = ({
  program,
  onToggleSelect,
  onToggleLock,
  onRequestAdaptation,
  isLoading
}: ProgramPanelExercisesProps) => {
  if (!program || !program.exercises || program.exercises.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>📋 Programme courant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <p>Aucun programme généré pour le moment.</p>
            <p className="text-sm mt-2">Remplissez le formulaire pour commencer.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>📋 Programme courant</CardTitle>
        {program.summary && (
          <p className="text-sm text-muted-foreground mt-2">{program.summary}</p>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {program.exercises.map((exercise) => (
              <Card key={exercise.id} className={exercise.locked ? "border-primary" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`select-${exercise.id}`}
                      checked={exercise.selected}
                      onCheckedChange={() => onToggleSelect(exercise.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <label
                        htmlFor={`select-${exercise.id}`}
                        className="text-base font-semibold cursor-pointer leading-tight block"
                      >
                        {exercise.titre}
                      </label>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {exercise.region}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {exercise.phase}
                        </Badge>
                        <Badge className={`text-xs ${getDifficultyColor(exercise.difficulte)}`}>
                          Niveau {exercise.difficulte}/5
                        </Badge>
                        {exercise.materiel.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {exercise.materiel.join(", ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Boutons d'action */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={exercise.locked ? "default" : "outline"}
                      onClick={() => onToggleLock(exercise.id)}
                      disabled={isLoading}
                    >
                      {exercise.locked ? (
                        <>
                          <Lock className="h-3 w-3 mr-1" />
                          Verrouillé
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3 w-3 mr-1" />
                          Déverrouiller
                        </>
                      )}
                    </Button>
                    {!exercise.locked && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRequestAdaptation(exercise.id, 'easier')}
                          disabled={isLoading}
                        >
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Plus facile
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRequestAdaptation(exercise.id, 'harder')}
                          disabled={isLoading}
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Plus difficile
                        </Button>
                        {exercise.gamificationPossible && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRequestAdaptation(exercise.id, 'fun')}
                            disabled={isLoading}
                          >
                            <Gamepad2 className="h-3 w-3 mr-1" />
                            Plus ludique
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Accordéon détails */}
                  <Accordion type="single" collapsible>
                    <AccordionItem value="details">
                      <AccordionTrigger className="text-sm">Voir les détails</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="font-semibold text-muted-foreground">
                              Description patient :
                            </p>
                            <p>{exercise.descriptionPatient}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground">
                              Description pro :
                            </p>
                            <p>{exercise.descriptionPro}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground">
                              Consignes de sécurité :
                            </p>
                            <p>{exercise.consignesSecurite}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground">
                              Variantes / Progression :
                            </p>
                            <p>{exercise.variantesProgression}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
