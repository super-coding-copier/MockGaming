// 积分榜 → window.RankScreen
(function () {
  const { useState } = React;
  const { pts, initial } = window;

  function RankScreen({ auth }) {
    const [tab, setTab] = useState('总榜');
    const ranked = [...auth.users].sort((a, b) => b.pts - a.pts);
    const myRank = ranked.findIndex(u => u.u === auth.session) + 1;
    const me = auth.me;
    const ahead = myRank > 1 ? ranked[myRank - 2] : null;
    const rest = ranked.slice(3);

    const podium = [
      { u: ranked[1], rank: 2, size: 54, base: 44, color: '#9AA0A6' },
      { u: ranked[0], rank: 1, size: 68, base: 64, color: '#F5B301' },
      { u: ranked[2], rank: 3, size: 54, base: 36, color: '#CD7F32' },
    ];

    return (
      <React.Fragment>
        <div className="topbar">
          <div className="topbar-row">
            <h1><small>2026 世界杯 · 竞猜</small>积分榜</h1>
            <div className="wallet">
              <div className="pt"><b className="num">{pts(me.pts)}</b><span>我的积分</span></div>
              <div className="av" style={{ background: me.c }}>{initial(me.name)}</div>
            </div>
          </div>
        </div>

        <div className="lb-tabs">
          {['总榜', '本周', '好友'].map(x => (
            <button key={x} className={'chip' + (tab === x ? ' on' : '')} onClick={() => setTab(x)}>{x}</button>
          ))}
        </div>

        <div className="lb-podium">
          {podium.map(p => p.u && (
            <div className="lb-pod" key={p.rank} style={{ marginTop: p.rank === 1 ? 0 : 12 }}>
              <div className="av" style={{ width: p.size, height: p.size, background: p.u.c, fontSize: p.size * 0.32 }}>{initial(p.u.name)}</div>
              <div className="nm">{p.u.name}</div>
              <div className="pt num" style={{ color: 'var(--ink)' }}>{pts(p.u.pts)}</div>
              <div className="base" style={{ height: p.base, background: p.color }}>{p.rank}</div>
            </div>
          ))}
        </div>

        <div className="lb-me">
          <div className="rk"><small>我的排名</small>#{myRank}</div>
          <div className="mid">
            <b>{me.hit}</b>
            <div>{ahead ? `距上一名还差 ${pts(ahead.pts - me.pts)} 分` : '榜首王者 · 继续保持'}</div>
          </div>
          <div className="pt">
            <b className="num">{pts(me.pts)}</b>
            <span>积分</span>
          </div>
        </div>

        <div className="lb-list">
          {rest.map((u, i) => (
            <div key={u.u} className={'lb-row' + (u.u === auth.session ? ' me' : '')}>
              <div className="lb-rank num">{i + 4}</div>
              <div className="lb-av" style={{ background: u.c }}>{initial(u.name)}</div>
              <div className="lb-info">
                <div className="lb-name">{u.name}{u.u === auth.session && <span className="tag">我</span>}</div>
                <div className="lb-hit">{u.hit}</div>
              </div>
              <div className="lb-pts"><b className="num">{pts(u.pts)}</b></div>
            </div>
          ))}
        </div>
      </React.Fragment>
    );
  }

  window.RankScreen = RankScreen;
})();
