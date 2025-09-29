import React, { useMemo, useState, useEffect } from 'react';

interface NoteStatsProps {
  content: string;
  filePath: string | null;
  debounceMs?: number;
}

interface Stats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
}

const NoteStats: React.FC<NoteStatsProps> = ({ content, filePath, debounceMs = 0 }) => {
  const [debouncedContent, setDebouncedContent] = useState(content);

  // Debounce content updates for performance
  useEffect(() => {
    if (debounceMs === 0) {
      setDebouncedContent(content);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedContent(content);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [content, debounceMs]);

  const stats: Stats = useMemo(() => {
    if (!debouncedContent) {
      return {
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        lines: 0,
        paragraphs: 0
      };
    }

    const characters = debouncedContent.length;
    const charactersNoSpaces = debouncedContent.replace(/\s/g, '').length;
    const words = debouncedContent.trim() ? debouncedContent.trim().split(/\s+/).length : 0;
    const lines = debouncedContent.split('\n').length;
    const paragraphs = debouncedContent.trim() ? debouncedContent.split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0;

    return {
      characters,
      charactersNoSpaces,
      words,
      lines,
      paragraphs
    };
  }, [debouncedContent]);

  if (!filePath) {
    return (
      <div id="note-stats" className="note-stats vt32">
        No file selected
      </div>
    );
  }

  return (
    <div id="note-stats" className="note-stats vt32">
      Char: {stats.characters} Words: {stats.words} Lines: {stats.lines} Para: {stats.paragraphs}
    </div>
  );
};

export default NoteStats;