import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chatbot from "./pages/Chatbot";
import Patients from "./pages/Patients";
import Historique from "./pages/Historique";
import Parametres from "./pages/Parametres";
import BilanNew from "./pages/BilanNew";
import BilanValidate from "./pages/BilanValidate";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
