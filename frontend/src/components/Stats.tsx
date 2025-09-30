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
  const [contentDiff, setContentDiff] = useState({});

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
      {isError ? (<div>Error</div>) : null}
      {isLoading ? (<div>Loading</div>) : JSON.stringify(contentDiff)}
    </div>
  );
};

export default Stats;
