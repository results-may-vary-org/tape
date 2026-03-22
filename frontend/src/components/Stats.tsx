import { useState, useEffect } from "react";
import { GetContentDiff, GetDecryptedFileName, GetDecryptedFullPath } from "../../wailsjs/go/main/App";
import {main} from "../../wailsjs/go/models";
import {Bug, CircleCheck, Loader, CassetteTape, CircleAlert, ShieldCheck} from "lucide-react";
import Diff = main.Diff;
import { Tooltip } from "@radix-ui/themes";

type props = {
  original: string
  edited: string
  selectedFilePath: string | null
  hasUnsavedChanges: boolean
  isVaultSecured: boolean
}

const Stats = (props: props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [contentDiff, setContentDiff] = useState<Diff | null>(null);
   // not ideal but the simplest since i need to handle promise to get it
  const [filename, setFilename] = useState<string>("");
  const [smallFilename, setSmallFilename] = useState<string>("");

  useEffect(() => {
    if (!props.selectedFilePath) return;

    const loadFileName = async () => {
      if (!props.selectedFilePath) return;
      const name = await getFileName();
      const smallName = await getFileName(1);
      setFilename(name);
      setSmallFilename(smallName);
    };

    loadFileName();
  }, [props.selectedFilePath]);

  // get the content diff
  useEffect(() => {
    GetContentDiff(props.original, props.edited)
      .then((diff: Diff) => {
        setIsError(false);
        setContentDiff(diff)
      })
      .catch((e) => {
        setIsError(true);
        console.error(e)
      })
      .finally(() => setIsLoading(false))
  }, [props.original, props.edited]);

  const getFileName = async (trunc = 3): Promise<string> => {
    if (!props.selectedFilePath) return "";
    return GetDecryptedFullPath(props.selectedFilePath, trunc);
  }

  // get the cd string we want to show
  const getContentDiffString = () => {
    const e = contentDiff ? contentDiff.edit : 0;
    const a = contentDiff ? contentDiff.add : 0;
    const d = contentDiff ? contentDiff.remove : 0;
    const has = e > 0 || a > 0 || d > 0;
    return { has, e, a, d };
  }

  return (
    <div className="note-status-bar vt32">

      <div className="stat-container">
        {props.isVaultSecured && (
          <div className="stat-icon">
            <Tooltip content="Vault is encrypted">
              <ShieldCheck size="14"/>
            </Tooltip>
          </div>
        )}
        <div className="stat-icon">
          <Tooltip content={`Edit: ${getContentDiffString().e}, Add: ${getContentDiffString().a}, Delete: ${getContentDiffString().d}`}>
            {isLoading ? <Loader className="spin-fast" size="14"/> : isError ? <Bug size="14"/> : <CircleCheck size="14"/>}
          </Tooltip>
        </div>

        <div className="stat-text">
          <span className="stat-delta-modified">E: {getContentDiffString().e} </span>
          <span className="stat-delta-positive">A: {getContentDiffString().a} </span>
          <span className="stat-delta-negative">D: {getContentDiffString().d} </span>
        </div>

        <div className="stat-text-small">
          <Tooltip content="Edited">
            <span className="stat-delta-modified">{getContentDiffString().e}</span>
          </Tooltip>
          <Tooltip content="Added">
            <span className="stat-delta-positive">{getContentDiffString().a}</span>
          </Tooltip>
          <Tooltip content="Removed">
            <span className="stat-delta-negative">{getContentDiffString().d}</span>
          </Tooltip>
        </div>

      </div>

      <div className="file-container">
        <div className="stat-icon">
          <Tooltip content={filename}>
            <CassetteTape size="14"/>
          </Tooltip>
        </div>

        <div className="file-info stat-text">
          {props.selectedFilePath ? (
            <span className="current-file">
              {filename}
            </span>
          ) : <span className="current-file">no tape selected</span>}
        </div>

        <div className="file-info stat-text-small">
          {props.selectedFilePath ? (
            <span className="current-file">
              {smallFilename}
            </span>
          ) : <Tooltip content="No tape selected"><span className="current-file">nts</span></Tooltip>}
        </div>
      </div>

      {/* fixme: should find  a better diff since we need to use getCD for certain case */}
      {/* use case: 123456789 > save > 123456788 > save > 123456787 is marked has not edited */}
      {(props.hasUnsavedChanges || getContentDiffString().has) && (
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
      )}
    </div>
  );
};

export default Stats;
