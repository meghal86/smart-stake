import { useEffect, useMemo, useState } from "react";

const LS_KEY = "alpha/alerts/lastViewedAt";

export type AlertItem = { id: string; ts: string }; // ISO string

export function useAlertsUnread(alerts: AlertItem[]) {
  const [lastViewedAt, setLastViewedAt] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const v = localStorage.getItem(LS_KEY);
    return v ? Number(v) : 0;
  });

  // compute unread by comparing timestamps (server time is ISO)
  const unread = useMemo(() => {
    if (!alerts?.length) return 0;
    return alerts.reduce((n, a) => (new Date(a.ts).getTime() > lastViewedAt ? n + 1 : n), 0);
  }, [alerts, lastViewedAt]);

  // call when user opens the Alerts view/sheet
  function markAlertsViewed() {
    const now = Date.now();
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEY, String(now));
    }
    setLastViewedAt(now);
  }

  return { unread, lastViewedAt, markAlertsViewed };
}