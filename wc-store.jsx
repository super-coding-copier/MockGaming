// Auth + per-user state via REST API → data.json. Simulates a multi-user backend.
(function () {
  const { useState, useEffect, useCallback } = React;

  const API_BASE = window.WC_API_BASE || '';
  const API = API_BASE + '/api';
  const SESSION_KEY = 'wc_session_v1';

  async function api(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API + path, opts);
    return res.json();
  }

  function useAuth() {
    const [db, setDb] = useState(null);       // null = 未加载
    const [session, setSession] = useState(() => {
      try { return localStorage.getItem(SESSION_KEY) || null; } catch (e) { return null; }
    });

    // 初始化：从服务端拉取全量数据
    useEffect(() => {
      (async () => {
        try {
          const data = await api('GET', '/state');
          setDb(data.users || {});
        } catch (e) {
          console.error('加载数据失败', e);
          setDb({});
        }
      })();
    }, []);

    const login = useCallback(async (u, pwd) => {
      const r = await api('POST', '/login', { u, pwd });
      if (r.ok) {
        setSession(u.trim().toLowerCase());
        try { localStorage.setItem(SESSION_KEY, u.trim().toLowerCase()); } catch (e) {}
        // 刷新本地数据
        const data = await api('GET', '/state');
        setDb(data.users || {});
      }
      return r;
    }, []);

    const register = useCallback(async (name, u, pwd) => {
      const r = await api('POST', '/register', { name, u, pwd });
      if (r.ok) {
        const key = u.trim().toLowerCase();
        setSession(key);
        try { localStorage.setItem(SESSION_KEY, key); } catch (e) {}
        const data = await api('GET', '/state');
        setDb(data.users || {});
      }
      return r;
    }, []);

    const logout = useCallback(() => {
      setSession(null);
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    }, []);

    const placeBet = useCallback(async (bet) => {
      if (!session) return;
      const r = await api('POST', '/bet', { u: session, bet });
      if (r.ok) {
        // 刷新本地数据
        const data = await api('GET', '/state');
        setDb(data.users || {});
      }
      return r;
    }, [session]);

    const ready = db !== null;
    const me = ready && session ? db[session] : null;
    const users = ready ? Object.values(db) : [];

    return { me, users, session, login, register, logout, placeBet, ready };
  }

  window.useAuth = useAuth;
})();
