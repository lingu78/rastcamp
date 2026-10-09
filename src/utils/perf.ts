/**
 * Start-up timing markers (spec §7: cold start to interactive map < 3 s). Written to the
 * device log only (logcat / Xcode console) – nothing leaves the phone. The Android
 * emulator smoke test collects them and measures from the activity start in logcat.
 */
const marked = new Set<string>();

// performance.now() counts from device boot on Android, so log time since this module
// was first evaluated (≈ JS bundle start) instead.
const jsStart = globalThis.performance?.now?.();

export function markPerf(label: string): void {
  if (process.env.NODE_ENV === 'test' || marked.has(label)) return;
  marked.add(label);
  const now = globalThis.performance?.now?.();
  if (typeof now === 'number' && typeof jsStart === 'number') {
    console.log(`[perf] ${label} +${Math.round(now - jsStart)} ms after JS start`);
  }
}
