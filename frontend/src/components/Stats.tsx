import React, { useState, useEffect } from 'react';
import { GetContentDiff } from '../../wailsjs/go/main/App';
import {main} from "../../wailsjs/go/models";
import Diff = main.Diff;

type props = {
  original: string,
  edited: string,
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

  return (
    <div className="note-status-bar vt32">
      {isLoading ? <div>Loading</div> : isError ? <div>Error</div> :
        <div>
          <span className="stat-delta-modified">E: {contentDiff ? contentDiff.edit : 0} </span>
          <span className="stat-delta-positive">A: {contentDiff ? contentDiff.add : 0} </span>
          <span className="stat-delta-negative">D: {contentDiff ? contentDiff.remove : 0} </span>
        </div>
      }
    </div>
  );
};

export default Stats;
