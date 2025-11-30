import React, { useState, useEffect } from "react";
import { GetContentDiff } from "../../wailsjs/go/main/App";
import {main} from "../../wailsjs/go/models";
import Diff = main.Diff;
import {Bug, CircleCheck, Loader, CassetteTape} from "lucide-react";

type props = {
  original: string
  edited: string
  selectedFilePath: string | null
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

  const getFileName = (): string => {
    if (!props.selectedFilePath) return "";
    let join = "/";

    let partArray = props.selectedFilePath.split('/');
    // it's likely a windows path, todo: check with go wich os we use?
    if (partArray.length === 1) {
      join = "\\";
      partArray = props.selectedFilePath.split('\\');
    }
    
    return partArray.slice(-3).join(join);
  }

  return (
    <div className="note-status-bar vt32">

      <div className="stat-icon">
        {isLoading ? <Loader className="spin-fast" size="14"/> : isError ? <Bug size="14"/> : <CircleCheck size="14"/>}
      </div>
      
      <div className="stat-text">
        <span className="stat-delta-modified">E: {contentDiff ? contentDiff.edit : 0} </span>
        <span className="stat-delta-positive">A: {contentDiff ? contentDiff.add : 0} </span>
        <span className="stat-delta-negative">D: {contentDiff ? contentDiff.remove : 0} </span>
      </div>

      <div className="stat-icon">
        <CassetteTape size="14"/>
      </div>

      <div className="file-info stat-text">
        {props.selectedFilePath && props.selectedFilePath.split('/').pop() ? (
          <span className="current-file">
            {getFileName()}
          </span>
        ) : <span className="current-file">no tape selected</span>}
      </div>

    </div>
  );
};

export default Stats;
