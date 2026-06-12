// Login screen -> window.LoginScreen
(function () {
  const { useState } = React;
  const { SEED_USERS, PWD } = window.WC;
  const { initial } = window;

  function LoginScreen({ auth }) {
    const [u, setU] = useState('');
    const [pwd, setPwd] = useState('');
    const [err, setErr] = useState('');
    const featured = SEED_USERS.slice(0, 6);

    const submit = async () => {
      setErr('');
      const r = await auth.login(u, pwd);
      if (!r.ok) setErr(r.err || '登录失败');
    };

    const quick = async (acc) => {
      setErr('');
      const r = await auth.login(acc.u, PWD);
      if (!r.ok) setErr(r.err || '登录失败');
    };

    return (
      <div className="login">
        <section className="login-hero">
          <div className="brand-mark">MG</div>
          <div>
            <div className="login-kicker">World Cup 2026</div>
            <h1 className="login-title">朋友局积分竞猜</h1>
            <p className="login-sub">只使用不可提现的虚拟积分。账号由管理员分配，赔率、比分与结算均由后台人工确认。</p>
          </div>
          <div className="login-proof">
            <div><b>24</b><span>首轮比赛</span></div>
            <div><b>0</b><span>现金交易</span></div>
            <div><b>1</b><span>管理员后台</span></div>
          </div>
        </section>

        <section className="login-card">
          <div className="login-card-head">
            <h2>登录</h2>
            <p>输入预先分配的账号和密码。</p>
          </div>

          <div className="field">
            <label>账号</label>
            <input value={u} onChange={(e) => setU(e.target.value)} placeholder="例如 demo" autoCapitalize="none" />
          </div>
          <div className="field">
            <label>密码</label>
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="默认 123456" />
          </div>
          <div className="login-err">{err}</div>
          <button className="login-cta" onClick={submit}>登录</button>

          <div className="login-quick">
            <div className="login-quick-lab">快速体验</div>
            <div className="quick-row">
              {featured.map(a => (
                <button key={a.u} className="quick-chip" onClick={() => quick(a)}>
                  <span className="quick-av" style={{ background: a.c }}>{initial(a.name)}</span>
                  <b>{a.name}</b>
                </button>
              ))}
            </div>
            <div className="login-hint">体验账号密码均为 123456 · 管理员 admin / admin123456</div>
          </div>
        </section>
      </div>
    );
  }

  window.LoginScreen = LoginScreen;
})();
