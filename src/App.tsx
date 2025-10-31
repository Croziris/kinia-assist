import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chatbot from "./pages/Chatbot";
import Patients from "./pages/Patients";
import Historique from "./pages/Historique";
import Parametres from "./pages/Parametres";
import BilanNew from "./pages/BilanNew";
import BilanValidate from "./pages/BilanValidate";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import { BottomNav } from "@/components/BottomNav";

const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, [location.pathname]);

  const checkOnboarding = async () => {
    // Skip onboarding check for login page
    if (location.pathname === "/" || location.pathname === "/login") {
      setCheckingAuth(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCheckingAuth(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed, nom, prenom")
        .eq("id", user.id)
        .single();

      // Si pas de nom/prénom ou onboarding non complété
      if (data && (!data.nom || !data.prenom || !data.onboarding_completed)) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    } finally {
      setCheckingAuth(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-pulse">🩺</div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding && location.pathname !== "/login" && location.pathname !== "/") {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chatbot/:slug" element={<Chatbot />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/historique" element={<Historique />} />
        <Route path="/parametres" element={<Parametres />} />
        <Route path="/bilan/new" element={<BilanNew />} />
        <Route path="/bilan/validate/:id" element={<BilanValidate />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
