// Локальное хранилище данных для личного использования

// Типы данных
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  color: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryRecord {
  id: string;
  text: string;
  language: "ru" | "en";
  timestamp: Date;
  type: "manual";
}

export interface SunoSong {
  id: string;
  title: string;
  artist: string;
  lyrics: string;
  createdAt: Date;
  updatedAt: Date;
}

// Ключи для localStorage
const STORAGE_KEYS = {
  NOTES: 'linguascribe_notes',
  HISTORY: 'linguascribe_history',
  SONGS: 'linguascribe_songs',
  SETTINGS: 'linguascribe_settings',
  NOTE_TEMPLATES: 'linguascribe_note_templates'
} as const;

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
}

export const noteTemplatesAPI = {
  getAll: (): NoteTemplate[] => {
    return getFromStorage<NoteTemplate[]>(STORAGE_KEYS.NOTE_TEMPLATES, [
      {
        id: '1',
        name: 'Встреча',
        description: 'Шаблон для записи встреч',
        content: '# Встреча\n\n**Дата:** \n**Участники:** \n**Цель:** \n\n## Повестка дня\n- \n\n## Обсуждение\n\n## Решения\n\n## Следующие шаги\n- [ ] ',
        category: 'Работа',
        tags: ['встреча', 'работа']
      },
      {
        id: '2',
        name: 'Идея',
        description: 'Шаблон для записи идей',
        content: '# Идея\n\n**Описание:** \n\n**Проблема:** \n\n**Решение:** \n\n**Преимущества:** \n- \n\n**Недостатки:** \n- \n\n**Следующие шаги:** \n- [ ] ',
        category: 'Идеи',
        tags: ['идея', 'творчество']
      },
      {
        id: '3',
        name: 'Задача',
        description: 'Шаблон для постановки задач',
        content: '# Задача\n\n**Описание:** \n\n**Приоритет:** \n\n**Дедлайн:** \n\n**Ресурсы:** \n- \n\n**Подзадачи:** \n- [ ] \n- [ ] \n- [ ] \n\n**Заметки:** ',
        category: 'Задачи',
        tags: ['задача', 'планирование']
      }
    ]);
  },

  create: (template: Omit<NoteTemplate, 'id'>): NoteTemplate => {
    const templates = noteTemplatesAPI.getAll();
    const newTemplate: NoteTemplate = {
      ...template,
      id: Date.now().toString()
    };
    templates.push(newTemplate);
    saveToStorage(STORAGE_KEYS.NOTE_TEMPLATES, templates);
    return newTemplate;
  },

  delete: (id: string): boolean => {
    const templates = noteTemplatesAPI.getAll();
    const filteredTemplates = templates.filter(template => template.id !== id);
    if (filteredTemplates.length === templates.length) return false;
    
    saveToStorage(STORAGE_KEYS.NOTE_TEMPLATES, filteredTemplates);
    return true;
  }
};

// Утилиты для работы с датами
const serializeDate = (date: Date): string => date.toISOString();
const deserializeDate = (dateStr: string): Date => new Date(dateStr);

// Базовые функции для работы с localStorage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
};

// API для заметок
export const notesAPI = {
  getAll: (): Note[] => {
    const notes = getFromStorage<Note[]>(STORAGE_KEYS.NOTES, []);
    return notes.map(note => ({
      ...note,
      createdAt: deserializeDate(note.createdAt as any),
      updatedAt: deserializeDate(note.updatedAt as any)
    }));
  },

  create: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const notes = notesAPI.getAll();
    const newNote: Note = {
      ...note,
      id: Date.now().toString(),
      tags: note.tags || [],
      category: note.category || 'Общие',
      color: note.color || '#3b82f6',
      isPinned: note.isPinned || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    notes.unshift(newNote);
    saveToStorage(STORAGE_KEYS.NOTES, notes);
    return newNote;
  },

  update: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Note | null => {
    const notes = notesAPI.getAll();
    const index = notes.findIndex(note => note.id === id);
    if (index === -1) return null;

    notes[index] = {
      ...notes[index],
      ...updates,
      updatedAt: new Date()
    };
    saveToStorage(STORAGE_KEYS.NOTES, notes);
    return notes[index];
  },

  delete: (id: string): boolean => {
    const notes = notesAPI.getAll();
    const filteredNotes = notes.filter(note => note.id !== id);
    if (filteredNotes.length === notes.length) return false;
    
    saveToStorage(STORAGE_KEYS.NOTES, filteredNotes);
    return true;
  },

  search: (query: string): Note[] => {
    const notes = notesAPI.getAll();
    const lowerQuery = query.toLowerCase();
    return notes.filter(note => 
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      note.category.toLowerCase().includes(lowerQuery)
    );
  },

  getByCategory: (category: string): Note[] => {
    const notes = notesAPI.getAll();
    return notes.filter(note => note.category === category);
  },

  getByTag: (tag: string): Note[] => {
    const notes = notesAPI.getAll();
    return notes.filter(note => note.tags.includes(tag));
  },

  getAllCategories: (): string[] => {
    const notes = notesAPI.getAll();
    const categories = new Set(notes.map(note => note.category));
    return Array.from(categories).sort();
  },

  getAllTags: (): string[] => {
    const notes = notesAPI.getAll();
    const tags = new Set(notes.flatMap(note => note.tags));
    return Array.from(tags).sort();
  },

  getPinned: (): Note[] => {
    const notes = notesAPI.getAll();
    return notes.filter(note => note.isPinned);
  }
};

// API для истории
export const historyAPI = {
  getAll: (): HistoryRecord[] => {
    const history = getFromStorage<HistoryRecord[]>(STORAGE_KEYS.HISTORY, []);
    return history.map(record => ({
      ...record,
      timestamp: deserializeDate(record.timestamp as any)
    }));
  },

  add: (record: Omit<HistoryRecord, 'id' | 'timestamp'>): HistoryRecord => {
    const history = historyAPI.getAll();
    const newRecord: HistoryRecord = {
      ...record,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    // Ограничиваем историю 1000 записями
    if (history.length >= 1000) {
      history.pop();
    }
    
    history.unshift(newRecord);
    saveToStorage(STORAGE_KEYS.HISTORY, history);
    return newRecord;
  },

  delete: (id: string): boolean => {
    const history = historyAPI.getAll();
    const filteredHistory = history.filter(record => record.id !== id);
    if (filteredHistory.length === history.length) return false;
    
    saveToStorage(STORAGE_KEYS.HISTORY, filteredHistory);
    return true;
  },

  clear: (): void => {
    saveToStorage(STORAGE_KEYS.HISTORY, []);
  },

  filter: (language?: "ru" | "en", type?: "manual"): HistoryRecord[] => {
    const history = historyAPI.getAll();
    return history.filter(record => {
      const matchesLanguage = !language || record.language === language;
      const matchesType = !type || record.type === type;
      return matchesLanguage && matchesType;
    });
  }
};

// API для песен Suno
export const songsAPI = {
  getAll: (): SunoSong[] => {
    const songs = getFromStorage<SunoSong[]>(STORAGE_KEYS.SONGS, []);
    return songs.map(song => ({
      ...song,
      createdAt: deserializeDate(song.createdAt as any),
      updatedAt: deserializeDate(song.updatedAt as any)
    }));
  },

  create: (song: Omit<SunoSong, 'id' | 'createdAt' | 'updatedAt'>): SunoSong => {
    const songs = songsAPI.getAll();
    const newSong: SunoSong = {
      ...song,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    songs.unshift(newSong);
    saveToStorage(STORAGE_KEYS.SONGS, songs);
    return newSong;
  },

  update: (id: string, updates: Partial<Omit<SunoSong, 'id' | 'createdAt'>>): SunoSong | null => {
    const songs = songsAPI.getAll();
    const index = songs.findIndex(song => song.id === id);
    if (index === -1) return null;

    songs[index] = {
      ...songs[index],
      ...updates,
      updatedAt: new Date()
    };
    saveToStorage(STORAGE_KEYS.SONGS, songs);
    return songs[index];
  },

  delete: (id: string): boolean => {
    const songs = songsAPI.getAll();
    const filteredSongs = songs.filter(song => song.id !== id);
    if (filteredSongs.length === songs.length) return false;
    
    saveToStorage(STORAGE_KEYS.SONGS, filteredSongs);
    return true;
  }
};

// API для настроек
export interface AppSettings {
  fontSize: number;
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  maxHistoryItems: number;
}

export const settingsAPI = {
  get: (): AppSettings => {
    return getFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, {
      fontSize: 14,
      theme: 'auto',
      autoSave: true,
      maxHistoryItems: 1000
    });
  },

  update: (updates: Partial<AppSettings>): AppSettings => {
    const current = settingsAPI.get();
    const updated = { ...current, ...updates };
    saveToStorage(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }
};

// Функция для экспорта всех данных
export const exportAllData = (): string => {
  const data = {
    notes: notesAPI.getAll(),
    history: historyAPI.getAll(),
    songs: songsAPI.getAll(),
    settings: settingsAPI.get(),
    exportDate: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
};

// Функция для импорта данных
export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.notes) saveToStorage(STORAGE_KEYS.NOTES, data.notes);
    if (data.history) saveToStorage(STORAGE_KEYS.HISTORY, data.history);
    if (data.songs) saveToStorage(STORAGE_KEYS.SONGS, data.songs);
    if (data.settings) saveToStorage(STORAGE_KEYS.SETTINGS, data.settings);
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}; 