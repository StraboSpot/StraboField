// Pure sync-conflict detection rules, extracted from useDownload so the timestamp comparison logic can
// be reasoned about and tested in isolation. These functions take raw values (no store / network / RNFS
// access) and return a classification; the hooks own the I/O and dispatching.

export const DATASET_STATUS = {IN_SYNC: 'in-sync', CONFLICT: 'conflict', PULL: 'pull'};

// A server copy has "moved off base" when its timestamp differs from the base (the server timestamp our
// local copy last synced from). Comparing to the base—rather than a plain > check—catches both edit
// orderings and tolerates clock skew. Falls back to the old > check when no base is recorded yet
// (e.g. right after upgrade), treating a missing local copy as moved.
export const hasServerMovedFromBase = (serverTimestamp, base, localTimestamp) => {
  if (base != null) return serverTimestamp !== base;
  return localTimestamp == null || serverTimestamp > localTimestamp;
};

// Route one server dataset: a moved server copy with a pending local edit is a conflict; a moved server
// copy with no pending edit is a safe pull; otherwise it's in sync.
export const classifyDatasetChange = ({serverTimestamp, base, localTimestamp, isPendingLocalEdit}) => {
  const serverMovedFromBase = hasServerMovedFromBase(serverTimestamp, base, localTimestamp);
  if (!serverMovedFromBase) return {serverMovedFromBase, status: DATASET_STATUS.IN_SYNC};
  return {serverMovedFromBase, status: isPendingLocalEdit ? DATASET_STATUS.CONFLICT : DATASET_STATUS.PULL};
};

// Route the server's project copy, mirroring classifyDatasetChange: a moved server copy with a pending
// local project edit is a conflict. serverMovedFromBase is returned separately because the caller decides
// push/pull/prompt with it—a project bump driven by dataset edits shouldn't prompt its own conflict.
export const classifyProjectChange = ({serverTimestamp, base, localTimestamp, isPendingLocalEdit}) => {
  const serverMovedFromBase = hasServerMovedFromBase(serverTimestamp, base, localTimestamp);
  return {serverMovedFromBase, isConflict: serverMovedFromBase && isPendingLocalEdit};
};
