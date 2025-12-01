import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { QuickFormExercises } from "@/components/QuickFormExercises";
import { ChatPanelExercises } from "@/components/ChatPanelExercises";
import { ProgramPanelExercises } from "@/components/ProgramPanelExercises";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { QuickFormValues, ProgramResponse, ChatMessage } from "@/types/exercises";

const WEBHOOK_URL = "https://n8n.crozier-pierre.fr/webhook/assistant-exercices";

type CallAssistantPayload = {
  sessionId: string;
  kineId: string;
  mode: string;
  requestedExercisesCount: number;
  quickForm: QuickFormValues | null;
  chatHistory: ChatMessage[];
  currentProgram: ProgramResponse | null;
  lockedExerciseIds: string[];
  selectedExerciseIds: string[];
  action: "generate" | "adapt";
  adaptation?: {
    exerciseId?: string;
    type?: "easier" | "harder" | "fun";
    message?: string;
  };
};

const callExercisesAssistant = async (payload: CallAssistantPayload): Promise<ProgramResponse> => {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

export default function ChatbotCreationExercices() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quickFormValues, setQuickFormValues] = useState<QuickFormValues | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentProgram, setCurrentProgram] = useState<ProgramResponse | null>(null);
  const [selectedTab, setSelectedTab] = useState<"chat" | "programme">("chat");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [kineId, setKineId] = useState<string>("");

  useEffect(() => {
    const getKineId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setKineId(user.id);
      }
    };
    getKineId();
  }, []);

  const handleQuickFormSubmit = async (values: QuickFormValues) => {
    setIsLoading(true);
    setQuickFormValues(values);

    // Ajouter message user
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: `Générer un programme ${values.mode === "quick_session" ? "pour la séance" : "à domicile"} : région ${values.region}, phase ${values.phase}, niveau ${values.niveau}.`,
    };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const lockedExerciseIds = currentProgram?.exercises.filter((ex) => ex.locked).map((ex) => ex.id) || [];
      const selectedExerciseIds = currentProgram?.exercises.filter((ex) => ex.selected).map((ex) => ex.id) || [];

      const response = await callExercisesAssistant({
        sessionId,
        kineId,
        mode: values.mode,
        requestedExercisesCount: values.requestedExercisesCount,
        quickForm: values,
        chatHistory: chatMessages,
        currentProgram,
        lockedExerciseIds,
        selectedExerciseIds,
        action: "generate",
      });
      console.log("Response from webhook:", response);
      setCurrentProgram(response);

      // Ajouter message assistant
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: `Voici une première proposition de programme avec ${response.exercises.length} exercices adaptés à votre demande.`,
      };
      setChatMessages((prev) => [...prev, assistantMessage]);

      // Sur mobile, basculer sur l'onglet programme
      setSelectedTab("programme");

      toast({
        title: "✅ Programme généré",
        description: `${response.exercises.length} exercices proposés`,
      });
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de générer le programme",
        variant: "destructive",
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
      role: "user",
      content: message,
    };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const lockedExerciseIds = currentProgram?.exercises.filter((ex) => ex.locked).map((ex) => ex.id) || [];
      const selectedExerciseIds = currentProgram?.exercises.filter((ex) => ex.selected).map((ex) => ex.id) || [];

      const response = await callExercisesAssistant({
        sessionId,
        kineId,
        mode: quickFormValues?.mode || "quick_session",
        requestedExercisesCount: quickFormValues?.requestedExercisesCount || 3,
        quickForm: quickFormValues,
        chatHistory: [...chatMessages, userMessage],
        currentProgram,
        lockedExerciseIds,
        selectedExerciseIds,
        action: "adapt",
        adaptation: {
          message,
        },
      });
      setCurrentProgram(response);

      // Ajouter message assistant
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "J'ai adapté les exercices selon votre demande.",
      };
      setChatMessages((prev) => [...prev, assistantMessage]);

      // Basculer sur programme
      setSelectedTab("programme");

      toast({
        title: "✅ Programme mis à jour",
      });
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de mettre à jour le programme",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (!currentProgram) return;
    setCurrentProgram({
      ...currentProgram,
      exercises: currentProgram.exercises.map((ex) => (ex.id === id ? { ...ex, selected: !ex.selected } : ex)),
    });
  };

  const handleToggleLock = (id: string) => {
    if (!currentProgram) return;
    setCurrentProgram({
      ...currentProgram,
      exercises: currentProgram.exercises.map((ex) => (ex.id === id ? { ...ex, locked: !ex.locked } : ex)),
    });
  };

  const handleRequestAdaptation = async (id: string, type: "easier" | "harder" | "fun") => {
    const exercise = currentProgram?.exercises.find((ex) => ex.id === id);
    if (!exercise || !quickFormValues) return;

    setIsLoading(true);

    const messageMap = {
      easier: `Rends l'exercice "${exercise.titre}" plus facile`,
      harder: `Rends l'exercice "${exercise.titre}" plus difficile`,
      fun: `Rends l'exercice "${exercise.titre}" plus ludique`,
    };

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: messageMap[type],
    };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const lockedExerciseIds = currentProgram?.exercises.filter((ex) => ex.locked).map((ex) => ex.id) || [];
      const selectedExerciseIds = currentProgram?.exercises.filter((ex) => ex.selected).map((ex) => ex.id) || [];

      const response = await callExercisesAssistant({
        sessionId,
        kineId,
        mode: quickFormValues.mode,
        requestedExercisesCount: quickFormValues.requestedExercisesCount,
        quickForm: quickFormValues,
        chatHistory: [...chatMessages, userMessage],
        currentProgram,
        lockedExerciseIds,
        selectedExerciseIds,
        action: "adapt",
        adaptation: {
          exerciseId: id,
          type,
          message: messageMap[type],
        },
      });
      setCurrentProgram(response);

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "J'ai adapté l'exercice selon votre demande.",
      };
      setChatMessages((prev) => [...prev, assistantMessage]);

      setSelectedTab("programme");

      toast({
        title: "✅ Exercice adapté",
      });
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible d'adapter l'exercice",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
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
            <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "chat" | "programme")}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="chat">💬 Chat</TabsTrigger>
                <TabsTrigger value="programme">📋 Programme</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="h-[calc(100vh-16rem)]">
                <ChatPanelExercises messages={chatMessages} onSendMessage={handleSendMessage} disabled={isLoading} />
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
