import React, { useState, useEffect } from 'react';
import { GetContentDiff } from '../../wailsjs/go/main/App';

interface DiffResult {
  linesAdded: number;
  linesRemoved: number;
  linesModified: number;
  charsAdded: number;
  charsRemoved: number;
  wordsAdded: number;
  wordsRemoved: number;
  totalLines: number;
  totalChars: number;
  totalWords: number;
}

interface StatsProps {
  originalContent?: string;
  currentContent?: string;
  filePath?: string | null;
}

const Stats: React.FC<StatsProps> = ({ originalContent = '', currentContent = '', filePath }) => {
  const [diffData, setDiffData] = useState<DiffResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!originalContent || !currentContent || originalContent === currentContent) {
      setDiffData(null);
      return;
    }

    const calculateDiff = async () => {
      setIsLoading(true);
      try {
        const result = await GetContentDiff(originalContent, currentContent);
        setDiffData(result);
      } catch (error) {
        console.error('Failed to calculate diff:', error);
        setDiffData(null);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(calculateDiff, 300);
    return () => clearTimeout(debounceTimer);
  }, [originalContent, currentContent]);

  const formatStat = (value: number, label: string, isChange: boolean = false) => {
    if (isChange && value === 0) return null;
    const prefix = isChange && value > 0 ? '+' : '';
    const className = isChange ? (value > 0 ? 'stat-added' : 'stat-removed') : 'stat-total';
    return (
      <span className={`stat-item ${className}`} title={label}>
        {prefix}{value} {label.toLowerCase()}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="note-status-bar vt32">
        <span className="stat-item">Calculating...</span>
      </div>
    );
  }

  if (!diffData) {
    // Show basic current stats when no changes
    const lines = currentContent.split('\n').length;
    const chars = currentContent.length;
    const words = currentContent.trim() === '' ? 0 : currentContent.trim().split(/\s+/).length;

    return (
      <div className="note-status-bar vt32">
        {formatStat(lines, 'Lines')}
        {formatStat(chars, 'Characters')}
        {formatStat(words, 'Words')}
      </div>
    );
  }

  // Show diff stats when changes detected
  const changes = [
    formatStat(diffData.linesAdded, 'Lines', true),
    formatStat(diffData.linesRemoved, 'Lines', true),
    formatStat(diffData.wordsAdded, 'Words', true),
    formatStat(diffData.wordsRemoved, 'Words', true),
    formatStat(diffData.charsAdded, 'Chars', true),
    formatStat(diffData.charsRemoved, 'Chars', true),
  ].filter(Boolean);

  const totals = [
    formatStat(diffData.totalLines, 'Lines'),
    formatStat(diffData.totalChars, 'Chars'),
    formatStat(diffData.totalWords, 'Words'),
  ];

  return (
    <div className="note-status-bar vt32">
      {changes.length > 0 && (
        <>
          <span className="stat-group">
            {changes.slice(0, 3).map((stat, i) => <React.Fragment key={i}>{stat}</React.Fragment>)}
          </span>
          <span className="stat-separator">|</span>
        </>
      )}
      <span className="stat-group">
        {totals.map((stat, i) => <React.Fragment key={i}>{stat}</React.Fragment>)}
      </span>
    </div>
  );
};

export default Stats;
