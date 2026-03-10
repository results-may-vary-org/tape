import { useState, useEffect, Fragment } from "react";
import { GetContentDiff, GetOs } from "../../wailsjs/go/main/App";
import {main} from "../../wailsjs/go/models";
import {Bug, CircleCheck, Loader, CassetteTape, CircleAlert} from "lucide-react";
import Diff = main.Diff;
import { Tooltip } from "@radix-ui/themes";

type props = {
  original: string
  edited: string
  selectedFilePath: string | null
  hasUnsavedChanges: boolean
}

const Stats = (props: props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [contentDiff, setContentDiff] = useState<Diff | null>(null);

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

  const getFileName = (trunc = false): string => {

    if (!props.selectedFilePath) return "";
    let join = "/";
    let partArray = props.selectedFilePath.split("/");

    GetOs().then((os) => {
      if (os === "windows" && props.selectedFilePath) {
        join = "\\";
        partArray = props.selectedFilePath.split('\\');
      }
    })

    var text = partArray.slice(-3).join(join);
    if (trunc) {
      text = text.substring(text.lastIndexOf(join)+1);
    }
    return text;
  }

  const getCD = () => {
    const e = contentDiff ? contentDiff.edit : 0;
    const a = contentDiff ? contentDiff.add : 0;
    const d = contentDiff ? contentDiff.remove : 0;
    const has = e > 0 || a > 0 || d > 0;
    return { has, e, a, d };
  }

  return (
    <div className="note-status-bar vt32">

      <div className="stat-container">
        <div className="stat-icon">
          <Tooltip content={`Edit: ${getCD().e}, Add: ${getCD().a}, Delete: ${getCD().d}`}>
            {isLoading ? <Loader className="spin-fast" size="14"/> : isError ? <Bug size="14"/> : <CircleCheck size="14"/>}
          </Tooltip>
        </div>

        <div className="stat-text">
          <span className="stat-delta-modified">E: {getCD().e} </span>
          <span className="stat-delta-positive">A: {getCD().a} </span>
          <span className="stat-delta-negative">D: {getCD().d} </span>
        </div>

        <div className="stat-text-small">
          <Tooltip content="Edited">
            <span className="stat-delta-modified">{getCD().e}</span>
          </Tooltip>
          <Tooltip content="Added">
            <span className="stat-delta-positive">{getCD().a}</span>
          </Tooltip>
          <Tooltip content="Removed">
            <span className="stat-delta-negative">{getCD().d}</span>
          </Tooltip>
        </div>

      </div>

      <div className="file-container">
        <div className="stat-icon">
          <Tooltip content={getFileName()}>
            <CassetteTape size="14"/>
          </Tooltip>
        </div>

        <div className="file-info stat-text">
          {props.selectedFilePath && props.selectedFilePath.split('/').pop() ? (
            <span className="current-file">
              {getFileName()}
            </span>
          ) : <span className="current-file">no tape selected</span>}
        </div>

        <div className="file-info stat-text-small">
          {props.selectedFilePath && props.selectedFilePath.split('/').pop() ? (
            <span className="current-file">
              {getFileName(true)}
            </span>
          ) : <Tooltip content="No tape selected"><span className="current-file">nts</span></Tooltip>}
        </div>
      </div>

      {/* fixme: should find  a better diff since we need to use getCD for certain case */}
      {/* use case: 123456789 > save > 123456788 > save > 123456787 is marked has not edited */}
      {(props.hasUnsavedChanges || getCD().has) && (
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
