import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/hooks/use-app-context";
import { historyAPI, settingsAPI } from "@/lib/storage";
import { useMobileOptimization } from "@/hooks/use-mobile-optimization";
import { clipboard } from "@/lib/clipboard";
import * as RovingFocusGroup from "@radix-ui/react-roving-focus";
import {
  FileText,
  Copy,
  ClipboardPaste,
  Trash2,
  Save,
  Undo,
  Redo,
  Search,
  Replace,
  Download,
  Upload,
  Type,
  AlignLeft,
  Hash,
  RotateCcw,
  Zap,
  Settings,
  Layers,
  ArrowRight,
  StickyNote,
  Music,
  Minus,
  List,
  ArrowRightLeft,
  Calculator,
  Bold,
  Italic,
  Code,
  Heading1,
} from "lucide-react";
import { SpecialCharsManager } from "./SpecialCharsManager";

type EditorMode = 'simple' | 'advanced' | 'professional';

type TextPreset = {
  name: string;
  description: string;
  template: string;
  functions: string[];
};

const textPresets: TextPreset[] = [
  {
    name: 'Статья',
    description: 'Шаблон для написания статей',
    template: '# Заголовок статьи\n\n## Введение\n\n## Основная часть\n\n## Заключение',
    functions: ['heading', 'bold', 'list']
  },
  {
    name: 'Письмо',
    description: 'Шаблон делового письма',
    template: 'Уважаемый(ая) [Имя],\n\n[Основной текст]\n\nС уважением,\n[Ваше имя]',
    functions: ['title', 'sentence']
  },
  {
    name: 'Список задач',
    description: 'Шаблон для списка дел',
    template: '# Список задач\n\n- [ ] Задача 1\n- [ ] Задача 2\n- [ ] Задача 3',
    functions: ['list', 'checkbox']
  }
];

export const Editor = () => {
  const [text, setText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [editorMode, setEditorMode] = useState<EditorMode>('simple');
  const [selectedPreset, setSelectedPreset] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRightRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { isMobile, isTablet } = useMobileOptimization();
  const isSmallScreen = isMobile || isTablet;
  const buttonSize: "sm" | "lg" | "default" = isSmallScreen ? "lg" : "sm";
  const iconSizeCls = isSmallScreen ? "w-6 h-6" : "w-4 h-4";
  const { sharedData, clearSharedData, transferToNotes, transferToSuno } = useAppContext();
  const [separator, setSeparator] = useState(",");
  // Collapsible sections (default collapsed on mobile)
  const [showSearch, setShowSearch] = useState(true);
  const [showFormatting, setShowFormatting] = useState(true);
  const [showLists, setShowLists] = useState(true);
  const [showMarkdown, setShowMarkdown] = useState(true);
  // Split view
  const [splitView, setSplitView] = useState(false);
  // Search options
  const [useRegex, setUseRegex] = useState(false);
  const [replacePreview, setReplacePreview] = useState<string>("");
  const [matchCount, setMatchCount] = useState<number>(0);

  // Initialize collapsible defaults based on device
  useEffect(() => {
    if (isSmallScreen) {
      setShowSearch(false);
      setShowFormatting(false);
      setShowLists(false);
      setShowMarkdown(false);
    }
  }, [isSmallScreen]);

  // Load persisted state (history, index, draft text)
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('editor.history');
      const storedIndex = localStorage.getItem('editor.historyIndex');
      const storedDraft = localStorage.getItem('editor.draft');
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory) as string[];
        setHistory(parsed);
        if (storedIndex) {
          const idx = parseInt(storedIndex, 10);
          setHistoryIndex(idx);
          if (parsed[idx] !== undefined) {
            setText(parsed[idx]);
          }
        }
      } else if (storedDraft) {
        setText(storedDraft);
        setHistory([storedDraft]);
        setHistoryIndex(0);
        toast({ title: 'Восстановление', description: 'Черновик восстановлен после сбоя' });
      }
    } catch (e) {
      // ignore
    }
  }, [toast]);

  // Persist history and index
  useEffect(() => {
    try {
      localStorage.setItem('editor.history', JSON.stringify(history));
      localStorage.setItem('editor.historyIndex', String(historyIndex));
    } catch {}
  }, [history, historyIndex]);

  // Persist draft text periodically
  useEffect(() => {
    const id = setTimeout(() => {
      try { localStorage.setItem('editor.draft', text); } catch {}
    }, 500);
    return () => clearTimeout(id);
  }, [text]);

  const addToHistory = (newText: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newText);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    try {
      localStorage.setItem('editor.history', JSON.stringify(newHistory));
      localStorage.setItem('editor.historyIndex', String(newHistory.length - 1));
      localStorage.setItem('editor.draft', newText);
    } catch {}
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setText(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setText(history[historyIndex + 1]);
    }
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    if (newText !== history[historyIndex]) {
      addToHistory(newText);
    }
  };

  const handleCopy = async () => {
    const success = await clipboard.copy(text);
    if (success) {
      toast({
        title: "Скопировано",
        description: "Текст скопирован в буфер обмена",
      });
    } else {
      toast({
        title: "Ошибка копирования",
        description: "Не удалось скопировать текст. Попробуйте выделить текст и использовать Ctrl+C",
        variant: "destructive",
      });
    }
  };

  const handlePaste = async () => {
    const clipboardText = await clipboard.read();
    if (clipboardText) {
      handleTextChange(text + clipboardText);
      toast({
        title: "Вставлено",
        description: "Текст вставлен из буфера обмена",
      });
    } else {
      // Если не удалось прочитать буфер обмена, предлагаем альтернативы
      if (textareaRef.current) {
        textareaRef.current.focus();
        toast({
          title: "Внимание",
          description: "Используйте Ctrl+V или длительное нажатие в поле ввода для вставки",
        });
      } else {
        toast({
          title: "Ошибка буфера обмена",
          description: "Не удалось прочитать буфер обмена. Проверьте разрешения приложения",
          variant: "destructive",
        });
      }
    }
  };

  const clearText = () => {
    handleTextChange("");
    toast({ title: "Очищено", description: "Текст удален" });
  };

  const saveToHistory = () => {
    if (!text.trim()) {
      toast({ title: "Ошибка", description: "Нет текста для сохранения" });
      return;
    }

    const hasRussianChars = /[а-яё]/i.test(text);
    const language: "ru" | "en" = hasRussianChars ? "ru" : "en";

    historyAPI.add({
      text: text,
      language: language,
      type: "manual",
    });

    toast({ title: "Сохранено", description: "Текст добавлен в историю" });
  };

  // Stable autosave (every 30s) without recreating interval on every render
  const textRef = useRef(text);
  useEffect(() => { textRef.current = text; }, [text]);
  useEffect(() => {
    const settings = settingsAPI.get();
    if (!settings.autoSave) return;
    const interval = setInterval(() => {
      const t = textRef.current;
      if (t && t.trim()) {
        const hasRussianChars = /[а-яё]/i.test(t);
        const language: "ru" | "en" = hasRussianChars ? "ru" : "en";
        // Silent autosave entry
        historyAPI.add({ text: t, language, type: "auto" });
        try { localStorage.setItem('editor.draft', t); } catch {}
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sharedData && sharedData.source !== 'editor') {
      setText(sharedData.text);
      addToHistory(sharedData.text);
      toast({
        title: "Текст получен",
        description: `Текст перенесен из ${sharedData.source === 'history' ? 'истории' : sharedData.source === 'notes' ? 'заметок' : 'Suno Editor'}`
      });
      clearSharedData();
    }
  }, [sharedData, clearSharedData, toast, addToHistory]);

  const renderModeSelector = () => (
    <div className="mb-4">
      <div className="text-sm font-medium mb-1">Режим:</div>
      {isMobile ? (
        <Select value={editorMode} onValueChange={(v: EditorMode) => setEditorMode(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите режим" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">Простой</SelectItem>
            <SelectItem value="advanced">Продвинутый</SelectItem>
            <SelectItem value="professional">Профессиональный</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center gap-2">
          {(['simple', 'advanced', 'professional'] as EditorMode[]).map((mode) => (
            <Button
              key={mode}
              variant={editorMode === mode ? 'default' : 'outline'}
              size={buttonSize}
              onClick={() => setEditorMode(mode)}
              className="text-xs"
            >
              {mode === 'simple' ? 'Простой' : mode === 'advanced' ? 'Продвинутый' : 'Профессиональный'}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  const renderPresetSelector = () => (
    <div className="flex items-center space-x-2 mb-4">
      <span className="text-sm font-medium">Шаблоны:</span>
      <select
        value={selectedPreset}
        onChange={(e) => {
          const preset = textPresets.find(p => p.name === e.target.value);
          if (preset) {
            handleTextChange(preset.template);
            setSelectedPreset('');
          }
        }}
        className="text-sm bg-background border border-border rounded px-2 py-2"
      >
        <option value="">Выберите шаблон</option>
        {textPresets.map((preset) => (
          <option key={preset.name} value={preset.name}>
            {preset.name} - {preset.description}
          </option>
        ))}
      </select>
    </div>
  );

  const renderQuickActions = () => (
    <div className="flex flex-nowrap gap-2 mb-4 overflow-x-auto scrollbar-hide py-1 -mx-2 px-2">
      <span className="text-sm font-medium self-center">Быстрые действия:</span>
      <Button
        variant="outline"
        size={buttonSize}
        onClick={() => handleTextChange(text.toUpperCase())}
        className="text-xs"
      >
        <Type className={`${iconSizeCls} mr-1`} />
        Заглавный
      </Button>
      <Button
        variant="outline"
        size={buttonSize}
        onClick={() => handleTextChange(text.toLowerCase())}
        className="text-xs"
      >
        <Type className={`${iconSizeCls} mr-1`} />
        Прописной
      </Button>
      <Button
        variant="outline"
        size={buttonSize}
        onClick={() => handleTextChange(text.trim())}
        className="text-xs"
      >
        <Minus className={`${iconSizeCls} mr-1`} />
        Удалить пробелы
      </Button>
      <Button
        variant="outline"
        size={buttonSize}
        onClick={() => handleTextChange(text.replace(/\s+/g, " "))}
        className="text-xs"
      >
        <Minus className={`${iconSizeCls} mr-1`} />
        Удалить лишние пробелы
      </Button>
    </div>
  );

  // Вспомогательные функции и состояния
  const findAndReplace = () => {
    if (!searchTerm) return;
    if (useRegex) {
      try {
        const re = new RegExp(searchTerm, 'g');
        const replaced = text.replace(re, replaceTerm);
        handleTextChange(replaced);
      } catch (e: any) {
        toast({ title: 'Ошибка RegExp', description: e?.message || 'Неверное регулярное выражение', variant: 'destructive' });
      }
    } else {
      const replaced = text.split(searchTerm).join(replaceTerm);
      handleTextChange(replaced);
    }
  };

  const transformCase = (mode: "title" | "sentence") => {
    if (mode === "title") {
      const res = text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      handleTextChange(res);
    } else {
      const res = text.replace(/(^\s*[a-zA-Zа-яА-ЯёЁ])|([.!?]\s*[a-zA-Zа-яА-ЯёЁ])/g, (s) => s.toUpperCase());
      handleTextChange(res);
    }
  };

  const removeExtraSpaces = () => {
    handleTextChange(text.replace(/\s+/g, " ").trim());
  };

  const removeDuplicateLines = () => {
    const lines = text.split("\n");
    const unique = Array.from(new Set(lines));
    handleTextChange(unique.join("\n"));
  };

  const removeEmptyLines = () => {
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    handleTextChange(lines.join("\n"));
  };

  const sortLines = () => {
    const lines = text.split("\n").sort((a, b) => a.localeCompare(b));
    handleTextChange(lines.join("\n"));
  };

  const countCharacters = () => {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    toast({ title: "Подсчет", description: `Символов: ${chars}, Слов: ${words}` });
  };

  const inlineToList = () => {
    const parts = text.split(separator).map((p) => p.trim()).filter((p) => p.length > 0);
    handleTextChange(parts.join("\n"));
  };

  const listToInline = () => {
    const parts = text.split("\n").map((p) => p.trim()).filter((p) => p.length > 0);
    handleTextChange(parts.join(`${separator} `));
  };

  const addMarkdown = (type: "bold" | "underline" | "code" | "heading" | "separator") => {
    switch (type) {
      case "bold":
        handleTextChange(`**${text}**`);
        break;
      case "underline":
        handleTextChange(`__${text}__`);
        break;
      case "code":
        handleTextChange("`" + text + "`");
        break;
      case "heading":
        handleTextChange(text.startsWith("# ") ? text : `# ${text}`);
        break;
      case "separator":
        handleTextChange(text + (text.endsWith("\n") ? "" : "\n") + "---\n");
        break;
    }
  };

  const removeMarkdown = () => {
    let t = text;
    t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
    t = t.replace(/__([^_]+)__/g, "$1");
    t = t.replace(/`([^`]+)`/g, "$1");
    t = t.replace(/^\s*#{1,6}\s+/gm, "");
    t = t.replace(/^---$/gm, "");
    handleTextChange(t);
  };

  const stats = {
    chars: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text ? text.split("\n").length : 0,
  };

  // ===== Advanced helpers =====
  const insertAtCursor = (insertText: string) => {
    const el = textareaRef.current;
    if (!el) { handleTextChange(text + insertText); return; }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const newVal = text.slice(0, start) + insertText + text.slice(end);
    handleTextChange(newVal);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = start + insertText.length;
        textareaRef.current.selectionStart = pos;
        textareaRef.current.selectionEnd = pos;
        textareaRef.current.focus();
      }
    });
  };

  // Case transforms
  const toTitleCase = () => transformCase("title");
  const toSentenceCase = () => transformCase("sentence");
  const toggleCase = () => {
    const res = text
      .split("")
      .map((ch) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()))
      .join("");
    handleTextChange(res);
  };
  const randomCase = () => {
    const res = text
      .split("")
      .map((ch) => /[A-Za-zА-Яа-яЁё]/.test(ch) ? (Math.random() < 0.5 ? ch.toLowerCase() : ch.toUpperCase()) : ch)
      .join("");
    handleTextChange(res);
  };

  // Identifier case
  const tokenize = (t: string) => t
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/);
  const toCamel = () => {
    const parts = tokenize(text).map(p => p.toLowerCase());
    if (!parts.length) return;
    const res = parts[0] + parts.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    handleTextChange(res);
  };
  const toSnake = () => handleTextChange(tokenize(text).map(p => p.toLowerCase()).join("_"));
  const toKebab = () => handleTextChange(tokenize(text).map(p => p.toLowerCase()).join("-"));
  const toPascal = () => handleTextChange(tokenize(text).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(""));

  // Structure
  const wrapAt = (width = 80) => {
    const words = text.split(/\s+/);
    let line = ""; const lines: string[] = [];
    for (const w of words) {
      if ((line + (line ? " " : "") + w).length > width) {
        if (line) lines.push(line);
        line = w;
      } else {
        line = line ? line + " " + w : w;
      }
    }
    if (line) lines.push(line);
    handleTextChange(lines.join("\n"));
  };
  const prefixLines = (prefix: string) => handleTextChange(text.split("\n").map(l => prefix + l).join("\n"));
  const suffixLines = (suffix: string) => handleTextChange(text.split("\n").map(l => l + suffix).join("\n"));
  const numberLines = () => handleTextChange(text.split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n"));
  const bulletLines = () => handleTextChange(text.split("\n").map(l => l.trim() ? `- ${l}` : l).join("\n"));
  const unbulletLines = () => handleTextChange(text.split("\n").map(l => l.replace(/^\s*([-*]\s|\d+\.\s|\[ \]\s)/, "")).join("\n"));
  const checklistLines = () => handleTextChange(text.split("\n").map(l => l.trim() ? `- [ ] ${l}` : l).join("\n"));
  const reindent = (spaces = 2, direction: 'tabs-to-spaces' | 'spaces-to-tabs' = 'tabs-to-spaces') => {
    if (direction === 'tabs-to-spaces') {
      handleTextChange(text.replace(/^\t+/gm, (m) => ' '.repeat(m.length * spaces)));
    } else {
      const re = new RegExp(`^ {${spaces}}`, 'gm');
      handleTextChange(text.replace(re, "\t"));
    }
  };
  const sortLinesAdvanced = (mode: 'az' | 'za' | 'len' | 'rand') => {
    const lines = text.split("\n");
    let res = lines.slice();
    switch (mode) {
      case 'az': res.sort((a, b) => a.localeCompare(b)); break;
      case 'za': res.sort((a, b) => b.localeCompare(a)); break;
      case 'len': res.sort((a, b) => a.length - b.length); break;
      case 'rand': res.sort(() => Math.random() - 0.5); break;
    }
    handleTextChange(res.join("\n"));
  };
  const shuffleParagraphs = () => {
    const paras = text.split(/\n{2,}/);
    const shuffled = paras.sort(() => Math.random() - 0.5);
    handleTextChange(shuffled.join("\n\n"));
  };

  // Cleanup
  const trimTrailingSpaces = () => handleTextChange(text.replace(/[\t ]+$/gm, ""));
  const ensureEOFNewline = () => handleTextChange(text.endsWith("\n") ? text : text + "\n");
  const normalizeUnicode = (form: 'NFC' | 'NFD') => handleTextChange(text.normalize(form));
  const stripDiacritics = () => handleTextChange(text.normalize('NFD').replace(/\p{M}+/gu, '').normalize('NFC'));
  const removeHTML = () => handleTextChange(text.replace(/<[^>]*>/g, ""));
  const removeBBCode = () => handleTextChange(text.replace(/\[[^\]]+\]/g, ""));

  // Encoding
  const htmlEscape = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const htmlUnescape = (s: string) => s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
  const toggleHtmlEscape = () => {
    if (/[<>]/.test(text)) handleTextChange(htmlEscape(text));
    else if (/&(lt|gt|amp|quot|#39);/.test(text)) handleTextChange(htmlUnescape(text));
    else handleTextChange(htmlEscape(text));
  };
  const base64Toggle = () => {
    try {
      // try decode
      const decoded = atob(text);
      // if decoded contains many non-control characters, accept
      if (/^[\s\S]*$/.test(decoded)) { handleTextChange(decoded); return; }
    } catch {}
    try { handleTextChange(btoa(text)); } catch { toast({ title: 'Base64', description: 'Не удалось кодировать/декодировать', variant: 'destructive' }); }
  };
  const caesar = (shift: number) => {
    const shiftAlpha = (ch: string, base: number, mod: number) => String.fromCharCode((ch.charCodeAt(0) - base + shift + mod) % mod + base);
    const res = text.replace(/[A-Za-z]/g, (ch) => {
      if (ch >= 'a' && ch <= 'z') return shiftAlpha(ch, 'a'.charCodeAt(0), 26);
      if (ch >= 'A' && ch <= 'Z') return shiftAlpha(ch, 'A'.charCodeAt(0), 26);
      return ch;
    });
    handleTextChange(res);
  };
  const rot13 = () => caesar(13);

  // Transformations
  const reverseText = () => handleTextChange(text.split("").reverse().join(""));
  const mirrorMap: Record<string, string> = { '(':')', ')':'(', '[':']', ']':'[', '{':'}', '}':'{', '<':'>', '>':'<', '/':'\\', '\\':'/', '«':'»', '»':'«' };
  const mirrorText = () => handleTextChange(text.split("").map(ch => mirrorMap[ch] ?? ch).join(""));
  const upsideDownMap: Record<string, string> = { a:'ɐ', b:'q', c:'ɔ', d:'p', e:'ǝ', f:'ɟ', g:'ƃ', h:'ɥ', i:'ᴉ', j:'ɾ', k:'ʞ', l:'l', m:'ɯ', n:'u', o:'o', p:'d', q:'b', r:'ɹ', s:'s', t:'ʇ', u:'n', v:'ʌ', w:'ʍ', x:'x', y:'ʎ', z:'z', A:'∀', C:'Ɔ', E:'Ǝ', F:'Ⅎ', G:'פ', H:'H', I:'I', J:'ſ', L:'˥', M:'W', N:'N', P:'Ԁ', R:'ᴚ', T:'⊥', U:'∩', V:'Λ', W:'M', Y:'⅄', '1':'Ɩ', '2':'ᄅ', '3':'Ɛ', '4':'ㄣ', '5':'ϛ', '6':'9', '7':'ㄥ', '8':'8', '9':'6', '0':'0' };
  const upsideDown = () => handleTextChange(text.split("").reverse().map(ch => upsideDownMap[ch] ?? ch).join(""));

  // Transliteration (basic RU↔LAT)
  const mapRuToLat: Record<string, string> = { 'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'Zh','З':'Z','И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F','Х':'Kh','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Shch','Ъ':'','Ы':'Y','Ь':'','Э':'E','Ю':'Yu','Я':'Ya','а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' };
  const ruToLat = () => handleTextChange(text.split("").map(ch => mapRuToLat[ch] ?? ch).join(""));
  const latToRu = () => {
    let t = text;
    const pairs = [
      ['shch','щ'],['yo','ё'],['zh','ж'],['kh','х'],['ts','ц'],['ch','ч'],['sh','ш'],['yu','ю'],['ya','я']
    ];
    for (const [lat, ru] of pairs) t = t.replace(new RegExp(lat, 'gi'), (m) => m[0] === 'Y' || m[0] === 'S' ? ru.toUpperCase() : ru);
    t = t.replace(/\bye/g, 'е');
    t = t.replace(/y/g, 'й');
    handleTextChange(t);
  };

  // Extract / Remove
  const extractByRegex = (re: RegExp) => {
    const matches = text.match(re) || [];
    handleTextChange(matches.join('\n'));
  };
  const removeByRegex = (re: RegExp) => handleTextChange(text.replace(re, ''));

  // Inserts
  const insertTimestamp = () => insertAtCursor(new Date().toISOString());
  const insertUUID = () => {
    const rnd = (n: number) => crypto.getRandomValues(new Uint8Array(n));
    const toHex = (buf: Uint8Array) => Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
    const b = rnd(16);
    b[6] = (b[6] & 0x0f) | 0x40; // version 4
    b[8] = (b[8] & 0x3f) | 0x80; // variant
    const hex = toHex(b);
    const uuid = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    insertAtCursor(uuid);
  };
  const insertLorem = () => insertAtCursor('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.');

  // Pseudo-fonts and special forms
  const mapTransform = (input: string, table: Record<string, string>) => input.split("").map(ch => table[ch] ?? ch).join("");
  const superscriptTable: Record<string, string> = {
    '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
    'a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ','i':'ᶦ','j':'ʲ','k':'ᵏ','l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ','r':'ʳ','s':'ˢ','t':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ',
    'A':'ᴬ','B':'ᴮ','D':'ᴰ','E':'ᴱ','G':'ᴳ','H':'ᴴ','I':'ᴵ','J':'ᴶ','K':'ᴷ','L':'ᴸ','M':'ᴹ','N':'ᴺ','O':'ᴼ','P':'ᴾ','R':'ᴿ','T':'ᵀ','U':'ᵁ','V':'ⱽ','W':'ᵂ'
  };
  const subscriptTable: Record<string, string> = {
    '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
    'a':'ₐ','e':'ₑ','h':'ₕ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ','o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ'
  };
  const smallCapsTable: Record<string, string> = {
    'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ғ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ'
  };
  // Mathematical Alphanumeric Symbols subsets
  const boldSerifTable: Record<string, string> = {};
  const italicSansTable: Record<string, string> = {};
  const monoTable: Record<string, string> = {};
  const frakturTable: Record<string, string> = {};
  const doubleStruckTable: Record<string, string> = {};
  // Fill tables programmatically
  (() => {
    const A = 'A'.charCodeAt(0), a = 'a'.charCodeAt(0), zero = '0'.charCodeAt(0);
    // Bold serif: A-Z 0x1D400, a-z 0x1D41A, 0-9 0x1D7CE
    for (let i=0;i<26;i++) boldSerifTable[String.fromCharCode(A+i)] = String.fromCodePoint(0x1D400+i);
    for (let i=0;i<26;i++) boldSerifTable[String.fromCharCode(a+i)] = String.fromCodePoint(0x1D41A+i);
    for (let i=0;i<10;i++) boldSerifTable[String.fromCharCode(zero+i)] = String.fromCodePoint(0x1D7CE+i);
    // Italic sans: A-Z 0x1D608, a-z 0x1D622
    for (let i=0;i<26;i++) italicSansTable[String.fromCharCode(A+i)] = String.fromCodePoint(0x1D608+i);
    for (let i=0;i<26;i++) italicSansTable[String.fromCharCode(a+i)] = String.fromCodePoint(0x1D622+i);
    // Monospace: A-Z 0x1D670, a-z 0x1D68A, 0-9 0x1D7F6
    for (let i=0;i<26;i++) monoTable[String.fromCharCode(A+i)] = String.fromCodePoint(0x1D670+i);
    for (let i=0;i<26;i++) monoTable[String.fromCharCode(a+i)] = String.fromCodePoint(0x1D68A+i);
    for (let i=0;i<10;i++) monoTable[String.fromCharCode(zero+i)] = String.fromCodePoint(0x1D7F6+i);
    // Fraktur: A-Z 0x1D504 (some gaps), a-z 0x1D51E
    const frakA = [0x1D504,0x1D505,0x212D,0x1D507,0x1D508,0x1D509,0x1D50A,0x210C,0x2111,0x1D50D,0x1D50E,0x1D50F,0x1D510,0x1D511,0x1D512,0x1D513,0x1D514,0x211C,0x1D516,0x1D517,0x1D518,0x1D519,0x1D51A,0x1D51B,0x1D51C,0x2128];
    for (let i=0;i<26;i++) frakturTable[String.fromCharCode(A+i)] = String.fromCodePoint(frakA[i]);
    for (let i=0;i<26;i++) frakturTable[String.fromCharCode(a+i)] = String.fromCodePoint(0x1D51E+i);
    // Double-struck: A-Z 0x1D538 (with gaps), a-z 0x1D552, 0-9 0x1D7D8
    const dsA = [0x1D538,0x1D539,0x2102,0x1D53B,0x1D53C,0x1D53D,0x1D53E,0x210D,0x2148,0x1D540,0x1D541,0x1D542,0x1D543,0x2115,0x1D545,0x1D546,0x211A,0x211D,0x1D54A,0x1D54B,0x1D54C,0x1D54D,0x1D54E,0x1D54F,0x1D550,0x2124];
    for (let i=0;i<26;i++) doubleStruckTable[String.fromCharCode(A+i)] = String.fromCodePoint(dsA[i]);
    for (let i=0;i<26;i++) doubleStruckTable[String.fromCharCode(a+i)] = String.fromCodePoint(0x1D552+i);
    for (let i=0;i<10;i++) doubleStruckTable[String.fromCharCode(zero+i)] = String.fromCodePoint(0x1D7D8+i);
  })();

  const toSuperscript = () => handleTextChange(mapTransform(text, superscriptTable));
  const toSubscript = () => handleTextChange(mapTransform(text, subscriptTable));
  const toSmallCaps = () => handleTextChange(mapTransform(text.toLowerCase(), smallCapsTable));
  const toBoldSerif = () => handleTextChange(mapTransform(text, boldSerifTable));
  const toItalicSans = () => handleTextChange(mapTransform(text, italicSansTable));
  const toMonospace = () => handleTextChange(mapTransform(text, monoTable));
  const toFraktur = () => handleTextChange(mapTransform(text, frakturTable));
  const toDoubleStruck = () => handleTextChange(mapTransform(text, doubleStruckTable));

  // RegExp Macros manager (minimal)
  type Macro = { pattern: string; replacement: string; alias?: string };
  const loadMacros = (): Macro[] => {
    try { return JSON.parse(localStorage.getItem('editor.macros') || '[]'); } catch { return []; }
  };
  const saveMacros = (list: Macro[]) => { try { localStorage.setItem('editor.macros', JSON.stringify(list)); } catch {} };
  const runMacroManager = () => {
    const choice = prompt('RegExp Macros: (1) Run (2) Add (3) Export (4) Import');
    if (!choice) return;
    const macros = loadMacros();
    if (choice === '1') {
      const aliases = macros.map((m, i) => `${i+1}. ${m.alias || m.pattern}`).join('\n');
      const pick = prompt(`Выберите макрос:\n${aliases}`);
      const idx = pick ? parseInt(pick, 10) - 1 : -1;
      const m = macros[idx];
      if (m) {
        try { const re = new RegExp(m.pattern, 'g'); handleTextChange(text.replace(re, m.replacement)); }
        catch (e: any) { toast({ title: 'Macro error', description: e?.message || 'Bad pattern', variant: 'destructive' }); }
      }
    } else if (choice === '2') {
      const pattern = prompt('Pattern (RegExp, no slashes):'); if (!pattern) return;
      const replacement = prompt('Replacement:') ?? '';
      const alias = prompt('Alias:') ?? '';
      const next = [...macros, { pattern, replacement, alias }];
      saveMacros(next);
      toast({ title: 'Сохранено', description: 'Макрос добавлен' });
    } else if (choice === '3') {
      const data = JSON.stringify(macros, null, 2);
      navigator.clipboard.writeText(data);
      toast({ title: 'Экспорт', description: 'JSON макросов скопирован в буфер' });
    } else if (choice === '4') {
      const data = prompt('Вставьте JSON макросов:');
      if (!data) return;
      try { const parsed = JSON.parse(data) as Macro[]; saveMacros(parsed); toast({ title: 'Импорт', description: 'Макросы импортированы' }); }
      catch { toast({ title: 'Импорт', description: 'Некорректный JSON', variant: 'destructive' }); }
    }
  };

  // Global hotkeys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // helper
      const mod = (e.ctrlKey || e.metaKey);
      // Cases
      if (mod && e.shiftKey && e.code === 'KeyU') { e.preventDefault(); handleTextChange(text.toUpperCase()); return; }
      if (mod && e.shiftKey && e.code === 'KeyL') { e.preventDefault(); handleTextChange(text.toLowerCase()); return; }
      if (mod && e.shiftKey && e.code === 'KeyT') { e.preventDefault(); toTitleCase(); return; }
      if (mod && e.shiftKey && e.code === 'KeyS') { e.preventDefault(); toSentenceCase(); return; }
      if (!mod && e.code === 'CapsLock') { /* ignore */ }
      // Toggle / Random
      if (e.code === 'Pause') { e.preventDefault(); toggleCase(); return; }
      if (e.altKey && !mod && e.code === 'KeyR' && e.shiftKey) { e.preventDefault(); randomCase(); return; }

      // Identifier
      if (e.altKey && e.shiftKey && e.code === 'Digit1') { e.preventDefault(); toCamel(); return; }
      if (e.altKey && e.shiftKey && e.code === 'Digit2') { e.preventDefault(); toSnake(); return; }
      if (e.altKey && e.shiftKey && e.code === 'Digit3') { e.preventDefault(); toKebab(); return; }
      if (e.altKey && e.shiftKey && e.code === 'Digit4') { e.preventDefault(); toPascal(); return; }

      // Structure
      if (e.altKey && !mod && e.code === 'KeyW') { e.preventDefault(); const w = prompt('Ширина переноса', '80'); wrapAt(w ? parseInt(w,10) : 80); return; }
      if (mod && e.altKey && e.code === 'KeyP') { e.preventDefault(); const p = prompt('Префикс', '> '); if (p!==null) prefixLines(p); return; }
      if (mod && e.altKey && e.code === 'KeyS') { e.preventDefault(); const sfx = prompt('Суффикс', ''); if (sfx!==null) suffixLines(sfx); return; }
      if (mod && e.altKey && e.code === 'KeyN') { e.preventDefault(); numberLines(); return; }
      if (mod && e.altKey && e.code === 'KeyB') { e.preventDefault(); bulletLines(); return; }
      if (mod && e.altKey && e.code === 'KeyU') { e.preventDefault(); unbulletLines(); return; }
      if (mod && e.altKey && e.code === 'KeyC') { e.preventDefault(); checklistLines(); return; }
      if (mod && e.altKey && e.code === 'KeyI') { e.preventDefault(); const dir = prompt('Tabs→Spaces (t2/t4) или Spaces→Tabs (s2/s4)', 't2'); if (dir) { if (dir==='t2') reindent(2,'tabs-to-spaces'); else if (dir==='t4') reindent(4,'tabs-to-spaces'); else if (dir==='s2') reindent(2,'spaces-to-tabs'); else if (dir==='s4') reindent(4,'spaces-to-tabs'); } return; }
      if (mod && e.altKey && e.code === 'KeyL') { e.preventDefault(); const mode = prompt('Sort: az, za, len, rand','az') as any; sortLinesAdvanced(mode || 'az'); return; }
      if (e.altKey && !mod && e.code === 'KeyR') { e.preventDefault(); shuffleParagraphs(); return; }
      if (e.altKey && !mod && e.code === 'KeyD') { e.preventDefault(); removeDuplicateLines(); return; }

      // Cleanup
      if (e.altKey && !mod && e.code === 'KeyT') { e.preventDefault(); trimTrailingSpaces(); return; }
      if (e.altKey && !mod && e.code === 'KeyE') { e.preventDefault(); ensureEOFNewline(); return; }
      if (e.altKey && !mod && e.code === 'KeyU') { e.preventDefault(); const form = prompt('Unicode нормализация: NFC или NFD','NFC') as any; if (form==='NFC'||form==='NFD') normalizeUnicode(form); return; }
      if (e.altKey && e.shiftKey && e.code === 'KeyD') { e.preventDefault(); stripDiacritics(); return; }
      if (e.altKey && !mod && e.code === 'KeyH') { e.preventDefault(); removeHTML(); return; }
      if (e.altKey && !mod && e.code === 'KeyM') { e.preventDefault(); removeMarkdown(); return; }
      if (e.altKey && !mod && e.code === 'KeyB') { e.preventDefault(); removeBBCode(); return; }

      // Encoding / Crypto
      if (mod && !e.shiftKey && e.code === 'KeyE') { e.preventDefault(); toggleHtmlEscape(); return; }
      if (mod && e.shiftKey && e.code === 'KeyB') { e.preventDefault(); base64Toggle(); return; }
      if (mod && !e.shiftKey && e.code === 'KeyR') { e.preventDefault(); const s = prompt('Caesar shift (±N), пусто = ROT13',''); if (s===null||s==='') rot13(); else caesar(parseInt(s,10)||0); return; }

      // Transformations
      if (e.altKey && e.shiftKey && e.code === 'KeyR') { e.preventDefault(); reverseText(); return; }
      if (e.altKey && e.shiftKey && e.code === 'KeyM') { e.preventDefault(); mirrorText(); return; }
      if (e.altKey && e.shiftKey && e.code === 'KeyU') { e.preventDefault(); upsideDown(); return; }
      if (e.altKey && e.code === 'KeyT' && e.shiftKey) { e.preventDefault(); const dir = prompt('Транслитерация: ru2lat / lat2ru', 'ru2lat'); if (dir==='ru2lat') ruToLat(); else if (dir==='lat2ru') latToRu(); return; }

      // Pseudo-fonts / Symbols
      if (e.altKey && !e.shiftKey && e.code === 'ArrowUp') { e.preventDefault(); toSuperscript(); return; }
      if (e.altKey && !e.shiftKey && e.code === 'ArrowDown') { e.preventDefault(); toSubscript(); return; }
      if (e.altKey && !e.shiftKey && e.code === 'KeyS') { e.preventDefault(); toSmallCaps(); return; }
      if (e.altKey && !e.shiftKey && e.code === 'KeyB') { e.preventDefault(); toBoldSerif(); return; }
      if (e.altKey && !e.shiftKey && e.code === 'KeyI') { e.preventDefault(); toItalicSans(); return; }
      if (e.altKey && !e.shiftKey && e.code === 'KeyM') { e.preventDefault(); toMonospace(); return; }
      if (e.altKey && !e.shiftKey && e.code === 'KeyF') { e.preventDefault(); toFraktur(); return; }
      if (e.altKey && !e.shiftKey && e.code === 'KeyD') { e.preventDefault(); toDoubleStruck(); return; }

      // Extract / Remove
      if (e.altKey && !e.shiftKey && e.code === 'KeyX') { e.preventDefault(); const kind = prompt('Extract: emails / urls / digits','emails'); if (kind==='emails') extractByRegex(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g); else if (kind==='urls') extractByRegex(/https?:\/\/[^\s]+/g); else if (kind==='digits') extractByRegex(/\d+/g); return; }
      if (e.altKey && e.shiftKey && e.code === 'KeyX') { e.preventDefault(); const kind = prompt('Remove: emails / urls / digits','emails'); if (kind==='emails') removeByRegex(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g); else if (kind==='urls') removeByRegex(/https?:\/\/[^\s]+/g); else if (kind==='digits') removeByRegex(/\d+/g); return; }

      // Inserts
      if (mod && e.altKey && e.code === 'KeyT') { e.preventDefault(); insertTimestamp(); return; }
      if (mod && e.altKey && e.code === 'KeyU') { e.preventDefault(); insertUUID(); return; }
      if (mod && e.altKey && e.code === 'KeyL') { e.preventDefault(); insertLorem(); return; }

      // Macros manager
      if (mod && e.shiftKey && e.code === 'KeyR') { e.preventDefault(); runMacroManager(); return; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [text]);

  // Compute preview and match count for search/replace
  useEffect(() => {
    if (!searchTerm) {
      setReplacePreview("");
      setMatchCount(0);
      return;
    }
    if (useRegex) {
      try {
        const re = new RegExp(searchTerm, 'g');
        setMatchCount((text.match(re) || []).length);
        setReplacePreview(text.replace(re, replaceTerm));
      } catch {
        setMatchCount(0);
        setReplacePreview('');
      }
    } else {
      const occurrences = text ? text.split(searchTerm).length - 1 : 0;
      setMatchCount(occurrences);
      setReplacePreview(text.split(searchTerm).join(replaceTerm));
    }
  }, [text, searchTerm, replaceTerm, useRegex]);

  // Sync scroll between split textareas
  const syncScrollLeft = () => {
    if (textareaRef.current && textareaRightRef.current) {
      textareaRightRef.current.scrollTop = textareaRef.current.scrollTop;
      textareaRightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };
  const syncScrollRight = () => {
    if (textareaRef.current && textareaRightRef.current) {
      textareaRef.current.scrollTop = textareaRightRef.current.scrollTop;
      textareaRef.current.scrollLeft = textareaRightRef.current.scrollLeft;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="bg-gradient-secondary border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Текстовый редактор</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                Режим: {editorMode === 'simple' ? 'Простой' : editorMode === 'advanced' ? 'Продвинутый' : 'Профессиональный'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderModeSelector()}
          {/* Split view toggle */}
          <div className="flex items-center gap-2 mb-2">
            <input id="split-view" type="checkbox" checked={splitView} onChange={(e) => setSplitView(e.target.checked)} />
            <label htmlFor="split-view" className="text-sm select-none">Двойной просмотр (Split‑view)</label>
          </div>
          {editorMode !== 'simple' && renderPresetSelector()}
          {editorMode === 'professional' && renderQuickActions()}

          {/* Панель инструментов (sticky at bottom inside content) */}
          <RovingFocusGroup.Root
            orientation="horizontal"
            loop
            role="toolbar"
            aria-label="Основные действия редактора"
            className="sticky bottom-[56px] z-20 bg-card/80 supports-[backdrop-filter]:bg-card/60 backdrop-blur flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide py-2 -mx-4 px-4 border-t pb-[env(safe-area-inset-bottom)]"
          >
            <RovingFocusGroup.Item asChild>
              <Button
                variant="outline"
                size={buttonSize}
                onClick={undo}
                disabled={historyIndex <= 0}
                className="flex items-center space-x-1"
                aria-label="Отменить"
              >
                <Undo className={iconSizeCls} />
                <span className="hidden sm:inline">Отменить</span>
              </Button>
            </RovingFocusGroup.Item>
            <RovingFocusGroup.Item asChild>
              <Button
                variant="outline"
                size={buttonSize}
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="flex items-center space-x-1"
                aria-label="Повторить"
              >
                <Redo className={iconSizeCls} />
                <span className="hidden sm:inline">Повторить</span>
              </Button>
            </RovingFocusGroup.Item>
            <RovingFocusGroup.Item asChild>
              <Button
                variant="outline"
                size={buttonSize}
                onClick={handleCopy}
                className="flex items-center space-x-1"
                aria-label="Копировать"
              >
                <Copy className={iconSizeCls} />
                <span className="hidden sm:inline">Копировать</span>
              </Button>
            </RovingFocusGroup.Item>
            <RovingFocusGroup.Item asChild>
              <Button
                variant="outline"
                size={buttonSize}
                onClick={handlePaste}
                className="flex items-center space-x-1"
                aria-label="Вставить"
              >
                <ClipboardPaste className={iconSizeCls} />
                <span className="hidden sm:inline">Вставить</span>
              </Button>
            </RovingFocusGroup.Item>
            <RovingFocusGroup.Item asChild>
              <Button
                variant="outline"
                size={buttonSize}
                onClick={saveToHistory}
                className="flex items-center space-x-1"
                aria-label="Сохранить"
              >
                <Save className={iconSizeCls} />
                <span className="hidden sm:inline">Сохранить</span>
              </Button>
            </RovingFocusGroup.Item>

            {/* Transfer buttons (visible when text exists) */}
            {text.trim() && (
              <>
                <RovingFocusGroup.Item asChild>
                  <Button
                    variant="outline"
                    size={buttonSize}
                    onClick={() => transferToNotes(text, { title: 'Из редактора' })}
                    className="flex items-center space-x-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                    aria-label="В заметки"
                  >
                    <StickyNote className={iconSizeCls} />
                    <ArrowRight className={isMobile ? "w-5 h-5" : "w-3 h-3"} />
                    <span className="hidden sm:inline">В заметки</span>
                  </Button>
                </RovingFocusGroup.Item>
                <RovingFocusGroup.Item asChild>
                  <Button
                    variant="outline"
                    size={buttonSize}
                    onClick={() => transferToSuno(text)}
                    className="flex items-center space-x-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                    aria-label="В Suno"
                  >
                    <Music className={iconSizeCls} />
                    <ArrowRight className={isMobile ? "w-5 h-5" : "w-3 h-3"} />
                    <span className="hidden sm:inline">В Suno</span>
                  </Button>
                </RovingFocusGroup.Item>
              </>
            )}
          </RovingFocusGroup.Root>

          {/* Текстовая область / Split view */}
          {!splitView ? (
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              onScroll={syncScrollLeft}
              placeholder="Введите или вставьте ваш текст здесь..."
              className={`bg-background/50 border-border focus:border-primary transition-smooth ${isMobile ? 'min-h-[300px] text-base' : 'min-h-[300px] md:min-h-[350px] text-sm'}`}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onScroll={syncScrollLeft}
                placeholder="Левый вид"
                className={`bg-background/50 border-border focus:border-primary transition-smooth ${isMobile ? 'min-h-[260px] text-base' : 'min-h-[260px] md:min-h-[320px] text-sm'}`}
              />
              <Textarea
                ref={textareaRightRef}
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onScroll={syncScrollRight}
                placeholder="Правый вид"
                className={`bg-background/50 border-border focus:border-primary transition-smooth ${isMobile ? 'min-h-[260px] text-base' : 'min-h-[260px] md:min-h-[320px] text-sm'}`}
              />
            </div>
          )}

          {/* Панель специальных символов */}
          <SpecialCharsManager text={text} onTextChange={handleTextChange} />

          {/* Статистика */}
          <div className="flex flex-wrap gap-2 md:gap-2">
            <Badge
              variant="outline"
              className="bg-background/50 text-xs md:text-sm"
            >
              Символов: {stats.chars}
            </Badge>
            <Badge
              variant="outline"
              className="bg-background/50 text-xs md:text-sm"
            >
              Слов: {stats.words}
            </Badge>
            <Badge
              variant="outline"
              className="bg-background/50 text-xs md:text-sm"
            >
              Строк: {stats.lines}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Инструменты форматирования */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader onClick={() => setShowSearch(v => !v)} className="cursor-pointer select-none">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Search className={iconSizeCls + " text-primary"} />
              <span>Поиск и замена</span>
            </CardTitle>
          </CardHeader>
          {showSearch && (
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="search">Найти</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Текст для поиска"
                className="bg-background/50 text-base"
              />
            </div>
            <div>
              <Label htmlFor="replace">Заменить на</Label>
              <Input
                id="replace"
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                placeholder="Новый текст"
                className="bg-background/50 text-base"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm flex items-center gap-2 select-none">
                <input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} />
                Использовать RegExp
              </label>
              <Badge variant="outline" className="text-xs">Совпадений: {matchCount}</Badge>
            </div>
            <Button
              onClick={findAndReplace}
              disabled={!searchTerm}
              size={buttonSize}
              className="w-full"
            >
              Заменить все
            </Button>
            {searchTerm && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Предпросмотр результата</div>
                <pre className="p-2 rounded border border-border bg-background/40 overflow-auto max-h-64 whitespace-pre-wrap break-words text-xs md:text-sm">{replacePreview}</pre>
              </div>
            )}
          </CardContent>
          )}
        </Card>

        <Card className="bg-card border-border">
          <CardHeader onClick={() => setShowFormatting(v => !v)} className="cursor-pointer select-none">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Type className={iconSizeCls + " text-primary"} />
              <span>Форматирование</span>
            </CardTitle>
          </CardHeader>
          {showFormatting && (
          <CardContent className="space-y-3">
            {/* Основные функции */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size={buttonSize}
                onClick={() => transformCase("title")}
                className="text-xs w-full justify-start whitespace-normal leading-tight min-h-[44px]"
              >
                <Type className={`${iconSizeCls} mr-1`} />
                Заглавный
              </Button>
              <Button
                variant="outline"
                size={buttonSize}
                onClick={() => transformCase("sentence")}
                className="text-xs w-full justify-start whitespace-normal leading-tight min-h-[44px]"
              >
                <Type className={`${iconSizeCls} mr-1`} />
                Первая заглавная
              </Button>
            </div>

            {/* Функции очистки */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button variant="outline" size={buttonSize} onClick={clearText} className="w-full justify-start whitespace-normal leading-tight min-h-[44px]">
                <Hash className={`${iconSizeCls} mr-1`} />
                Удалить все
              </Button>
              <Button variant="outline" size={buttonSize} onClick={removeExtraSpaces} className="w-full justify-start whitespace-normal leading-tight min-h-[44px]">
                <Minus className={`${iconSizeCls} mr-1`} />
                Удалить пробелы
              </Button>
              <Button
                variant="outline"
                size={buttonSize}
                onClick={removeDuplicateLines}
                className="w-full justify-start whitespace-normal leading-tight min-h-[44px]"
              >
                <List className={`${iconSizeCls} mr-1`} />
                Удалить дубликаты
              </Button>
              <Button variant="outline" size={buttonSize} onClick={removeEmptyLines} className="w-full justify-start whitespace-normal leading-tight min-h-[44px]">
                <AlignLeft className={`${iconSizeCls} mr-1`} />
                Удалить пустые строки
              </Button>
            </div>

            {/* Дополнительные функции */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button variant="outline" size={buttonSize} onClick={sortLines} className="w-full justify-start whitespace-normal leading-tight min-h-[44px]">
                <List className={`${iconSizeCls} mr-1`} />
                Сортировать строки
              </Button>
              <Button variant="outline" size={buttonSize} onClick={countCharacters} className="w-full justify-start whitespace-normal leading-tight min-h-[44px]">
                <Calculator className={`${iconSizeCls} mr-1`} />
                Подсчитать символы
              </Button>
            </div>
          </CardContent>
          )}
        </Card>
      </div>

      {/* Функции списков и Markdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader onClick={() => setShowLists(v => !v)} className="cursor-pointer select-none">
            <CardTitle className="text-lg flex items-center space-x-2">
              <ArrowRightLeft className={iconSizeCls + " text-primary"} />
              <span>Преобразование списков</span>
            </CardTitle>
          </CardHeader>
          {showLists && (
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="separator">Разделитель</Label>
              <Input
                id="separator"
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                placeholder="Разделитель (например: ,)"
                className="bg-background/50 text-base"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button variant="outline" size={buttonSize} onClick={inlineToList} className="w-full justify-start whitespace-normal leading-tight min-h-[44px]">
                <List className={`${iconSizeCls} mr-1`} />
                Inline → Список
              </Button>
              <Button variant="outline" size={buttonSize} onClick={listToInline} className="w-full justify-start whitespace-normal leading-tight min-h-[44px]">
                <AlignLeft className={`${iconSizeCls} mr-1`} />
                Список → Inline
              </Button>
            </div>
          </CardContent>
          )}
        </Card>

        <Card className="bg-card border-border">
          <CardHeader onClick={() => setShowMarkdown(v => !v)} className="cursor-pointer select-none">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Hash className={iconSizeCls + " text-primary"} />
              <span>Markdown</span>
            </CardTitle>
          </CardHeader>
          {showMarkdown && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size={buttonSize}
                onClick={() => addMarkdown("bold")}
                className="w-full justify-start whitespace-normal leading-tight min-h-[44px]"
              >
                <Bold className={`${iconSizeCls} mr-1`} />
                ** Жирный **
              </Button>
              <Button
                variant="outline"
                size={buttonSize}
                onClick={() => addMarkdown("underline")}
                className="w-full justify-start whitespace-normal leading-tight min-h-[44px]"
              >
                <Italic className={`${iconSizeCls} mr-1`} />
                __ Подчеркнутый __
              </Button>
              <Button
                variant="outline"
                size={buttonSize}
                onClick={() => addMarkdown("code")}
                className="w-full justify-start whitespace-normal leading-tight min-h-[44px]"
              >
                <Code className={`${iconSizeCls} mr-1`} />` Код `
              </Button>
              <Button
                variant="outline"
                size={buttonSize}
                onClick={() => addMarkdown("heading")}
                className="w-full justify-start whitespace-normal leading-tight min-h-[44px]"
              >
                <Heading1 className={`${iconSizeCls} mr-1`} /># Заголовок
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size={buttonSize}
                onClick={() => addMarkdown("separator")}
                className="w-full justify-start whitespace-normal leading-tight min-h-[44px]"
              >
                <Minus className={`${iconSizeCls} mr-1`} />
                --- Разделитель
              </Button>
              <Button variant="outline" size={buttonSize} onClick={removeMarkdown} className="w-full justify-start whitespace-normal leading-tight min-h-[44px]">
                <Settings className={`${iconSizeCls} mr-1`} />
                Убрать Markdown
              </Button>
            </div>
          </CardContent>
          )}
        </Card>
      </div>

      {/* Spacer to avoid overlap with bottom nav */}
      <div className="h-4" />
    </div>
  );
};
