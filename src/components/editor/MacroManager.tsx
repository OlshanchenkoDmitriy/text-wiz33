import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Zap, Play, Plus, Trash2 } from "lucide-react";

interface MacroManagerProps {
  text: string;
  onTextChange: (t: string) => void;
}

type Macro = { pattern: string; replacement: string; alias?: string };

export const MacroManager = ({ text, onTextChange }: MacroManagerProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [alias, setAlias] = useState("");
  const [pattern, setPattern] = useState("");
  const [replacement, setReplacement] = useState("");

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("editor.macros") || "[]");
      setMacros(Array.isArray(data) ? data : []);
    } catch {
      setMacros([]);
    }
  }, [open]);

  const persist = (list: Macro[]) => {
    setMacros(list);
    try { localStorage.setItem("editor.macros", JSON.stringify(list)); } catch {}
  };

  const addMacro = () => {
    if (!pattern) return;
    const next = [...macros, { pattern, replacement, alias }];
    persist(next);
    setAlias(""); setPattern(""); setReplacement("");
    toast({ title: "Сохранено", description: "Макрос добавлен" });
  };

  const deleteMacro = (idx: number) => {
    const next = macros.filter((_, i) => i !== idx);
    persist(next);
  };

  const runMacro = (m: Macro) => {
    try {
      const re = new RegExp(m.pattern, "g");
      onTextChange(text.replace(re, m.replacement));
      toast({ title: "Готово", description: `Применен макрос: ${m.alias || m.pattern}` });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Неверное выражение", variant: "destructive" });
    }
  };

  const hasMacros = useMemo(() => macros.length > 0, [macros.length]);

  return (
    <div className="mt-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" aria-label="Открыть менеджер макросов" title="Макросы">
            <Zap className="w-4 h-4 mr-1" /> Макросы
          </Button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Менеджер макросов</DialogTitle>
            <DialogDescription>
              Создавайте и применяйте регулярные выражения к тексту. Макросы сохраняются локально.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="alias">Название (необязательно)</Label>
              <Input id="alias" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Напр. Удалить цифры" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pattern">Шаблон (RegExp, без слэшей)</Label>
              <Input id="pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="\\d+" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="replacement">Замена</Label>
              <Input id="replacement" value={replacement} onChange={(e) => setReplacement(e.target.value)} placeholder="" />
            </div>
            <div>
              <Button onClick={addMacro} disabled={!pattern} aria-label="Добавить макрос">
                <Plus className="w-4 h-4 mr-1" /> Добавить макрос
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Сохраненные макросы</Label>
              <ScrollArea className="h-60 rounded border">
                <div className="p-2 space-y-2">
                  {hasMacros ? (
                    macros.map((m, i) => (
                      <div key={`${m.alias || m.pattern}-${i}`} className="flex items-start justify-between gap-2 rounded border p-2 bg-card">
                        <div className="text-sm">
                          <div className="font-medium">{m.alias || m.pattern}</div>
                          <div className="text-muted-foreground break-all">/{m.pattern}/g → {m.replacement || ""}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="secondary" size="sm" onClick={() => runMacro(m)} aria-label="Применить макрос">
                            <Play className="w-4 h-4 mr-1" /> Применить
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteMacro(i)} aria-label="Удалить макрос">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">Пока нет макросов. Добавьте первый выше.</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} aria-label="Закрыть">Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

