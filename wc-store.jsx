// Auth + API state via REST backend -> window.useAuth
(function () {
  const { useState, useEffect, useCallback } = React;

  const API_BASE = window.WC_API_BASE || '';
  const API = API_BASE + '/api';
  const TOKEN_KEY = 'wc_token_v2';
  const USER_KEY = 'wc_session_v1';

  async function api(method, path, body, token) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers.Authorization = 'Bearer ' + token;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API + path, opts);
    const data = await res.json().catch(() => ({ ok: false, err: '服务返回异常' }));
    if (!res.ok && data.ok !== false) data.ok = false;
    return data;
  }

  function readStored(key) {
    try { return localStorage.getItem(key) || ''; } catch (e) { return ''; }
  }

  function writeStored(key, value) {
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch (e) {}
  }

  function useAuth() {
    const [token, setToken] = useState(() => readStored(TOKEN_KEY));
    const [session, setSession] = useState(() => readStored(USER_KEY));
    const [db, setDb] = useState(null);
    const [matches, setMatches] = useState([]);

    const refresh = useCallback(async (nextToken = token) => {
      const data = await api('GET', '/state', null, nextToken);
      setDb(data.users || {});
      setMatches(data.matches || []);
      if (!data.me && nextToken) {
        setToken('');
        setSession('');
        writeStored(TOKEN_KEY, '');
        writeStored(USER_KEY, '');
      }
      return data;
    }, [token]);

    useEffect(() => {
      refresh().catch((e) => {
        console.error('加载数据失败', e);
        setDb({});
        setMatches([]);
      });
    }, []);

    const login = useCallback(async (u, pwd) => {
      const r = await api('POST', '/login', { u, pwd });
      if (r.ok) {
        const key = r.user.u;
        setToken(r.token);
        setSession(key);
        writeStored(TOKEN_KEY, r.token);
        writeStored(USER_KEY, key);
        await refresh(r.token);
      }
      return r;
    }, [refresh]);

    const register = useCallback(async (name, u, pwd) => {
      return api('POST', '/register', { name, u, pwd }, token);
    }, [token]);

    const logout = useCallback(async () => {
      if (token) await api('POST', '/logout', {}, token).catch(() => null);
      setToken('');
      setSession('');
      writeStored(TOKEN_KEY, '');
      writeStored(USER_KEY, '');
      await refresh('');
    }, [token, refresh]);

    const placeBet = useCallback(async (bet) => {
      if (!token) return { ok: false, err: '请先登录' };
      const r = await api('POST', '/bet', bet, token);
      if (r.ok) await refresh(token);
      return r;
    }, [token, refresh]);

    const changePassword = useCallback(async (oldPwd, newPwd) => {
      const r = await api('POST', '/change-password', { oldPwd, newPwd }, token);
      if (r.ok) await refresh(token);
      return r;
    }, [token, refresh]);

    const adminApi = useCallback(async (method, path, body) => {
      const r = await api(method, path, body, token);
      if (r.ok && path !== '/admin/state') await refresh(token);
      return r;
    }, [token, refresh]);

    const ready = db !== null;
    const me = ready && session ? db[session] : null;
    const users = ready ? Object.values(db).filter(u => u.role !== 'admin') : [];
    const allUsers = ready ? Object.values(db) : [];

    return {
      ready, token, session, me, users, allUsers, matches,
      login, register, logout, refresh, placeBet, changePassword, adminApi,
    };
  }

  window.useAuth = useAuth;
})();
