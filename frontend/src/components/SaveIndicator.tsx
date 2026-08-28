import { useEffect, useState } from "react";
import { GetContentDiff } from "../../wailsjs/go/main/App";
import { main } from "../../wailsjs/go/models";
import { Check, CircleAlert } from "lucide-react";
import { Tooltip } from "@radix-ui/themes";
import Diff = main.Diff;

type SaveIndicatorProps = {
  original: string
  edited: string
  hasUnsavedChanges: boolean
  // render the "Unsaved file / Not saved" labels like the bottom bar
  showText?: boolean
  // render the green check when everything is saved (top bar)
  showSavedState?: boolean
}

const hasContentDiff = (diff: Diff | null): boolean => {
  const e = diff?.edit ?? 0;
  const a = diff?.add ?? 0;
  const d = diff?.remove ?? 0;
  return e > 0 || a > 0 || d > 0;
};

// fixme: should find a better diff since we need to use getCD for certain case
// use case: 123456789 > save > 123456788 > save > 123456787 is marked has not edited
const SaveIndicator = ({ original, edited, hasUnsavedChanges, showText = false, showSavedState = false }: SaveIndicatorProps) => {
  const [contentDiff, setContentDiff] = useState<Diff | null>(null);

  // compute the real content diff so the "not saved" state also catches edits
  // that the hasUnsavedChanges flag misses
  useEffect(() => {
    GetContentDiff(original, edited)
      .then(setContentDiff)
      .catch((e) => {
        console.error(e);
        setContentDiff(null);
      });
  }, [original, edited]);

  const isUnsaved = hasUnsavedChanges || hasContentDiff(contentDiff);

  if (!isUnsaved && !showSavedState) return null;

  if (showText) {
    return (
      <div className="save-container">
        <div className="stat-icon stat-save">
          <Tooltip content="Unsaved file">
            <CircleAlert size="14"/>
          </Tooltip>
        </div>
        <div className="stat-text stat-save">
          Unsaved file
        </div>
        <div className="stat-text-small stat-save">
          Not saved
        </div>
      </div>
    );
  }

  return (
    <Tooltip content={isUnsaved ? "Unsaved changes" : "All changes saved"}>
      <div className={`save-indicator ${isUnsaved ? "dirty" : ""}`}>
        {isUnsaved ? <CircleAlert size={13}/> : <Check size={13}/>}
      </div>
    </Tooltip>
  );
};

export default SaveIndicator;