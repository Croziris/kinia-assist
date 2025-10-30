import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { FeatureCard } from "@/components/FeatureCard";
import { ChatbotCard } from "@/components/ChatbotCard";
import { UpgradeModal } from "@/components/UpgradeModal";
import { QuotaIndicator } from "@/components/QuotaIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  plan: "free" | "premium";
  credits_free: number;
}

interface Chatbot {
  id: string;
  slug: string;
  titre: string;
  description: string;
  emoji: string;
  requires_premium: boolean;
  is_active: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    setUserEmail(session.user.email || "");
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("plan, credits_free")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load chatbots
      const { data: chatbotsData } = await supabase
        .from("chatbots")
        .select("*")
        .order("created_at");

      if (chatbotsData) {
        setChatbots(chatbotsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBilan = () => {
    if (profile?.plan === "free" && profile.credits_free <= 0) {
      setUpgradeReason("Vous avez épuisé vos 2 bilans gratuits. Passez Premium pour créer des bilans illimités.");
      setShowUpgradeModal(true);
      return;
    }
    navigate("/bilan/new");
  };

  const handleOpenChatbot = (slug: string) => {
    navigate(`/chatbot/${slug}`);
  };

  const handleUpgrade = () => {
    setUpgradeReason("Débloquez tous les assistants et fonctionnalités en passant Premium.");
    setShowUpgradeModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-pulse">🩺</div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const isPremium = profile?.plan === "premium";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section - Générateur de bilans */}
        <section className="space-y-6">
          <FeatureCard
            title="Générateur de Bilans Kinésithérapeutiques"
            description="Créez des bilans professionnels en 2 minutes. Transformez vos notes en documents structurés grâce à l'IA."
            icon="📋"
            onClick={handleCreateBilan}
            variant="hero"
          />

          {profile?.plan === "free" && (
            <QuotaIndicator
              current={2 - profile.credits_free}
              max={2}
              type="bilans"
            />
          )}
        </section>

        {/* Assistants Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Assistants Spécialisés</h2>
            <p className="text-muted-foreground">
              Des outils IA pour vous accompagner au quotidien
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatbots.map((chatbot) => (
              <ChatbotCard
                key={chatbot.id}
                chatbot={chatbot}
                isPremium={isPremium}
                onOpen={handleOpenChatbot}
                onUpgrade={handleUpgrade}
              />
            ))}
          </div>
        </section>

        {/* CTA Premium (if free user) */}
        {!isPremium && (
          <section className="bg-gradient-to-r from-secondary/20 to-accent/20 rounded-lg p-8 text-center space-y-4">
            <div className="text-4xl">💎</div>
            <h3 className="text-2xl font-semibold">Passez Premium</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Débloquez tous les assistants, créez des bilans illimités et accédez à toutes les fonctionnalités premium.
            </p>
            <button
              onClick={handleUpgrade}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/90 h-10 px-8"
            >
              Découvrir Premium
            </button>
          </section>
        )}
      </main>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
      />
    </div>
  );
}