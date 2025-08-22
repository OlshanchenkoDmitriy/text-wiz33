import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileEdit, History, StickyNote, Music, Settings } from "lucide-react";

const navItems = [
  { id: "editor", label: "Editor", icon: FileEdit },
  { id: "history", label: "History", icon: History },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "suno", label: "Suno", icon: Music },
  { id: "settings", label: "Settings", icon: Settings },
];

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const handleTabClick = (tab: string) => {
    const el = document.activeElement as HTMLElement | null;
    if (el && typeof el.blur === 'function') el.blur();
    onTabChange(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 supports-[backdrop-filter]:bg-card/80 backdrop-blur-sm min-h-[60px] pb-[env(safe-area-inset-bottom)]">
      <div className="h-full max-w-7xl mx-auto px-2 md:px-3">
        <div className="h-full grid grid-cols-5 gap-0.5 md:gap-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="mobile"
                onClick={() => handleTabClick(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[10px] leading-tight sm:text-xs rounded-lg min-h-[48px]",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "hover:bg-secondary/80 text-muted-foreground active:bg-secondary"
                )}
              >
                <Icon className="w-5 h-5 md:w-4 md:h-4" />
                <span className="truncate max-w-full max-[360px]:hidden">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
