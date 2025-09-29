import { useState, useEffect } from 'react';
import { GetContentDiff } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';

const DIFF_DEBOUNCE_DELAY = 300; // ms

export const useDiffStats = (originalContent: string, currentContent: string) => {
  const [diffResult, setDiffResult] = useState<main.DiffResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    // If contents are identical, return zero diff immediately
    if (originalContent === currentContent) {
      setDiffResult(null);
      setIsCalculating(false);
      return;
    }

    setIsCalculating(true);

    const timer = setTimeout(async () => {
      try {
        const result = await GetContentDiff(originalContent, currentContent);
        setDiffResult(result);
      } catch (error) {
        console.error('Error calculating diff:', error);
        setDiffResult(null);
      } finally {
        setIsCalculating(false);
      }
    }, DIFF_DEBOUNCE_DELAY);

    return () => {
      clearTimeout(timer);
    };
  }, [originalContent, currentContent]);

  return {
    diffResult,
    isCalculating,
  };
};