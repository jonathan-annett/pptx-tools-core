// pptx-tools-core/src/host/workspace.ts
//
// Host-agnostic "what folders are open + where am I running" seam. Phase 1
// introduces this to absorb topology.ts's direct calls to
// `vscode.workspace.workspaceFolders`, `vscode.workspace.asRelativePath`, and
// the `vscode.dev` host check.
//
// VS Code host: trivially wraps the vscode.workspace.* APIs.
// PWA host (Phase 6): backs roots with persisted FileSystemDirectoryHandles +
// the File System Access permission cache.

import type { SyncFs } from './fs';

/** Permission/availability state of a workspace root (drives PWA reconnect UI). */
export type RootStatus =
  | 'ready'           // permission granted, usable now
  | 'needs-reconnect' // handle persisted but permission is 'prompt'/'denied'; needs a user gesture
  | 'missing';        // handle gone (e.g. cleared storage)

export interface WorkspaceRoot<U> {
  /** Stable id for the slot (used as the IndexedDB key on the PWA). */
  readonly id: string;
  /** Human label (folder name) for chrome/status bar. */
  readonly name: string;
  /** The engine's root URI for this folder, fed into `SyncFs.joinPath`. */
  readonly uri: U;
  readonly status: RootStatus;
}

export interface WorkspaceProvider<U> {
  /** Roots currently known. On the PWA includes `needs-reconnect`/`missing` ones. */
  listRoots(): Promise<ReadonlyArray<WorkspaceRoot<U>>>;

  /** Compute a display-relative path for a uri (was `asRelativePath`). */
  asRelativePath(uri: U): string;

  /** True on browser/web hosts (vscode.dev or the PWA); gates web-only paths. */
  isWebHost(): boolean;

  /**
   * Add a root via the host's folder picker (VS Code: open-folder; PWA:
   * `showDirectoryPicker`). Returns the new root, or null if the user cancels.
   */
  addRoot(): Promise<WorkspaceRoot<U> | null>;

  removeRoot(id: string): Promise<void>;

  /**
   * Restore previously-open roots at startup. On the PWA this reads persisted
   * handles and runs `queryPermission` WITHOUT prompting — roots come back as
   * `ready` or `needs-reconnect`. See Phase 6.
   */
  restore(): Promise<ReadonlyArray<WorkspaceRoot<U>>>;

  /**
   * Re-request permission for a `needs-reconnect` root. MUST be called from a
   * user gesture (FSA `requestPermission` requires user activation). No-op /
   * always-ready on the VS Code host.
   */
  reconnect(id: string): Promise<RootStatus>;

  /** Notify listeners when the root set or a root's status changes. */
  onDidChangeRoots(listener: () => void): { dispose(): void };
}

/** Convenience bundle the engine wiring takes: filesystem + workspace + (later) caches. */
export interface HostFs<U> {
  fs: SyncFs<U>;
  workspace: WorkspaceProvider<U>;
}
