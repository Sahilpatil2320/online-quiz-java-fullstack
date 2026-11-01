import { useEffect, useState } from 'react';

/**
 * Remaining milliseconds until `deadlineIso` (null until the first tick).
 * The server sends its own clock (`serverTimeIso`), so a wrong clock on the student's computer
 * cannot change the timer. The value is recomputed from absolute time on every tick, so it stays
 * correct even if the browser tab was in the background and timers were throttled.
 */
export default function useCountdown(deadlineIso, serverTimeIso) {
  const [remainingMs, setRemainingMs] = useState(null);

  useEffect(() => {
    if (!deadlineIso) return undefined;
    const serverNow = serverTimeIso ? new Date(serverTimeIso).getTime() : Date.now();
    const offset = serverNow - Date.now();
    const deadline = new Date(deadlineIso).getTime();
    // Rounded up to whole seconds so React re-renders once per second (0 only when time is really up).
    const tick = () => setRemainingMs(Math.ceil(Math.max(0, deadline - (Date.now() + offset)) / 1000) * 1000);
    tick();
    const id = setInterval(tick, 250);
    const onVisible = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [deadlineIso, serverTimeIso]);

  return remainingMs;
}
