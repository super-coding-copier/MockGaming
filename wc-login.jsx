// Login / Register screen → window.LoginScreen
(function () {
  const { useState } = React;
  const { SEED_USERS, PWD } = window.WC;
  const { initial } = window;

  function LoginScreen({ auth }) {
    const [mode, setMode] = useState('login'); // login | register
    const [u, setU] = useState('');
    const [name, setName] = useState('');
    const [pwd, setPwd] = useState('');
    const [err, setErr] = useState('');

    const featured = SEED_USERS.slice(0, 6);

    const submit = async () => {
      setErr('');
      const r = mode === 'login' ? await auth.login(u, pwd) : await auth.register(name, u, pwd);
      if (!r.ok) setErr(r.err);
    };
    const quick = async (acc) => {
      setErr('');
      const r = await auth.login(acc.u, PWD);
      if (!r.ok) setErr(r.err);
    };

    return (
      <div className="login">
        <div className="login-hero">
          <div className="login-badge">⚽</div>
          <div className="login-kicker">FIFA World Cup 2026</div>
          <div className="login-title">世界杯<br />胜平负竞猜</div>
          <div className="login-sub">用积分预测每场胜负 · 赔率来自中国体育彩票竞彩足球 · 登录后冲击积分榜</div>
        </div>

        <div className="login-card">
          <div className="seg">
            <button className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setErr(''); }}>登录</button>
            <button className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setErr(''); }}>注册</button>
          </div>

          {mode === 'register' && (
            <div className="field">
              <label>昵称</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="给自己起个球迷名" />
            </div>
          )}
          <div className="field">
            <label>账号</label>
            <input value={u} onChange={(e) => setU(e.target.value)} placeholder={mode === 'login' ? '用户名，如 demo' : '设置登录用户名'} autoCapitalize="none" />
          </div>
          <div className="field">
            <label>密码</label>
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder={mode === 'login' ? '默认 123456' : '设置密码'} />
          </div>
          <div className="login-err">{err}</div>
          <button className="login-cta" onClick={submit}>{mode === 'login' ? '登录' : '注册并登录'}</button>

          {mode === 'login' && (
            <div className="login-quick">
              <div className="login-quick-lab">快速体验账号</div>
              <div className="quick-row">
                {featured.map(a => (
                  <button key={a.u} className="quick-chip" onClick={() => quick(a)}>
                    <span className="quick-av" style={{ background: a.c }}>{initial(a.name)}</span>
                    <b>{a.name}</b>
                  </button>
                ))}
              </div>
              <div className="login-hint">所有体验账号密码均为 123456 · 数据存于 data.json</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  window.LoginScreen = LoginScreen;
})();
