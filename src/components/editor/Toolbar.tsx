import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { clipboard } from "@/lib/clipboard";
import { historyAPI } from "@/lib/storage";
import { FileText, Copy, ClipboardPaste, Trash2, Save, Undo, Redo, Type, Minus } from "lucide-react";

export type EditorMode = "simple" | "advanced" | "professional";

type ToolbarProps = {
  text: string;
  onTextChange: (t: string) => void;
  editorMode: EditorMode;
  setEditorMode: (m: EditorMode) => void;
  undo: () => void;
  redo: () => void;
};

type TextPreset = {
  name: string;
  description: string;
  template: string;
};

const textPresets: TextPreset[] = [
  {
    name: "Статья",
    description: "Шаблон для написания статей",
    template: "# Заголовок статьи\n\n## Введение\n\n## Основная часть\n\n## Заключение",
  },
  {
    name: "Письмо",
    description: "Шаблон делового письма",
    template: "Уважаемый(ая) [Имя],\n\n[Основной текст]\n\nС уважением,\n[Ваше имя]",
  },
  {
    name: "Список задач",
    description: "Шаблон для списка дел",
    template: "# Список задач\n\n- [ ] Задача 1\n- [ ] Задача 2\n- [ ] Задача 3",
  },
];

export const Toolbar = ({ text, onTextChange, editorMode, setEditorMode, undo, redo }: ToolbarProps) => {
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState("");

  const handleCopy = async () => {
    const success = await clipboard.copy(text);
    toast({ title: success ? "Скопировано" : "Ошибка", description: success ? "Текст скопирован" : "Не удалось скопировать" });
  };

  const handlePaste = async () => {
    const clipboardText = await clipboard.read();
    if (clipboardText) {
      onTextChange(text + clipboardText);
      toast({ title: "Вставлено", description: "Текст вставлен из буфера обмена" });
    }
  };

  const clearText = () => {
    onTextChange("");
    toast({ title: "Очищено", description: "Текст удален" });
  };

  const saveToHistory = () => {
    if (!text.trim()) return;
    const hasRussianChars = /[а-яё]/i.test(text);
    historyAPI.add({ text, language: hasRussianChars ? "ru" : "en", type: "manual" });
    toast({ title: "Сохранено", description: "Текст добавлен в историю" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleCopy} aria-label="Копировать в буфер" title="Копировать">
          <Copy className="w-4 h-4 mr-1" /> Копировать
        </Button>
        <Button variant="outline" size="sm" onClick={handlePaste} aria-label="Вставить из буфера" title="Вставить">
          <ClipboardPaste className="w-4 h-4 mr-1" /> Вставить
        </Button>
        <Button variant="outline" size="sm" onClick={clearText} aria-label="Очистить текст" title="Очистить">
          <Trash2 className="w-4 h-4 mr-1" /> Очистить
        </Button>
        <Button variant="outline" size="sm" onClick={saveToHistory} aria-label="Сохранить в историю" title="Сохранить">
          <Save className="w-4 h-4 mr-1" /> Сохранить
        </Button>
        <Button variant="outline" size="sm" onClick={undo} aria-label="Отменить" title="Отменить">
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={redo} aria-label="Повторить" title="Повторить">
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Select value={editorMode} onValueChange={(v: EditorMode) => setEditorMode(v)}>
          <SelectTrigger className="w-40" aria-label="Режим редактора">
            <SelectValue placeholder="Режим" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">Простой</SelectItem>
            <SelectItem value="advanced">Продвинутый</SelectItem>
            <SelectItem value="professional">Профессиональный</SelectItem>
          </SelectContent>
        </Select>
        <select
          value={selectedPreset}
          onChange={(e) => {
            const preset = textPresets.find((p) => p.name === e.target.value);
            if (preset) {
              onTextChange(preset.template);
              setSelectedPreset("");
            }
          }}
          aria-label="Выбрать шаблон"
          className="text-sm bg-background border border-border rounded px-2 py-1"
        >
          <option value="">Шаблон</option>
          {textPresets.map((preset) => (
            <option key={preset.name} value={preset.name}>
              {preset.name} - {preset.description}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onTextChange(text.toUpperCase())} aria-label="Преобразовать в заглавный регистр" title="Заглавный">
          <Type className="w-4 h-4 mr-1" /> Заглавный
        </Button>
        <Button variant="outline" size="sm" onClick={() => onTextChange(text.toLowerCase())} aria-label="Преобразовать в прописной регистр" title="Прописной">
          <Type className="w-4 h-4 mr-1" /> Прописной
        </Button>
        <Button variant="outline" size="sm" onClick={() => onTextChange(text.trim())} aria-label="Удалить пробелы по краям" title="Trim">
          <Minus className="w-4 h-4 mr-1" /> Trim
        </Button>
      </div>
    </div>
  );
};

