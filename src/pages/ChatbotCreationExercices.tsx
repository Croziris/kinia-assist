import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { QuickFormExercises } from "@/components/QuickFormExercises";
import { ChatPanelExercises } from "@/components/ChatPanelExercises";
import { ProgramPanelExercises } from "@/components/ProgramPanelExercises";
import { useToast } from "@/hooks/use-toast";
import type { QuickFormValues, ProgramResponse, ChatMessage, ExerciseSuggestion } from "@/types/exercises";

// TODO: Remplacer par un vrai appel au webhook n8n
const mockCallExercisesAssistant = async (payload: any): Promise<ProgramResponse> => {
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 1500));

  const mockExercises: ExerciseSuggestion[] = [
    {
      id: "ex-001",
      titre: "Montées sur pointe de pied",
      descriptionPro: "Renforcement triceps sural en charge, progression possible en unipodal.",
      descriptionPatient: "Debout face à un mur, montez sur la pointe des pieds puis redescendez doucement.",
      region: payload.quickForm?.region || "cheville",
      utilisationClinique: "Renforcement triceps sural et stabilité cheville.",
      positionExecution: "debout",
      phase: payload.quickForm?.phase || "subaigue",
      difficulte: 2,
      contraintesExclues: ["pas_de_saut"],
      materiel: ["mur"],
      gamificationPossible: true,
      consignesSecurite: "Ne pas dépasser 3/10 de douleur, garder l'appui stable.",
      variantesProgression: "Passer en unipodal, ajouter un sac à dos chargé.",
      mediaUrl: null,
      selected: true,
      locked: false
    },
    {
      id: "ex-002",
      titre: "Proprioception sur coussin",
      descriptionPro: "Travail proprioceptif sur surface instable, sollicitation des stabilisateurs.",
      descriptionPatient: "Tenez-vous en équilibre sur un coussin ou une surface molle, les yeux ouverts puis fermés.",
      region: payload.quickForm?.region || "cheville",
      utilisationClinique: "Rééducation proprioceptive post-entorse.",
      positionExecution: "debout",
      phase: payload.quickForm?.phase || "subaigue",
      difficulte: 3,
      contraintesExclues: [],
      materiel: ["coussin", "tapis"],
      gamificationPossible: true,
      consignesSecurite: "Se tenir près d'un support en cas de déséquilibre.",
      variantesProgression: "Yeux fermés, mouvement de bras, lancer de balle.",
      mediaUrl: null,
      selected: true,
      locked: false
    },
    {
      id: "ex-003",
      titre: "Renforcement isométrique",
      descriptionPro: "Contraction isométrique contre résistance élastique.",
      descriptionPatient: "Assis, poussez votre pied contre un élastique dans différentes directions sans bouger la cheville.",
      region: payload.quickForm?.region || "cheville",
      utilisationClinique: "Renforcement sans stress articulaire.",
      positionExecution: "assis",
      phase: payload.quickForm?.phase || "subaigue",
      difficulte: 1,
      contraintesExclues: [],
      materiel: ["élastique"],
      gamificationPossible: false,
      consignesSecurite: "Maintenir 5 secondes, respiration libre.",
      variantesProgression: "Augmenter la résistance de l'élastique.",
      mediaUrl: null,
      selected: true,
      locked: false
    }
  ];

  return {
    mode: payload.quickForm?.mode || 'quick_session',
    summary: `Programme pour ${payload.quickForm?.region || 'région'}, phase ${payload.quickForm?.phase || 'subaiguë'}, niveau ${payload.quickForm?.niveau || 'intermédiaire'}.`,
    exercises: mockExercises
  };
};

export default function ChatbotCreationExercices() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quickFormValues, setQuickFormValues] = useState<QuickFormValues | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentProgram, setCurrentProgram] = useState<ProgramResponse | null>(null);
  const [selectedTab, setSelectedTab] = useState<'chat' | 'programme'>('chat');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickFormSubmit = async (values: QuickFormValues) => {
    setIsLoading(true);
    setQuickFormValues(values);

    // Ajouter message user
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: `Générer un programme ${values.mode === 'quick_session' ? 'pour la séance' : 'à domicile'} : région ${values.region}, phase ${values.phase}, niveau ${values.niveau}.`
    };
    setChatMessages(prev => [...prev, userMessage]);

    try {
      // TODO: Appeler le vrai webhook n8n ici
      const response = await mockCallExercisesAssistant({ quickForm: values });
      setCurrentProgram(response);

      // Ajouter message assistant
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Voici une première proposition de programme avec ${response.exercises.length} exercices adaptés à votre demande.`
      };
      setChatMessages(prev => [...prev, assistantMessage]);

      // Sur mobile, basculer sur l'onglet programme
      setSelectedTab('programme');

      toast({
        title: "✅ Programme généré",
        description: `${response.exercises.length} exercices proposés`
      });
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de générer le programme",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!currentProgram) return;

    setIsLoading(true);

    // Ajouter message user
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message
    };
    setChatMessages(prev => [...prev, userMessage]);

    try {
      // TODO: Appeler le webhook n8n avec le contexte complet
      const response = await mockCallExercisesAssistant({
        quickForm: quickFormValues,
        currentProgram,
        userMessage: message
      });
      setCurrentProgram(response);

      // Ajouter message assistant
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: "J'ai adapté les exercices selon votre demande."
      };
      setChatMessages(prev => [...prev, assistantMessage]);

      // Basculer sur programme
      setSelectedTab('programme');

      toast({
        title: "✅ Programme mis à jour"
      });
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de mettre à jour le programme",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (!currentProgram) return;
    setCurrentProgram({
      ...currentProgram,
      exercises: currentProgram.exercises.map(ex =>
        ex.id === id ? { ...ex, selected: !ex.selected } : ex
      )
    });
  };

  const handleToggleLock = (id: string) => {
    if (!currentProgram) return;
    setCurrentProgram({
      ...currentProgram,
      exercises: currentProgram.exercises.map(ex =>
        ex.id === id ? { ...ex, locked: !ex.locked } : ex
      )
    });
  };

  const handleRequestAdaptation = async (id: string, type: 'easier' | 'harder' | 'fun') => {
    const exercise = currentProgram?.exercises.find(ex => ex.id === id);
    if (!exercise) return;

    const messageMap = {
      easier: `Rends l'exercice "${exercise.titre}" plus facile`,
      harder: `Rends l'exercice "${exercise.titre}" plus difficile`,
      fun: `Rends l'exercice "${exercise.titre}" plus ludique`
    };

    await handleSendMessage(messageMap[type]);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au dashboard
        </Button>

        {/* Desktop: Layout 2 colonnes */}
        <div className="hidden lg:flex gap-6 h-[calc(100vh-12rem)]">
          {/* Colonne gauche */}
          <div className="w-2/5 space-y-6 overflow-y-auto">
            <QuickFormExercises onSubmit={handleQuickFormSubmit} isLoading={isLoading} />
            <div className="h-[500px]">
              <ChatPanelExercises
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                disabled={!currentProgram || isLoading}
              />
            </div>
          </div>

          {/* Colonne droite */}
          <div className="w-3/5 h-full">
            <ProgramPanelExercises
              program={currentProgram}
              onToggleSelect={handleToggleSelect}
              onToggleLock={handleToggleLock}
              onRequestAdaptation={handleRequestAdaptation}
            />
          </div>
        </div>

        {/* Mobile: Tabs ou Form */}
        <div className="lg:hidden">
          {!currentProgram ? (
            <QuickFormExercises onSubmit={handleQuickFormSubmit} isLoading={isLoading} />
          ) : (
            <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'chat' | 'programme')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="chat">💬 Chat</TabsTrigger>
                <TabsTrigger value="programme">📋 Programme</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="h-[calc(100vh-16rem)]">
                <ChatPanelExercises
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  disabled={isLoading}
                />
              </TabsContent>

              <TabsContent value="programme" className="h-[calc(100vh-16rem)]">
                <ProgramPanelExercises
                  program={currentProgram}
                  onToggleSelect={handleToggleSelect}
                  onToggleLock={handleToggleLock}
                  onRequestAdaptation={handleRequestAdaptation}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}
