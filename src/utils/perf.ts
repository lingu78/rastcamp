/**
 * Start-up timing markers (spec §7: cold start to interactive map < 3 s). Written to the
 * device log only (logcat / Xcode console) – nothing leaves the phone. The Android
 * emulator smoke test collects them.
 */
const marked = new Set<string>();

export function markPerf(label: string): void {
  if (process.env.NODE_ENV === 'test' || marked.has(label)) return;
  marked.add(label);
  const now = globalThis.performance?.now?.();
  if (typeof now === 'number') console.log(`[perf] ${label} ${Math.round(now)} ms`);
}
