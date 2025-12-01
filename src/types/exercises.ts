export type ExerciseSuggestion = {
  id: string;
  titre: string;
  descriptionPro: string;
  descriptionPatient: string;
  region: string;
  utilisationClinique: string;
  positionExecution: string;
  phase: string;
  difficulte: number;
  contraintesExclues: string[];
  materiel: string[];
  gamificationPossible: boolean;
  consignesSecurite: string;
  variantesProgression: string;
  mediaUrl?: string | null;
  selected: boolean;
  locked: boolean;
};

export type ProgramResponse = {
  mode: 'quick_session' | 'home_program';
  summary: string;
  exercises: ExerciseSuggestion[];
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type QuickFormValues = {
  mode: 'quick_session' | 'home_program';
  region: string;
  pathologie: string;
  phase: string;
  irritabilite: string;
  niveau: string;
  objectifs: string[];
  contraintes: string[];
  materiel: string[];
  commentaires: string;
  requestedExercisesCount: number;
};
