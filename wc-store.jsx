// Auth + per-user state on localStorage → window. Simulates a multi-user backend.
(function () {
  const { useState, useEffect, useCallback } = React;
  const { SEED_USERS, PWD } = window.WC;

  const DB_KEY = 'wc_users_v1';   // { [username]: {u,name,pts,hit,c,pwd,bets:[]} }
  const SESSION_KEY = 'wc_session_v1';

  function loadDB() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    // seed
    const db = {};
    SEED_USERS.forEach(s => { db[s.u] = { ...s, pwd: PWD, bets: [] }; });
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {}
    return db;
  }
  function saveDB(db) { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {} }

  // pick a color for new registrations
  const PALETTE = ['#0EA5A0', '#F59E0B', '#7C3AED', '#2563EB', '#DB2777', '#16A34A', '#FF6A1A', '#0891B2', '#65A30D', '#9333EA'];

  function useAuth() {
    const [db, setDB] = useState(loadDB);
    const [session, setSession] = useState(() => {
      try { return localStorage.getItem(SESSION_KEY) || null; } catch (e) { return null; }
    });

    const persist = useCallback((next) => { setDB(next); saveDB(next); }, []);

    const login = useCallback((u, pwd) => {
      const acc = db[u.trim().toLowerCase()];
      if (!acc) return { ok: false, err: '账号不存在' };
      if (acc.pwd !== pwd) return { ok: false, err: '密码错误' };
      setSession(acc.u);
      try { localStorage.setItem(SESSION_KEY, acc.u); } catch (e) {}
      return { ok: true };
    }, [db]);

    const register = useCallback((name, u, pwd) => {
      const key = u.trim().toLowerCase();
      if (!key || !name.trim()) return { ok: false, err: '请填写昵称和账号' };
      if (db[key]) return { ok: false, err: '账号已存在' };
      const acc = { u: key, name: name.trim(), pts: 5000, hit: '新人 · 首单送 5000 积分', c: PALETTE[Object.keys(db).length % PALETTE.length], pwd, bets: [] };
      const next = { ...db, [key]: acc };
      persist(next);
      setSession(key);
      try { localStorage.setItem(SESSION_KEY, key); } catch (e) {}
      return { ok: true };
    }, [db, persist]);

    const logout = useCallback(() => {
      setSession(null);
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    }, []);

    // place a parlay bet: legs [{matchId, outcome, odds, ...}], stake, payout
    const placeBet = useCallback((bet) => {
      if (!session) return;
      const acc = db[session];
      if (!acc || acc.pts < bet.stake) return { ok: false, err: '积分不足' };
      const rec = { ...bet, id: 'b' + Date.now(), at: Date.now(), status: 'open' };
      const updated = { ...acc, pts: acc.pts - bet.stake, bets: [rec, ...(acc.bets || [])] };
      persist({ ...db, [session]: updated });
      return { ok: true };
    }, [db, session, persist]);

    const me = session ? db[session] : null;
    const users = Object.values(db);

    return { me, users, session, login, register, logout, placeBet };
  }

  window.useAuth = useAuth;
})();
