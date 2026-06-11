// 我的 / profile — bet history + switch/logout → window.ProfileScreen
(function () {
  const { pts, initial } = window;

  function ProfileScreen({ auth }) {
    const me = auth.me;
    const bets = me.bets || [];
    const open = bets.length;
    const totalStake = bets.reduce((s, b) => s + b.stake, 0);

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
            <div className="me-stat"><b className="num">{open}</b><span>进行中投注</span></div>
            <div className="me-stat"><b className="num">{pts(totalStake)}</b><span>累计投注</span></div>
          </div>

          <div className="sec-title">我的投注</div>
          {bets.length === 0 ? (
            <div className="me-empty">还没有投注 · 去「竞猜」选一场试试手气</div>
          ) : bets.map(b => (
            <div className="bet-rec" key={b.id}>
              <div className="bet-rec-top">
                <span className="tp">{b.legs.length > 1 ? `${b.legs.length} 串 1 · 串关` : '单关'}</span>
                <span className="st">待开赛</span>
              </div>
              {b.legs.map((l, i) => (
                <div className="bet-leg" key={i}>
                  <span>{l.home} vs {l.away}</span>
                  <span><span className="pick">{l.pick}</span> <span className="num" style={{ color: 'var(--ink-3)' }}>@{l.odds.toFixed(2)}</span></span>
                </div>
              ))}
              <div className="bet-rec-foot">
                <span className="num" style={{ color: 'var(--ink-3)' }}>投注 {pts(b.stake)} · 总赔率 {b.combined.toFixed(2)}</span>
                <span>预计可中 <b className="num">{pts(b.payout)}</b></span>
              </div>
            </div>
          ))}

          <div className="me-actions">
            <button className="me-btn" onClick={auth.logout}>切换账号</button>
            <button className="me-btn danger" onClick={auth.logout}>退出登录</button>
          </div>
        </div>
      </React.Fragment>
    );
  }

  window.ProfileScreen = ProfileScreen;
})();
