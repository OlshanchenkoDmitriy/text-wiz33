import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { List, ArrowRightLeft, Trash2, Hash } from "lucide-react";

interface ListToolsProps {
  text: string;
  onTextChange: (t: string) => void;
}

export const ListTools = ({ text, onTextChange }: ListToolsProps) => {
  const [separator, setSeparator] = useState(",");

  const inlineToList = () => {
    const parts = text.split(separator).map((p) => p.trim()).filter((p) => p.length > 0);
    onTextChange(parts.join("\n"));
  };

  const listToInline = () => {
    const parts = text.split("\n").map((p) => p.trim()).filter((p) => p.length > 0);
    onTextChange(parts.join(`${separator} `));
  };

  const removeDuplicateLines = () => {
    const lines = text.split("\n");
    const unique = Array.from(new Set(lines));
    onTextChange(unique.join("\n"));
  };

  const removeEmptyLines = () => {
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    onTextChange(lines.join("\n"));
  };

  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-end gap-2">
        <div>
          <Label htmlFor="separator">Разделитель</Label>
          <Input id="separator" value={separator} onChange={(e) => setSeparator(e.target.value)} className="w-20" />
        </div>
        <Button variant="outline" size="sm" onClick={inlineToList}>
          <List className="w-4 h-4 mr-1" /> В список
        </Button>
        <Button variant="outline" size="sm" onClick={listToInline}>
          <ArrowRightLeft className="w-4 h-4 mr-1" /> В строку
        </Button>
        <Button variant="outline" size="sm" onClick={removeDuplicateLines}>
          <Hash className="w-4 h-4 mr-1" /> Уникальные
        </Button>
        <Button variant="outline" size="sm" onClick={removeEmptyLines}>
          <Trash2 className="w-4 h-4 mr-1" /> Без пустых
        </Button>
      </div>
    </div>
  );
};

