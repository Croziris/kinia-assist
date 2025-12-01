import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles } from "lucide-react";
import { QuickFormValues } from "@/types/exercises";

interface QuickFormExercisesProps {
  onSubmit: (values: QuickFormValues) => void;
  isLoading: boolean;
}

const OBJECTIFS = [
  "Renforcement",
  "Mobilité",
  "Proprioception",
  "Équilibre",
  "Endurance",
  "Contrôle moteur"
];

const CONTRAINTES = [
  "Pas de saut",
  "Pas à genoux",
  "Pas en décubitus ventral",
  "Pas de course",
  "Éviter charge lourde"
];

const MATERIEL = [
  "Tapis",
  "Step",
  "Mur",
  "Élastique",
  "Ballon",
  "Aucun",
  "Autre"
];

export const QuickFormExercises = ({ onSubmit, isLoading }: QuickFormExercisesProps) => {
  const [formValues, setFormValues] = useState<QuickFormValues>({
    mode: 'quick_session',
    region: '',
    pathologie: '',
    phase: '',
    irritabilite: '',
    niveau: '',
    objectifs: [],
    contraintes: [],
    materiel: [],
    commentaires: '',
    requestedExercisesCount: 3
  });
  const [autreMateriel, setAutreMateriel] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si "Autre" est sélectionné et qu'il y a du texte, l'ajouter au matériel
    const finalMateriel = formValues.materiel.includes('Autre') && autreMateriel.trim()
      ? [...formValues.materiel.filter(m => m !== 'Autre'), autreMateriel.trim()]
      : formValues.materiel;
    
    onSubmit({
      ...formValues,
      materiel: finalMateriel
    });
  };

  const toggleArrayValue = (array: string[], value: string) => {
    return array.includes(value)
      ? array.filter(v => v !== value)
      : [...array, value];
  };

  const isValid = formValues.region && formValues.phase && formValues.niveau;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Décrire le cas clinique
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Mode d'utilisation */}
          <div className="space-y-2">
            <Label htmlFor="mode">Mode d'utilisation</Label>
            <Select
              value={formValues.mode}
              onValueChange={(value: 'quick_session' | 'home_program') => 
                setFormValues({ ...formValues, mode: value })
              }
            >
              <SelectTrigger id="mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick_session">Pendant la séance</SelectItem>
                <SelectItem value="home_program">Programme à domicile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Région */}
          <div className="space-y-2">
            <Label htmlFor="region">Région *</Label>
            <Select
              value={formValues.region}
              onValueChange={(value) => setFormValues({ ...formValues, region: value })}
            >
              <SelectTrigger id="region">
                <SelectValue placeholder="Sélectionnez une région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cheville">Cheville</SelectItem>
                <SelectItem value="genou">Genou</SelectItem>
                <SelectItem value="lombaire">Lombaire</SelectItem>
                <SelectItem value="epaule">Épaule</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pathologie */}
          <div className="space-y-2">
            <Label htmlFor="pathologie">Pathologie</Label>
            <Input
              id="pathologie"
              placeholder="Ex: Entorse cheville droite"
              value={formValues.pathologie}
              onChange={(e) => setFormValues({ ...formValues, pathologie: e.target.value })}
            />
          </div>

          {/* Phase */}
          <div className="space-y-2">
            <Label htmlFor="phase">Phase *</Label>
            <Select
              value={formValues.phase}
              onValueChange={(value) => setFormValues({ ...formValues, phase: value })}
            >
              <SelectTrigger id="phase">
                <SelectValue placeholder="Sélectionnez une phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aigue">Aiguë</SelectItem>
                <SelectItem value="subaigue">Subaiguë</SelectItem>
                <SelectItem value="reathletisation">Réathlétisation</SelectItem>
                <SelectItem value="entretien">Chronique / Entretien</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Irritabilité */}
          <div className="space-y-2">
            <Label htmlFor="irritabilite">Irritabilité</Label>
            <Select
              value={formValues.irritabilite}
              onValueChange={(value) => setFormValues({ ...formValues, irritabilite: value })}
            >
              <SelectTrigger id="irritabilite">
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="faible">Faible</SelectItem>
                <SelectItem value="moderee">Modérée</SelectItem>
                <SelectItem value="forte">Forte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Niveau global */}
          <div className="space-y-2">
            <Label htmlFor="niveau">Niveau global *</Label>
            <Select
              value={formValues.niveau}
              onValueChange={(value) => setFormValues({ ...formValues, niveau: value })}
            >
              <SelectTrigger id="niveau">
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debutant">Débutant</SelectItem>
                <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                <SelectItem value="avance">Avancé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nombre d'exercices */}
          <div className="space-y-2">
            <Label htmlFor="requestedExercisesCount">Nombre d'exercices *</Label>
            <Select
              value={formValues.requestedExercisesCount.toString()}
              onValueChange={(value) => setFormValues({ ...formValues, requestedExercisesCount: parseInt(value) })}
            >
              <SelectTrigger id="requestedExercisesCount">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 exercice</SelectItem>
                <SelectItem value="2">2 exercices</SelectItem>
                <SelectItem value="3">3 exercices</SelectItem>
                <SelectItem value="4">4 exercices</SelectItem>
                <SelectItem value="5">5 exercices</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Objectifs */}
          <div className="space-y-2">
            <Label>Objectifs</Label>
            <div className="space-y-2">
              {OBJECTIFS.map((objectif) => (
                <div key={objectif} className="flex items-center space-x-2">
                  <Checkbox
                    id={`objectif-${objectif}`}
                    checked={formValues.objectifs.includes(objectif)}
                    onCheckedChange={() =>
                      setFormValues({
                        ...formValues,
                        objectifs: toggleArrayValue(formValues.objectifs, objectif)
                      })
                    }
                  />
                  <Label htmlFor={`objectif-${objectif}`} className="font-normal cursor-pointer">
                    {objectif}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Contraintes */}
          <div className="space-y-2">
            <Label>Contraintes</Label>
            <div className="space-y-2">
              {CONTRAINTES.map((contrainte) => (
                <div key={contrainte} className="flex items-center space-x-2">
                  <Checkbox
                    id={`contrainte-${contrainte}`}
                    checked={formValues.contraintes.includes(contrainte)}
                    onCheckedChange={() =>
                      setFormValues({
                        ...formValues,
                        contraintes: toggleArrayValue(formValues.contraintes, contrainte)
                      })
                    }
                  />
                  <Label htmlFor={`contrainte-${contrainte}`} className="font-normal cursor-pointer">
                    {contrainte}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Matériel */}
          <div className="space-y-2">
            <Label>Matériel disponible</Label>
            <div className="space-y-2">
              {MATERIEL.map((mat) => (
                <div key={mat} className="flex items-center space-x-2">
                  <Checkbox
                    id={`materiel-${mat}`}
                    checked={formValues.materiel.includes(mat)}
                    onCheckedChange={() => {
                      setFormValues({
                        ...formValues,
                        materiel: toggleArrayValue(formValues.materiel, mat)
                      });
                      // Si on décoche "Autre", vider le champ texte
                      if (mat === 'Autre' && formValues.materiel.includes('Autre')) {
                        setAutreMateriel('');
                      }
                    }}
                  />
                  <Label htmlFor={`materiel-${mat}`} className="font-normal cursor-pointer">
                    {mat}
                  </Label>
                </div>
              ))}
              
              {/* Champ texte libre si "Autre" est coché */}
              {formValues.materiel.includes('Autre') && (
                <div className="ml-6 mt-2">
                  <Input
                    placeholder="Précisez le matériel..."
                    value={autreMateriel}
                    onChange={(e) => setAutreMateriel(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Commentaires */}
          <div className="space-y-2">
            <Label htmlFor="commentaires">Commentaires libres</Label>
            <Textarea
              id="commentaires"
              placeholder="Précisions supplémentaires..."
              value={formValues.commentaires}
              onChange={(e) => setFormValues({ ...formValues, commentaires: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={!isValid || isLoading} className="w-full" size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Générer des exercices
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
