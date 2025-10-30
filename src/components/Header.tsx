import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    } else {
      navigate("/login");
    }
  };

  const getInitials = () => {
    if (profile?.nom && profile?.prenom) {
      return `${profile.prenom[0]}${profile.nom[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const isPremium = profile?.plan === "premium";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="text-2xl">🩺</div>
          <span className="font-semibold text-lg">Kiné Assistant</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link to="/patients" className="text-sm font-medium hover:text-primary transition-colors">
            Mes Patients
          </Link>
          <Link to="/historique" className="text-sm font-medium hover:text-primary transition-colors">
            Historique
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {isPremium ? (
            <Badge variant="secondary" className="gap-1 hidden sm:flex">
              💎 Premium
            </Badge>
          ) : (
            <Badge variant="outline" className="hidden sm:flex">
              Free
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm">
                  {profile?.prenom && profile?.nom
                    ? `${profile.prenom} ${profile.nom}`
                    : user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm">
                <div className="font-medium">Mon compte</div>
                {user?.email && (
                  <div className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/parametres")}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}