export interface FileItem {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileItem[];
}

export interface SearchResult {
  path: string;
  name: string;
  isDir: boolean;
  matchType: 'filename' | 'foldername' | 'content';
  matchText: string;
  contextText: string;
}

export type ViewMode = 'editor' | 'reader';
export type ThemeMode = 'system' | 'light' | 'dark';
export type UIThemeMode = 'original' | 'modern' | 'agrume';

