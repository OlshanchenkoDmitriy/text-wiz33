import { Navigation } from "@/components/Navigation";
import { Editor } from "@/components/Editor";
import { History } from "@/components/History";
import { Notes } from "@/components/Notes";
import { SunoEditor } from "@/components/SunoEditor";
import { Settings } from "@/components/Settings";
import { AppProvider, useAppContext } from "@/hooks/use-app-context";

const AppContent = () => {
  const { activeTab, setActiveTab } = useAppContext();

  const renderContent = () => {
    switch (activeTab) {
      case "editor":
        return <Editor />;
      case "history":
        return <History />;
      case "notes":
        return <Notes />;
      case "suno":
        return <SunoEditor />;
      case "settings":
        return <Settings />;
      default:
        return <Editor />;
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col pb-[calc(60px+env(safe-area-inset-bottom)+env(safe-area-inset-bottom))]">
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full overflow-x-hidden">
        {renderContent()}
      </main>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

const Index = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default Index;
