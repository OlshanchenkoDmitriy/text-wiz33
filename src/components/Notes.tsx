import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimization } from "@/hooks/use-mobile-optimization";
import { useAppContext } from "@/hooks/use-app-context";
import { notesAPI, noteTemplatesAPI, type Note, type NoteTemplate } from "@/lib/storage";
import {
  StickyNote,
  Plus,
  Search,
  Edit,
  Edit3,
  Trash2,
  Save,
  X,
  Download,
  Upload,
  Tag,
  Folder,
  Pin,
  PinOff,
  Palette,
  Filter,
  Star,
  ArrowRight,
  FileText,
  Music,
  Redo,
  Copy,
  Type
} from "lucide-react";

const noteColors = [
  { name: 'Синий', value: '#3b82f6' },
  { name: 'Зеленый', value: '#10b981' },
  { name: 'Красный', value: '#ef4444' },
  { name: 'Желтый', value: '#f59e0b' },
  { name: 'Фиолетовый', value: '#8b5cf6' },
  { name: 'Розовый', value: '#ec4899' },
  { name: 'Серый', value: '#6b7280' }
];

export const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editCategory, setEditCategory] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [fontSize, setFontSize] = useState<number>(16);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { toast } = useToast();
  const { sharedData, clearSharedData, transferToEditor, transferToSuno } = useAppContext();

  // Mobile UI tuning
  const { isMobile } = useMobileOptimization();
  const buttonSize = isMobile ? "lg" : "sm";
  const iconSizeCls = isMobile ? "w-5 h-5" : "w-4 h-4";
  const listMaxH = isMobile ? "max-h-[calc(100vh-18rem)]" : "max-h-[calc(100vh-16rem)]";
  const editorMinH = isMobile ? "min-h-[300px]" : "min-h-[400px]";

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    if (sharedData && sharedData.source !== 'notes') {
      const newNote = {
        title: sharedData.metadata?.title || `Из ${sharedData.source === 'editor' ? 'редактора' : sharedData.source === 'history' ? 'истории' : 'Suno Editor'}`,
        content: sharedData.text,
        tags: sharedData.metadata?.tags || [],
        category: sharedData.metadata?.category || 'Общие',
        color: '#3b82f6',
        isPinned: false
      };
      
      const createdNote = notesAPI.create(newNote);
      loadNotes();
      setSelectedNote(createdNote);
      
      toast({
        title: "Заметка создана",
        description: `Текст перенесен из ${sharedData.source === 'editor' ? 'редактора' : sharedData.source === 'history' ? 'истории' : 'Suno Editor'}`
      });
      clearSharedData();
    }
  }, [sharedData, clearSharedData, toast]);

  const loadNotes = () => {
    const allNotes = notesAPI.getAll();
    const allTemplates = noteTemplatesAPI.getAll();
    setNotes(allNotes);
    setTemplates(allTemplates);
    if (allNotes.length > 0 && !selectedNote) {
      setSelectedNote(allNotes[0]);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === '' || note.category === categoryFilter;
    const matchesTag = tagFilter === '' || note.tags.includes(tagFilter);
    const matchesPinned = !showPinnedOnly || note.isPinned;
    
    return matchesSearch && matchesCategory && matchesTag && matchesPinned;
  });

  const createNewNote = (template?: NoteTemplate) => {
    const newNote = notesAPI.create({
      title: template?.name || "Новая заметка",
      content: template?.content || "",
      tags: template?.tags || [],
      category: template?.category || "Общие",
      color: "#3b82f6",
      isPinned: false
    });
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setIsEditing(true);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
    setEditTags(newNote.tags);
    setEditCategory(newNote.category);
    setEditColor(newNote.color);
    toast({ 
      title: "Создано", 
      description: template ? `Заметка создана из шаблона "${template.name}"` : "Новая заметка создана" 
    });
  };

  const startEditing = () => {
    if (!selectedNote) return;
    setIsEditing(true);
    setEditTitle(selectedNote.title);
    setEditContent(selectedNote.content);
    setEditTags([...selectedNote.tags]);
    setEditCategory(selectedNote.category);
    setEditColor(selectedNote.color);
  };

  const saveNote = () => {
    if (!selectedNote) return;

    const updatedNote = notesAPI.update(selectedNote.id, {
      title: editTitle || "Без названия",
      content: editContent,
      tags: editTags,
      category: editCategory,
      color: editColor
    });

    if (updatedNote) {
      setNotes(
        notes.map((note) => (note.id === selectedNote.id ? updatedNote : note))
      );
      setSelectedNote(updatedNote);
      setIsEditing(false);
      toast({ title: "Сохранено", description: "Заметка обновлена" });
    }
  };

  const deleteNote = (noteId: string) => {
    if (notesAPI.delete(noteId)) {
      setNotes(notes.filter((note) => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(notes.find((note) => note.id !== noteId) || null);
        setIsEditing(false);
      }
      toast({ title: "Удалено", description: "Заметка удалена" });
    }
  };

  const handleContentChange = (content: string) => {
    setEditContent(content);
  };

  const copyToClipboard = () => {
    if (!selectedNote) return;
    navigator.clipboard.writeText(selectedNote.content);
    toast({
      title: "Скопировано",
      description: "Содержимое заметки скопировано",
    });
  };

  const clearContent = () => {
    setEditContent("");
  };

  const togglePin = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    const updatedNote = notesAPI.update(noteId, { isPinned: !note.isPinned });
    if (updatedNote) {
      setNotes(notes.map(n => n.id === noteId ? updatedNote : n));
      if (selectedNote?.id === noteId) {
        setSelectedNote(updatedNote);
      }
      toast({ 
        title: updatedNote.isPinned ? "Закреплено" : "Откреплено", 
        description: `Заметка ${updatedNote.isPinned ? 'закреплена' : 'откреплена'}` 
      });
    }
  };

  const addTag = () => {
    if (!newTagInput.trim() || editTags.includes(newTagInput.trim())) return;
    setEditTags([...editTags, newTagInput.trim()]);
    setNewTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  const getAllCategories = () => {
    const categories = notesAPI.getAllCategories();
    const unique = Array.from(new Set(categories.filter((c) => typeof c === 'string' && c.trim().length > 0)));
    return ['all', ...unique];
  };

  const getAllTags = () => {
    const tags = notesAPI.getAllTags();
    const unique = Array.from(new Set(tags.filter((t) => typeof t === 'string' && t.trim().length > 0)));
    return ['all', ...unique];
  };

  const exportNotes = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `linguascribe-notes-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();

    URL.revokeObjectURL(url);
    toast({ title: "Экспорт", description: "Заметки экспортированы" });
  };

  const importNotes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedNotes = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedNotes)) {
          // Добавляем импортированные заметки
          importedNotes.forEach((note) => {
            notesAPI.create({
              title: note.title || "Импортированная заметка",
              content: note.content || "",
              tags: Array.isArray(note.tags) ? note.tags : [],
              category: typeof note.category === 'string' && note.category.trim() ? note.category : 'Общие',
              color: typeof note.color === 'string' && note.color.trim() ? note.color : '#3b82f6',
              isPinned: Boolean(note.isPinned),
            });
          });

          // Перезагружаем заметки
          const allNotes = notesAPI.getAll();
          setNotes(allNotes);
          toast({
            title: "Импорт",
            description: `${importedNotes.length} заметок импортировано`,
          });
        }
      } catch (error) {
        toast({ title: "Ошибка", description: "Неверный формат файла" });
      }
    };
    reader.readAsText(file);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 lg:h-[calc(100vh-8rem)]">
      {/* Боковая панель с заметками */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="bg-gradient-secondary border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <StickyNote className={`${iconSizeCls} text-primary`} />
                <span>Заметки</span>
              </div>
              <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide flex-nowrap -mx-1 px-1">
                <Button
                  size={buttonSize}
                  variant="outline"
                  onClick={() => setShowTemplates(!showTemplates)}
                  title="Шаблоны"
                >
                  <FileText className={iconSizeCls} />
                </Button>
                <Button
                  size={buttonSize}
                  variant="outline"
                  onClick={exportNotes}
                  title="Экспорт"
                >
                  <Download className={iconSizeCls} />
                </Button>
                <label htmlFor="import-notes" className="cursor-pointer">
                  <Button size={buttonSize} variant="outline" asChild title="Импорт">
                    <span>
                      <Upload className={iconSizeCls} />
                    </span>
                  </Button>
                </label>
                <input
                  id="import-notes"
                  type="file"
                  accept=".json"
                  onChange={importNotes}
                  className="hidden"
                />
                <Button size={buttonSize} onClick={() => createNewNote()}>
                  <Plus className={iconSizeCls} />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              <div className="relative">
                <Search className={`absolute left-3 top-3 text-muted-foreground ${iconSizeCls}`} />
                <Input
                  placeholder="Поиск заметок..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
              
              {/* Фильтры */}
              <div className="flex flex-wrap gap-2">
                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
                  <SelectTrigger className="text-xs bg-background border border-border rounded px-2 py-1 min-w-[10rem]">
                    <SelectValue placeholder="Категория" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllCategories().map((category, idx) => (
                      <SelectItem key={`cat-${idx}-${category}`} value={category}>
                        {category === 'all' ? 'Все категории' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={tagFilter} onValueChange={(v) => setTagFilter(v)}>
                  <SelectTrigger className="text-xs bg-background border border-border rounded px-2 py-1 min-w-[10rem]">
                    <SelectValue placeholder="Тег" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllTags().map((tag, idx) => (
                      <SelectItem key={`tag-${idx}-${tag}`} value={tag}>
                        {tag === 'all' ? 'Все теги' : tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  size={buttonSize}
                  variant={showPinnedOnly ? 'default' : 'outline'}
                  onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                  className="text-xs"
                >
                  <Pin className={`mr-1 ${iconSizeCls}`} />
                  Закрепленные
                </Button>
              </div>
              
              {/* Шаблоны */}
              {showTemplates && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Шаблоны:</div>
                  <div className="grid grid-cols-1 gap-2">
                    {templates.map(template => (
                      <Button
                        key={template.id}
                        variant="outline"
                        size={buttonSize}
                        onClick={() => {
                          createNewNote(template);
                          setShowTemplates(false);
                        }}
                        className="text-xs justify-start"
                      >
                        <FileText className={`${iconSizeCls} mr-2`} />
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className={`space-y-2 ${listMaxH} overflow-y-auto`}>
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className={`cursor-pointer transition-smooth border-border ${
                selectedNote?.id === note.id
                  ? "bg-primary/10 border-primary"
                  : "bg-card hover:bg-secondary/50"
              }`}
              onClick={() => {
                setSelectedNote(note);
                setIsEditing(false);
              }}
            >
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-sm truncate flex-1 mr-2">
                    {note.title}
                  </h3>
                  <Button
                    variant="ghost"
                    size={buttonSize}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className={iconSizeCls} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {note.content.substring(0, 80)}...
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(note.updatedAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Область редактирования */}
      <div className="lg:col-span-2 space-y-4">
        {selectedNote ? (
          <Card className="bg-card border-border h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-lg font-medium bg-transparent border-none p-0 focus:ring-0"
                      placeholder="Название заметки"
                    />
                  ) : (
                    <h2 className="text-lg font-medium">
                      {selectedNote.title}
                    </h2>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size={buttonSize}
                        onClick={() => setIsEditing(false)}
                      >
                        Отмена
                      </Button>
                      <Button size={buttonSize} onClick={saveNote}>
                        <Save className={`${iconSizeCls} mr-1`} />
                        Сохранить
                      </Button>
                    </>
                  ) : (
                    <Button size={buttonSize} onClick={startEditing}>
                      <Edit3 className={`${iconSizeCls} mr-1`} />
                      Редактировать
                    </Button>
                  )}
                </div>
              </div>

              {!isEditing && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Обновлено: {formatDate(selectedNote.updatedAt)}</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className={`flex items-center space-x-2 ml-auto ${isMobile ? 'flex-nowrap overflow-x-auto' : ''}`}>
                <Type className={iconSizeCls} />
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="text-sm bg-background border border-border rounded px-2 py-1"
                >
                  <option value={12}>12px</option>
                  <option value={14}>14px</option>
                  <option value={16}>16px</option>
                  <option value={18}>18px</option>
                  <option value={20}>20px</option>
                </select>
              </div>
              {isEditing ? (
                <Textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Начните вводить текст заметки..."
                  className={`${editorMinH} bg-background/50 border-border resize-none`}
                  style={{ fontSize: `${fontSize}px` }}
                />
              ) : (
                <div
                  className={`${editorMinH} p-4 bg-background/30 rounded-md border border-border whitespace-pre-wrap`}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {selectedNote.content || (
                    <span className="text-muted-foreground italic">
                      Заметка пуста
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border h-full">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <StickyNote className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Выберите заметку</h3>
                <p className="text-muted-foreground">
                  Выберите заметку из списка или создайте новую
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
