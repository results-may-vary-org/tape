import React, { useState, useEffect, useRef } from 'react';
import {Dialog, TextField, Text, Flex, Separator} from '@radix-ui/themes';
import {FileText, Folder, AlertCircle, SearchIcon} from 'lucide-react';

interface SearchResult {
  path: string;
  name: string;
  isDir: boolean;
  matchType: 'filename' | 'foldername' | 'content';
  matchText: string;
  contextText: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (filePath: string) => void;
  onSearch: (query: string) => Promise<SearchResult[]>;
}

type resultLength = {
  d: string
  f: string
  s: string
}

const SearchModal: React.FC<SearchModalProps> = ({isOpen,  onClose, onFileSelect, onSearch}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number>();

  // Autofocus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (query.trim() === '') {
      setResults([]);
      setIsLoading(false);
      setSelectedIndex(0);
      return;
    }

    setIsLoading(true);

    debounceRef.current = window.setTimeout(async () => {
      try {
        const searchResults = await onSearch(query);
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, onSearch]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex] && !results[selectedIndex].isDir) {
            onFileSelect(results[selectedIndex].path);
            onClose();
          }
          break;
        case 'Tab':
          e.preventDefault();
          // Tab between input and results
          if (document.activeElement === inputRef.current && results.length > 0) {
            // Focus first result
            const firstResult = resultsRef.current?.querySelector('[data-result-index="0"]') as HTMLElement;
            firstResult?.focus();
          } else {
            // Focus input
            inputRef.current?.focus();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, onFileSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-result-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleResultClick = (result: SearchResult) => {
    if (!result.isDir) {
      onFileSelect(result.path);
      onClose();
    }
  };

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'filename':
        return <FileText size={16} />;
      case 'foldername':
        return <Folder size={16} />;
      case 'content':
        return <FileText size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'filename':
        return 'File name';
      case 'foldername':
        return 'Folder name';
      case 'content':
        return 'Content';
      default:
        return 'Unknown';
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? <mark key={index} className="search-highlight">{part}</mark> : part
    );
  };

  const getResultLength = (): resultLength => {
    if (results) {
      return {
        d: results.filter((value) => value.isDir).length.toString(),
        f: results.filter((value) => value.matchType === "filename").length.toString(),
        s: results.filter((value) => value.matchType === "content").length.toString()
      };
    }
    return { d: "0", f: "0", s: "0" };
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content className="search-modal" maxWidth="600px">

        <Dialog.Title style={{fontFamily: "vt32"}}>Search</Dialog.Title>

        <Dialog.Description size="2" mb="4" className="vt32">
          On files, folders, and content.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <TextField.Root
            ref={inputRef}
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="your query"
            className="search-input"
            size="3"
          >
            <TextField.Slot>
              <SearchIcon height="16" width="16" />
            </TextField.Slot>
          </TextField.Root>
          <div id="search-info" className="vt32">
            Folder: {getResultLength().d} File: {getResultLength().f} String: {getResultLength().s}
          </div>
          <Separator style={{width: "100%"}}/>
        </Flex>

        <div>

          <div className="search-results vt32" ref={resultsRef}>

            {(!results || results.length === 0) && (
              <div className="no-results">
                <Text size="2" color="gray">
                  {isLoading ? "Searching" : "Search something amazing"}
                </Text>
              </div>
            )}

            {results && results.length > 0 && results.map((result, index) => (
              <div
                key={`${result.path}-${index}`}
                data-result-index={index}
                className={`search-result-item ${result.isDir ? 'disabled' : ''} ${selectedIndex === index ? 'selected' : ''}`}
                onClick={() => handleResultClick(result)}
                tabIndex={-1}
              >
                <div className="search-result-item-header">
                  <div className="search-result-item-target">
                    {getMatchTypeIcon(result.matchType)}
                    <div>
                      {highlightMatch(result.name, query)}
                    </div>
                  </div>
                  <div className="search-result-item-type">
                    {getMatchTypeLabel(result.matchType)}
                  </div>
                </div>
                <div className="search-result-item-context">
                  {result.contextText && (
                    <span className="result-context">
                    {highlightMatch(result.contextText, query)}
                  </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="search-footer vt32">
            <Text size="1" color="gray">
              Press ↑↓ to navigate, Enter to open, Tab to switch, Esc to close
            </Text>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default SearchModal;
