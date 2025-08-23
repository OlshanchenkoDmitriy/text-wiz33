import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Replace } from "lucide-react";

interface FormattingPanelProps {
  text: string;
  onTextChange: (t: string) => void;
}

export const FormattingPanel = ({ text, onTextChange }: FormattingPanelProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [useRegex, setUseRegex] = useState(false);

  const findAndReplace = () => {
    if (!searchTerm) return;
    try {
      if (useRegex) {
        const re = new RegExp(searchTerm, "g");
        onTextChange(text.replace(re, replaceTerm));
      } else {
        onTextChange(text.split(searchTerm).join(replaceTerm));
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Неверное выражение", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-2 mt-4">
      <div className="flex gap-2 items-end">
        <div>
          <Label htmlFor="searchTerm">Найти</Label>
          <Input id="searchTerm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="replaceTerm">Заменить на</Label>
          <Input id="replaceTerm" value={replaceTerm} onChange={(e) => setReplaceTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="regex" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} />
          <Label htmlFor="regex">RegExp</Label>
        </div>
        <Button variant="outline" size="sm" onClick={findAndReplace}>
          <Replace className="w-4 h-4 mr-1" /> Заменить
        </Button>
      </div>
    </div>
  );
};

