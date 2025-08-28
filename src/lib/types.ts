export type FsNode = {
  name: string;
  path: string; // absolute path from backend
  is_dir: boolean;
  children?: FsNode[];
};

export type ViewMode =
  | "edit"
  | "preview"
  | "split-vertical" // left editor, right preview
  | "split-horizontal" // top editor, bottom preview
  | "stack";
