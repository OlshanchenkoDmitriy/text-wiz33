import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimization } from "@/hooks/use-mobile-optimization";
import { useAppContext } from "@/hooks/use-app-context";
import { historyAPI, type HistoryRecord } from "@/lib/storage";
import {
  History as HistoryIcon,
  Search,
  Download,
  Trash2,
  Calendar,
  Globe,
  FileText,
  Clock,
  BarChart3,
  List,
  Star,
  StarOff,
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  Users,
  TrendingUp,
  ArrowRight,
  Edit,
  StickyNote,
  Music,
  Copy
} from "lucide-react";

type ViewMode = 'list' | 'timeline' | 'stats';
type SortBy = 'date' | 'size' | 'language';
type GroupBy = 'none' | 'date' | 'language' | 'size';

export const History = () => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState<"all" | "ru" | "en">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "manual" | "auto">("all");
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [groupBy, setGroupBy] = useState<GroupBy>('date');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { transferToEditor, transferToNotes, transferToSuno } = useAppContext();
  const [previewRecord, setPreviewRecord] = useState<HistoryRecord | null>(null);
  const { isMobile } = useMobileOptimization();
  const buttonSize: "sm" | "lg" | "default" = isMobile ? "lg" : "sm";
  const iconSizeCls = isMobile ? "w-5 h-5" : "w-4 h-4";

  // Загружаем историю при монтировании компонента
  useEffect(() => {
    const loadHistory = () => {
      const allRecords = historyAPI.getAll();
      setRecords(allRecords);
    };
    loadHistory();
  }, []);

  const sortRecords = (records: HistoryRecord[]) => {
    return [...records].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'size':
          return b.text.length - a.text.length;
        case 'language':
          return a.language.localeCompare(b.language);
        default:
          return 0;
      }
    });
  };

  const groupRecords = (records: HistoryRecord[]) => {
    if (groupBy === 'none') return { 'Все записи': records };
    
    const groups: { [key: string]: HistoryRecord[] } = {};
    
    records.forEach(record => {
      let groupKey = '';
      switch (groupBy) {
        case 'date':
          groupKey = formatDateGroup(new Date(record.timestamp));
          break;
        case 'language':
          groupKey = record.language === 'ru' ? 'Русский' : 'English';
          break;
        case 'size':
          groupKey = getTextSize(record.text);
          break;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(record);
    });
    
    return groups;
  };

  const getRecordStats = () => {
    const stats = {
      total: records.length,
      russian: records.filter(r => r.language === 'ru').length,
      english: records.filter(r => r.language === 'en').length,
      avgLength: records.length > 0 ? Math.round(records.reduce((sum, r) => sum + r.text.length, 0) / records.length) : 0,
      today: records.filter(r => new Date(r.timestamp).toDateString() === new Date().toDateString()).length
    };
    return stats;
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.text
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesLanguage =
      languageFilter === "all" || record.language === languageFilter;
    const matchesType = typeFilter === "all" || record.type === typeFilter;

    return matchesSearch && matchesLanguage && matchesType;
  });

  const sortedRecords = sortRecords(filteredRecords);
  const groupedRecords = groupRecords(sortedRecords);
  const stats = getRecordStats();

  // Загружаем избранное при монтировании
  useEffect(() => {
    const savedFavorites = localStorage.getItem('history_favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: "Текст скопирован в буфер обмена",
    });
  };

  const deleteRecord = (id: string) => {
    if (historyAPI.delete(id)) {
      setRecords(records.filter((record) => record.id !== id));
      toast({ title: "Удалено", description: "Запись удалена из истории" });
    }
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(filteredRecords, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "linguascribe-history.json";
    link.click();

    URL.revokeObjectURL(url);
    toast({ title: "Экспорт", description: "История экспортирована в файл" });
  };

  const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date as any);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  function formatDateGroup(date: Date) {
    const d = date instanceof Date ? date : new Date(date as any);
    if (isNaN(d.getTime())) return 'Без даты';

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }).format(d);
    }
  }

  function getTextSize(text: string) {
    if (text.length < 100) return 'Короткий';
    if (text.length < 500) return 'Средний';
    if (text.length < 1000) return 'Длинный';
    return 'Очень длинный';
  }

  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
    localStorage.setItem('history_favorites', JSON.stringify(Array.from(newFavorites)));
  };


  const truncateText = (text: string, maxLength: number = 150) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-secondary border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HistoryIcon className="w-5 h-5 text-primary" />
            <span>История записей</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Панель поиска и фильтров */}
          <div className="space-y-4">
            <div className="relative">
              <Search className={`absolute left-3 top-3 text-muted-foreground ${iconSizeCls}`} />
              <Input
                placeholder="Поиск по содержанию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>

            <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide -mx-2 px-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Язык:</span>
                <Badge
                  variant={languageFilter === "all" ? "default" : "outline"}
                  className="cursor-pointer transition-smooth"
                  onClick={() => setLanguageFilter("all")}
                >
                  Все
                </Badge>
                <Badge
                  variant={languageFilter === "ru" ? "default" : "outline"}
                  className="cursor-pointer transition-smooth"
                  onClick={() => setLanguageFilter("ru")}
                >
                  🇷🇺 RU
                </Badge>
                <Badge
                  variant={languageFilter === "en" ? "default" : "outline"}
                  className="cursor-pointer transition-smooth"
                  onClick={() => setLanguageFilter("en")}
                >
                  🇺🇸 EN
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Тип:</span>
                <Badge
                  variant={typeFilter === "all" ? "default" : "outline"}
                  className="cursor-pointer transition-smooth"
                  onClick={() => setTypeFilter("all")}
                >
                  Все
                </Badge>
                <Badge
                  variant={typeFilter === "manual" ? "default" : "outline"}
                  className="cursor-pointer transition-smooth"
                  onClick={() => setTypeFilter("manual")}
                >
                  Текст
                </Badge>
                <Badge
                  variant={typeFilter === "auto" ? "default" : "outline"}
                  className="cursor-pointer transition-smooth"
                  onClick={() => setTypeFilter("auto")}
                >
                  Авто
                </Badge>
              </div>
            </div>

            {/* Режимы просмотра */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide flex-nowrap">
                <span className="text-sm font-medium">Вид:</span>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size={buttonSize}
                  onClick={() => setViewMode('list')}
                  className="text-xs"
                >
                  Список
                </Button>
                <Button
                  variant={viewMode === 'timeline' ? 'default' : 'outline'}
                  size={buttonSize}
                  onClick={() => setViewMode('timeline')}
                  className="text-xs"
                >
                  Лента времени
                </Button>
                <Button
                  variant={viewMode === 'stats' ? 'default' : 'outline'}
                  size={buttonSize}
                  onClick={() => setViewMode('stats')}
                  className="text-xs"
                >
                  Статистика
                </Button>
              </div>
              
              <Button variant="outline" size={buttonSize} onClick={exportHistory}>
                <Download className={`${iconSizeCls} mr-1`} />
                Экспорт
              </Button>
            </div>
            
            {/* Сортировка и группировка */}
            {viewMode !== 'stats' && (
              <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide flex-nowrap -mx-2 px-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Сортировка:</span>
                  <Select
                    value={sortBy}
                    onValueChange={(value) => setSortBy(value as SortBy)}
                  >
                    <SelectTrigger className="text-xs bg-background border border-border rounded px-2 py-1">
                      {sortBy === 'date' ? 'По дате' : sortBy === 'size' ? 'По размеру' : 'По языку'}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">По дате</SelectItem>
                      <SelectItem value="size">По размеру</SelectItem>
                      <SelectItem value="language">По языку</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Группировка:</span>
                  <Select
                    value={groupBy}
                    onValueChange={(value) => setGroupBy(value as GroupBy)}
                  >
                    <SelectTrigger className="text-xs bg-background border border-border rounded px-2 py-1">
                      {groupBy === 'none' ? 'Без группировки' : groupBy === 'date' ? 'По дате' : groupBy === 'language' ? 'По языку' : 'По размеру'}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без группировки</SelectItem>
                      <SelectItem value="date">По дате</SelectItem>
                      <SelectItem value="language">По языку</SelectItem>
                      <SelectItem value="size">По размеру</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Найдено записей: {filteredRecords.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Содержимое в зависимости от режима */}
      {viewMode === 'stats' ? (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Статистика истории</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Всего записей</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{stats.russian}</div>
                <div className="text-sm text-muted-foreground">На русском</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{stats.english}</div>
                <div className="text-sm text-muted-foreground">На английском</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{stats.today}</div>
                <div className="text-sm text-muted-foreground">Сегодня</div>
              </div>
            </div>
            <div className="text-center pt-4 border-t">
              <div className="text-lg font-semibold">Средняя длина: {stats.avgLength} символов</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Записи не найдены</p>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Попробуйте изменить поисковый запрос"
                    : "История пуста"}
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedRecords).map(([groupName, groupRecords]) => (
              <div key={groupName}>
                {groupBy !== 'none' && (
                  <h3 className="text-lg font-semibold mb-3 text-primary">{groupName}</h3>
                )}
                <div className={viewMode === 'timeline' ? 'space-y-2' : 'space-y-4'}>
                  {groupRecords.map((record) => (
                    <Card
                      key={record.id}
                      className={`bg-card border-border hover:shadow-md transition-smooth ${
                        viewMode === 'timeline' ? 'border-l-4 border-l-primary ml-4' : ''
                      }`}
                      onMouseEnter={() => setPreviewRecord(record)}
                      onMouseLeave={() => setPreviewRecord(null)}
                    >
                      <CardContent className={viewMode === 'timeline' ? 'p-3' : 'p-4'}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {record.language === "ru" ? "🇷🇺 RU" : "🇺🇸 EN"}
                            </Badge>
                            <Badge variant="outline">Текст</Badge>
                            <Badge variant="outline" className="text-xs">
                              {record.text.length} симв.
                            </Badge>
                            {favorites.has(record.id) && (
                              <Badge variant="secondary" className="text-xs">
                                ⭐ Избранное
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFavorite(record.id)}
                              className={favorites.has(record.id) ? 'text-yellow-600 bg-yellow-50' : ''}
                            >
                              {favorites.has(record.id) ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(record.text)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRecord(record.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-foreground mb-3 leading-relaxed">
                          {previewRecord?.id === record.id ? record.text : truncateText(record.text)}
                        </p>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(record.timestamp)}
                          </div>
                          {viewMode === 'timeline' && (
                            <div className="text-xs">
                              {getTextSize(record.text)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
