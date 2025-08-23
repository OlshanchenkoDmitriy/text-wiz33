import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";
import { useCallback } from "react";

interface MacroManagerProps {
  text: string;
  onTextChange: (t: string) => void;
}

type Macro = { pattern: string; replacement: string; alias?: string };

export const MacroManager = ({ text, onTextChange }: MacroManagerProps) => {
  const { toast } = useToast();

  const loadMacros = (): Macro[] => {
    try { return JSON.parse(localStorage.getItem('editor.macros') || '[]'); } catch { return []; }
  };
  const saveMacros = (list: Macro[]) => { try { localStorage.setItem('editor.macros', JSON.stringify(list)); } catch {} };

  const runMacroManager = useCallback(() => {
    const choice = prompt('RegExp Macros: (1) Run (2) Add');
    if (!choice) return;
    const macros = loadMacros();
    if (choice === '1') {
      const aliases = macros.map((m, i) => `${i + 1}. ${m.alias || m.pattern}`).join('\n');
      const pick = prompt(`Выберите макрос:\n${aliases}`);
      const idx = pick ? parseInt(pick, 10) - 1 : -1;
      const m = macros[idx];
      if (m) {
        try { const re = new RegExp(m.pattern, 'g'); onTextChange(text.replace(re, m.replacement)); }
        catch (e: any) { toast({ title: 'Macro error', description: e?.message || 'Bad pattern', variant: 'destructive' }); }
      }
    } else if (choice === '2') {
      const pattern = prompt('Pattern (RegExp, no slashes):'); if (!pattern) return;
      const replacement = prompt('Replacement:') ?? '';
      const alias = prompt('Alias:') ?? '';
      const next = [...macros, { pattern, replacement, alias }];
      saveMacros(next);
      toast({ title: 'Сохранено', description: 'Макрос добавлен' });
    }
  }, [text]);

  return (
    <div className="mt-4">
      <Button variant="outline" size="sm" onClick={runMacroManager}>
        <Zap className="w-4 h-4 mr-1" /> Макросы
      </Button>
    </div>
  );
};

