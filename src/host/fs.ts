// pptx-tools-core/src/host/fs.ts
//
// Host-agnostic filesystem seam for the sync engine.
//
// This is the EXTENDED form of the `SyncFs<U>` interface that currently lives
// in `src/sync/executor.ts` of the extension. Phase 1 moves it here and adds
// `readDirectory` + the `FileType` enum (the only raw `vscode.workspace.fs`
// /`vscode.FileType` uses that remain — they live in walker.ts/planner.ts).
//
// The engine never imports `vscode`; it is parameterised over the URI shape
// `U`. The VS Code host binds `U = vscode.Uri`; the PWA host binds `U` to an
// FSA cursor (see pptx-distro-kit/src/host/fsaFs.ts).
//
// NOTE: the original `stat` doc-comment already anticipated this PWA adapter:
//   "The FSA adapter populates size + mtime; M5.2.5 probe verified both are
//    real and stable across browser refresh."
// Keep that contract: `stat` MUST return a real byte size and a real mtime in
// ms-since-epoch, because the URI hash cache uses them to decide whether a
// cached hash is still valid. Returning 0 silently disables the cache.

/**
 * Bitmask matching `vscode.FileType` so the enum carries over unchanged when
 * `walker.ts` is decoupled. Values are deliberately identical to VS Code's.
 */
export const enum FileType {
  Unknown = 0,
  File = 1,
  Directory = 2,
  SymbolicLink = 64,
}

/** A single directory entry, matching the `[name, FileType]` tuple walker consumes. */
export type FsEntry = readonly [name: string, type: FileType];

/** Minimal stat shape the engine relies on (vscode.FileStat subset). */
export interface FsStat {
  /** Size in bytes. Must be real for the hash cache to function. */
  readonly size: number;
  /** Last-modified time, ms since epoch. Must be real and stable across reload. */
  readonly mtime: number;
}

/**
 * Error shape the engine recognises for a missing entry. `delete()` and
 * `stat()` implementations MUST throw something with `.code === 'FileNotFound'`
 * when the target does not exist — the planner/executor branch on it.
 */
export class FileNotFoundError extends Error {
  readonly code = 'FileNotFound' as const;
  constructor(path?: string) {
    super(path ? `FileNotFound: ${path}` : 'FileNotFound');
    this.name = 'FileNotFoundError';
  }
}

export function isFileNotFound(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { code?: unknown }).code === 'FileNotFound';
}

/**
 * The filesystem seam. One implementation per host.
 *
 * `U` is an opaque "URI" the implementation fully owns. The engine only ever
 * obtains a `U` from `joinPath` (starting from a root `U` supplied by the
 * WorkspaceProvider) and passes it back into the other methods — it never
 * inspects `U` internally. This is what lets the PWA use a non-string cursor.
 */
export interface SyncFs<U> {
  /** Resolve a POSIX-style relative path under a root. Implementation owns shape. */
  joinPath(root: U, relPath: string): U;

  /** Cheap metadata lookup for the hash cache. See file header re: real values. */
  stat(uri: U): Promise<FsStat>;

  /** List one directory level. Phase 1 addition (was raw vscode in walker.ts). */
  readDirectory(uri: U): Promise<FsEntry[]>;

  readFile(uri: U): Promise<Uint8Array>;

  writeFile(uri: U, bytes: Uint8Array): Promise<void>;

  /**
   * Move `src` onto `dst`, overwriting `dst`. This is the engine's COMMIT
   * primitive: it writes content to a sibling `<path>.tmp` then calls
   * `rename(tmp, final)` to swap it into place. On hosts without an atomic
   * rename (FSA), this must be emulated — see the PWA adapter — and the
   * orphan-`.tmp` sweep is the recovery mechanism for a crash mid-emulation.
   */
  rename(src: U, dst: U): Promise<void>;

  /** Delete. Throw a `FileNotFound`-coded error if the target is missing. */
  delete(uri: U): Promise<void>;
}
