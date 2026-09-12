import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { sendHeartbeat } from '../api/authApi';

export function useHeartbeat() {
  const authUser = useSelector((state) => state.auth?.user);
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
  const lastPingRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated || !authUser) return;

    const ping = async () => {
      const now = Date.now();
      // Rate limit pings to minimum every 10 seconds
      if (now - lastPingRef.current < 10000) return;
      lastPingRef.current = now;
      try {
        await sendHeartbeat();
      } catch (err) {
        // Silently ignore ping errors
      }
    };

    // Immediate ping on mount / auth change
    ping();

    // 30 second regular heartbeat interval
    const interval = setInterval(ping, 30000);

    // Activity listener (window focus / visibility change)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    };

    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', ping);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', ping);
    };
  }, [isAuthenticated, authUser]);
}
