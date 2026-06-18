// pptx-tools-core/src/host/index.ts
//
// The host-shell contract. Each host (VS Code extension, PWA) implements these
// against its platform; the engine and views in pptx-tools-core depend ONLY on
// these interfaces, never on a concrete host.

export {
  FileType,
  FileNotFoundError,
  isFileNotFound,
} from './fs';
export type { SyncFs, FsEntry, FsStat } from './fs';

export type {
  WorkspaceProvider,
  WorkspaceRoot,
  RootStatus,
  HostFs,
} from './workspace';

export { initLog, log, consoleSink } from './logger';
export type { LogSink } from './logger';
