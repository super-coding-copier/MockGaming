// Admin screen -> window.AdminScreen
(function () {
  const { useEffect, useState } = React;
  const { pts, OUT } = window;

  const OFFICIAL_LINKS = [
    { label: '竞彩网赛果开奖', href: 'https://www.sporttery.cn/jc/kjgg/' },
    { label: '中国体彩网竞彩', href: 'https://www.lottery.gov.cn/jc/index.html' },
    { label: '竞彩网足球计算器', href: 'https://www.sporttery.cn/jc/jsq/zqspf/' },
  ];

  function AdminScreen({ auth }) {
    const [data, setData] = useState(null);
    const [msg, setMsg] = useState('');
    const [newUser, setNewUser] = useState({ u: '', name: '', pwd: '123456', pts: 5000, role: 'user' });
    const [adjust, setAdjust] = useState({ u: '', amount: 1000, note: '管理员补积分' });
    const [reset, setReset] = useState({ u: '', pwd: '123456' });
    const [oddsDraft, setOddsDraft] = useState({});
    const [scoreDraft, setScoreDraft] = useState({});

    const load = async () => {
      const r = await auth.adminApi('GET', '/admin/state');
      if (r.ok === false) {
        setMsg(r.err || '后台数据加载失败');
        return;
      }
      setData(r);
      const odds = {};
      const scores = {};
      (r.matches || []).forEach(m => {
        odds[m.id] = {
          oddsH: Number(m.odds_h).toFixed(2),
          oddsD: Number(m.odds_d).toFixed(2),
          oddsA: Number(m.odds_a).toFixed(2),
        };
        scores[m.id] = {
          scoreHome: m.score_home ?? '',
          scoreAway: m.score_away ?? '',
        };
      });
      setOddsDraft(odds);
      setScoreDraft(scores);
    };

    useEffect(() => { load(); }, []);

    const run = async (path, body, okText) => {
      setMsg('');
      const r = await auth.adminApi('POST', path, body);
      setMsg(r.ok ? okText : (r.err || '操作失败'));
      if (r.ok) await load();
    };

    if (!data) {
      return (
        <React.Fragment>
          <div className="topbar">
            <div className="topbar-row"><h1><small>Admin</small>后台加载中</h1></div>
          </div>
          <div className="me-wrap"><div className="me-empty">{msg || '正在读取后台数据...'}</div></div>
        </React.Fragment>
      );
    }

    const users = data.users || [];
    const normalUsers = users.filter(u => u.role !== 'admin');
    const matches = data.matches || [];
    const bets = data.bets || [];

    const setOdds = (id, key, value) => setOddsDraft(s => ({ ...s, [id]: { ...(s[id] || {}), [key]: value } }));
    const setScore = (id, key, value) => setScoreDraft(s => ({ ...s, [id]: { ...(s[id] || {}), [key]: value } }));

    return (
      <React.Fragment>
        <div className="topbar">
          <div className="topbar-row">
            <h1><small>SUPER ACCOUNT</small>管理后台</h1>
            <div className="wallet"><div className="pt"><b className="num">{users.length}</b><span>账号</span></div></div>
          </div>
        </div>

        <div className="admin-wrap">
          {msg && <div className="admin-note">{msg}</div>}

          <div className="admin-card">
            <div className="sec-title">官方结果入口</div>
            <div className="official-links">
              {OFFICIAL_LINKS.map(link => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
              ))}
            </div>
            <div className="admin-help">系统只会自动按开赛时间锁盘；赔率、比分和结算由管理员人工核对后处理。</div>
          </div>

          <div className="admin-card">
            <div className="sec-title">创建分配账号</div>
            <div className="admin-grid">
              <input value={newUser.u} onChange={e => setNewUser({ ...newUser, u: e.target.value })} placeholder="账号" />
              <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="昵称" />
              <input value={newUser.pwd} onChange={e => setNewUser({ ...newUser, pwd: e.target.value })} placeholder="初始密码" />
              <input value={newUser.pts} onChange={e => setNewUser({ ...newUser, pts: +e.target.value || 0 })} placeholder="初始积分" />
            </div>
            <button className="admin-primary" onClick={() => run('/admin/create-user', newUser, '账号已创建')}>创建账号</button>
          </div>

          <div className="admin-card">
            <div className="sec-title">用户与积分</div>
            <div className="admin-grid">
              <select value={adjust.u} onChange={e => setAdjust({ ...adjust, u: e.target.value })}>
                <option value="">选择用户</option>
                {normalUsers.map(u => <option key={u.u} value={u.u}>{u.name} @{u.u}</option>)}
              </select>
              <input value={adjust.amount} onChange={e => setAdjust({ ...adjust, amount: +e.target.value || 0 })} placeholder="加/扣积分" />
              <input value={adjust.note} onChange={e => setAdjust({ ...adjust, note: e.target.value })} placeholder="原因" />
            </div>
            <button className="admin-primary" onClick={() => run('/admin/adjust-points', adjust, '积分已调整')}>提交积分调整</button>

            <div className="admin-users">
              {users.map(u => (
                <div className="admin-user" key={u.u}>
                  <div>
                    <b>{u.name}</b>
                    <span>@{u.u} · {u.role} · {pts(u.pts)} 分{u.disabled ? ' · 已停用' : ''}</span>
                  </div>
                  <button onClick={() => run('/admin/toggle-user', { u: u.u, disabled: !u.disabled }, u.disabled ? '账号已启用' : '账号已停用')}>
                    {u.disabled ? '启用' : '停用'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <div className="sec-title">重置密码</div>
            <div className="admin-grid">
              <select value={reset.u} onChange={e => setReset({ ...reset, u: e.target.value })}>
                <option value="">选择用户</option>
                {users.map(u => <option key={u.u} value={u.u}>{u.name} @{u.u}</option>)}
              </select>
              <input value={reset.pwd} onChange={e => setReset({ ...reset, pwd: e.target.value })} placeholder="新密码" />
            </div>
            <button className="admin-primary" onClick={() => run('/admin/reset-password', reset, '密码已重置')}>重置密码</button>
          </div>

          <div className="admin-card">
            <div className="sec-title">比赛、赔率、比分结算</div>
            {matches.map(m => {
              const odds = oddsDraft[m.id] || {};
              const score = scoreDraft[m.id] || {};
              const kickoff = m.kickoff_ts ? new Date(m.kickoff_ts).toLocaleString() : `${m.date} ${m.time}`;
              const scoreText = m.score_home !== null && m.score_home !== undefined ? ` · 比分 ${m.score_home}:${m.score_away}` : '';
              return (
                <div className="admin-match" key={m.id}>
                  <div className="admin-match-main">
                    <b>{m.home} vs {m.away}</b>
                    <span>{kickoff} · {m.grp}组 · {m.result ? '赛果 ' + OUT[m.result] : (m.locked ? '已锁盘' : '可投注')}{scoreText}</span>

                    {!m.result && (
                      <div className="admin-odds-row">
                        <label>主<input value={odds.oddsH || ''} onChange={e => setOdds(m.id, 'oddsH', e.target.value)} /></label>
                        <label>平<input value={odds.oddsD || ''} onChange={e => setOdds(m.id, 'oddsD', e.target.value)} /></label>
                        <label>客<input value={odds.oddsA || ''} onChange={e => setOdds(m.id, 'oddsA', e.target.value)} /></label>
                        <button onClick={() => run('/admin/update-odds', { matchId: m.id, ...odds }, '赔率已更新')}>保存赔率</button>
                      </div>
                    )}

                    {!m.result && (
                      <div className="admin-score-row">
                        <input value={score.scoreHome} onChange={e => setScore(m.id, 'scoreHome', e.target.value)} placeholder="主队比分" />
                        <input value={score.scoreAway} onChange={e => setScore(m.id, 'scoreAway', e.target.value)} placeholder="客队比分" />
                        <button onClick={() => run('/admin/settle-score', { matchId: m.id, ...score }, '比分已录入并结算')}>按比分结算</button>
                      </div>
                    )}
                  </div>
                  <div className="admin-actions">
                    {!m.result && <button onClick={() => run('/admin/lock-match', { matchId: m.id, locked: !m.locked }, m.locked ? '已解锁' : '已锁盘')}>{m.locked ? '解锁' : '锁盘'}</button>}
                    {!m.result && ['H', 'D', 'A'].map(x => <button key={x} onClick={() => run('/admin/settle-match', { matchId: m.id, result: x }, '比赛已结算')}>{OUT[x]}</button>)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="admin-card">
            <div className="sec-title">投注记录</div>
            {bets.length === 0 ? <div className="me-empty">暂无投注</div> : bets.slice(0, 50).map(b => (
              <div className="admin-bet" key={b.id}>
                <b>{b.userName} @{b.u}</b>
                <span>{b.status} · 投 {pts(b.stake)} · 预计 {pts(b.payout)} · 实中 {pts(b.actual_payout)}</span>
                {b.legs.map((l, i) => <em key={i}>{l.home} vs {l.away} · {l.pick} @{l.odds.toFixed(2)}</em>)}
              </div>
            ))}
          </div>

          <div className="admin-card">
            <div className="sec-title">积分流水</div>
            {(data.ledger || []).slice(0, 40).map(x => (
              <div className="ledger-row" key={x.id}>
                <div><b>@{x.u} · {x.note || x.kind}</b><span>{new Date(x.at).toLocaleString()} · {x.actor || '-'}</span></div>
                <strong className={x.amount >= 0 ? 'pos' : 'neg'}>{x.amount >= 0 ? '+' : ''}{pts(x.amount)}</strong>
              </div>
            ))}
          </div>

          <div className="admin-card">
            <div className="sec-title">操作日志</div>
            {(data.logs || []).slice(0, 40).map(x => (
              <div className="log-row" key={x.id}>
                <b>{x.actor} · {x.action}</b>
                <span>{x.target || '-'} · {new Date(x.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </React.Fragment>
    );
  }

  window.AdminScreen = AdminScreen;
})();
