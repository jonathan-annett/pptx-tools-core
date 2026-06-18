// pptx-tools-core/src/host/logger.ts
//
// Logging seam. The codebase calls a free `log(message)` function from ~481
// sites — those MUST NOT change. Phase 1 only swaps the *sink*: `initLog` used
// to take a `vscode.ExtensionContext` and create an OutputChannel ("Pptx
// Info"); now it takes an injected `LogSink`.
//
// VS Code host sink: append to the "Pptx Info" OutputChannel + console.
// PWA host sink (Phase 3): append to the in-app Output window + console.

export interface LogSink {
  /** Append one already-formatted line. */
  appendLine(line: string): void;
}

let sink: LogSink | null = null;

/** Install the host sink. Call once at host startup. */
export function initLog(s: LogSink): void {
  sink = s;
}

/**
 * The function 481 sites call. Stays signature-compatible. If no sink is
 * installed yet (early startup), falls back to console so nothing is lost.
 */
export function log(message: string): void {
  const line = `[pptx] ${new Date().toISOString()} ${message}`;
  if (sink) sink.appendLine(line);
  else console.log(line);
}

/** Optional: a console-only sink, handy for tests and headless core usage. */
export const consoleSink: LogSink = {
  appendLine: (line) => console.log(line),
};
