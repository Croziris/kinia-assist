import { Link, useLocation } from "react-router-dom";
import { Home, Users, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: "/dashboard", icon: Home, label: "Accueil" },
    { path: "/patients", icon: Users, label: "Patients" },
    { path: "/historique", icon: Clock, label: "Historique" },
    { path: "/parametres", icon: User, label: "Profil" }
  ];
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Effet verre dépoli */}
      <div className="backdrop-blur-lg bg-white/80 border-t border-gray-200 dark:bg-gray-900/80 dark:border-gray-800">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center px-3 py-2 rounded-lg transition-all",
                  isActive 
                    ? "text-[#8B9D83] bg-[#8B9D83]/10" 
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
