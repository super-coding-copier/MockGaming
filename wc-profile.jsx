// Profile screen -> window.ProfileScreen
(function () {
  const { useState } = React;
  const { pts, initial } = window;

  const STATUS = {
    open: ['待开奖', 'warn'],
    won: ['已中奖', 'win'],
    lost: ['未中奖', 'lose'],
    void: ['已取消', 'warn'],
  };

  function ProfileScreen({ auth }) {
    const me = auth.me;
    const bets = me.bets || [];
    const ledger = me.ledger || [];
    const open = bets.filter(b => b.status === 'open').length;
    const totalStake = bets.reduce((s, b) => s + b.stake, 0);
    const [oldPwd, setOldPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [msg, setMsg] = useState('');

    const changePwd = async () => {
      setMsg('');
      const r = await auth.changePassword(oldPwd, newPwd);
      setMsg(r.ok ? '密码已更新' : (r.err || '修改失败'));
      if (r.ok) { setOldPwd(''); setNewPwd(''); }
    };

    return (
      <React.Fragment>
        <div className="topbar">
          <div className="topbar-row">
            <h1><small>2026 世界杯 · 竞猜</small>我的</h1>
          </div>
        </div>

        <div className="me-wrap">
          <div className="me-hero">
            <div className="av" style={{ background: 'rgba(255,255,255,.18)' }}>{initial(me.name)}</div>
            <div className="info">
              <b>{me.name}</b>
              <div>@{me.u} · {me.hit}</div>
            </div>
          </div>

          <div className="me-stats">
            <div className="me-stat"><b className="num">{pts(me.pts)}</b><span>当前积分</span></div>
            <div className="me-stat"><b className="num">{open}</b><span>待开奖</span></div>
            <div className="me-stat"><b className="num">{pts(totalStake)}</b><span>累计投注</span></div>
          </div>

          <div className="sec-title">我的投注</div>
          {bets.length === 0 ? (
            <div className="me-empty">还没有投注 · 去「竞猜」选一场试试手气</div>
          ) : bets.map(b => {
            const st = STATUS[b.status] || STATUS.open;
            return (
              <div className="bet-rec" key={b.id}>
                <div className="bet-rec-top">
                  <span className="tp">{b.legs.length > 1 ? `${b.legs.length} 串 1` : '单关'}</span>
                  <span className={'st ' + st[1]}>{st[0]}</span>
                </div>
                {b.legs.map((l, i) => (
                  <div className="bet-leg" key={i}>
                    <span>{l.home} vs {l.away}</span>
                    <span><span className="pick">{l.pick}</span> <span className="num" style={{ color: 'var(--ink-3)' }}>@{l.odds.toFixed(2)}</span></span>
                  </div>
                ))}
                <div className="bet-rec-foot">
                  <span className="num" style={{ color: 'var(--ink-3)' }}>投注 {pts(b.stake)} · 总赔率 {b.combined.toFixed(2)}</span>
                  <span>{b.status === 'won' ? '实中' : '预计'} <b className="num">{pts(b.status === 'won' ? b.actual_payout : b.payout)}</b></span>
                </div>
              </div>
            );
          })}

          <div className="sec-title">积分流水</div>
          {ledger.length === 0 ? (
            <div className="me-empty">暂无积分流水</div>
          ) : ledger.slice(0, 12).map(x => (
            <div className="ledger-row" key={x.id}>
              <div>
                <b>{x.note || x.kind}</b>
                <span>{new Date(x.at).toLocaleString()}</span>
              </div>
              <strong className={x.amount >= 0 ? 'pos' : 'neg'}>{x.amount >= 0 ? '+' : ''}{pts(x.amount)}</strong>
            </div>
          ))}

          <div className="sec-title">账号安全</div>
          {me.mustChangePwd && <div className="admin-note">管理员为你设置了初始密码，请尽快修改。</div>}
          <div className="mini-form">
            <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder="当前密码" />
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="新密码，至少 6 位" />
            <button onClick={changePwd}>修改密码</button>
          </div>
          <div className="login-err">{msg}</div>

          <div className="me-actions">
            <button className="me-btn danger" onClick={auth.logout}>退出登录</button>
          </div>
        </div>
      </React.Fragment>
    );
  }

  window.ProfileScreen = ProfileScreen;
})();
