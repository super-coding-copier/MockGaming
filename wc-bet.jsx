// Betting screen -> window.BetScreen
(function () {
  const { useState, useMemo } = React;
  const { MATCHES, GROUPS, SOURCE } = window.WC;
  const { Badge, fmtOdds, pts, initial, OUT, useCountUp } = window;

  function matchRuntime(auth, m) {
    const live = auth.matches.find(x => x.id === m.id);
    return live || {};
  }

  function effectiveMatch(auth, m) {
    const live = matchRuntime(auth, m);
    if (!live.id) return m;
    return {
      ...m,
      odds: {
        H: Number(live.odds_h),
        D: Number(live.odds_d),
        A: Number(live.odds_a),
      },
      live,
    };
  }

  function MatchCard({ auth, m, sel, onPick, fmt, accent }) {
    const live = matchRuntime(auth, m);
    const odds = effectiveMatch(auth, m).odds;
    const disabled = !!live.locked || !!live.result;
    return (
      <div className={'card' + (m.hot ? ' hot' : '') + (disabled ? ' closed' : '')}>
        <div className="card-meta">
          <span className={'stage' + (m.hot ? ' hot' : '')}>小组赛 · {m.grp}组</span>
          <span className="when num">{m.date} {m.time} · {m.venue}</span>
        </div>
        <div className="teams">
          <div className="team"><Badge team={m.home} /><span className="nm">{m.home.name}</span></div>
          <span className="vs">{live.result ? OUT[live.result] : 'VS'}</span>
          <div className="team"><Badge team={m.away} /><span className="nm">{m.away.name}</span></div>
        </div>
        <div className="odds">
          {['H', 'D', 'A'].map(oc => {
            const on = sel === oc;
            return (
              <button key={oc} disabled={disabled} className={'odd' + (on ? ' sel' : '')} onClick={() => onPick(m.id, oc)}
                style={on ? { background: accent, borderColor: accent, boxShadow: '0 6px 16px -4px rgba(15,20,15,.22)' } : null}>
                <span className="lab" style={on ? { color: '#fff' } : null}>{OUT[oc]}</span>
                <span className="val num" style={on ? { color: '#fff' } : null}>{fmtOdds(odds[oc], fmt)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function BetScreen({ auth, t, sel, setSel, stake, setStake }) {
    const [grp, setGrp] = useState('全部');
    const [toast, setToast] = useState('');
    const fmt = t.oddsFormat;

    const filtered = useMemo(() => grp === '全部' ? MATCHES : MATCHES.filter(m => m.grp === grp), [grp]);
    const byDay = useMemo(() => {
      const o = {}; filtered.forEach(m => { (o[m.date] = o[m.date] || []).push(m); }); return o;
    }, [filtered]);

    const isClosed = (id) => {
      const live = auth.matches.find(x => x.id === id);
      return live && (live.locked || live.result);
    };
    const pick = (id, oc) => {
      if (isClosed(id)) return;
      setSel(s => { const n = { ...s }; if (n[id] === oc) delete n[id]; else n[id] = oc; return n; });
    };
    const clear = () => setSel({});

    const legs = MATCHES.filter(m => sel[m.id] && !isClosed(m.id)).map(m => {
      const em = effectiveMatch(auth, m);
      return { match: em, outcome: sel[m.id], odds: em.odds[sel[m.id]] };
    });
    const count = legs.length;
    const combined = count ? legs.reduce((p, l) => p * l.odds, 1) : 0;
    const payout = count ? stake * combined : 0;
    const shown = useCountUp(payout);
    const bump = (d) => setStake(s => Math.max(10, Math.round((s + d) / 10) * 10));

    const me = auth.me;
    const place = async () => {
      if (!count) return;
      const r = await auth.placeBet({
        stake,
        legs: legs.map(l => ({ matchId: l.match.id, outcome: l.outcome })),
      });
      if (r && r.ok) {
        setToast(`投注成功 · ${pts(stake)} 积分`);
        clear();
      } else {
        setToast(r && r.err ? r.err : '投注失败');
      }
      setTimeout(() => setToast(''), 2200);
    };

    return (
      <React.Fragment>
        <div className="topbar">
          <div className="topbar-row">
            <h1><small>2026 世界杯 · 小组赛首轮</small>胜平负竞猜</h1>
            <div className="wallet">
              <div className="pt"><b className="num">{pts(me.pts)}</b><span>我的积分</span></div>
              <div className="av" style={{ background: me.c }}>{initial(me.name)}</div>
            </div>
          </div>
          <div className="source"><i>虚</i>{SOURCE}</div>
        </div>

        <div className="chips">
          {['全部', ...GROUPS].map(g => (
            <button key={g} className={'chip' + (grp === g ? ' on' : '')} onClick={() => setGrp(g)}>{g === '全部' ? '全部' : g + '组'}</button>
          ))}
        </div>

        <div className="list">
          {Object.keys(byDay).map(day => (
            <React.Fragment key={day}>
              <div className="day-label">{day}</div>
              {byDay[day].map(m => (
                <MatchCard key={m.id} auth={auth} m={m} sel={sel[m.id]} onPick={pick} fmt={fmt} accent={t.accent} />
              ))}
            </React.Fragment>
          ))}
        </div>

        <div className={'toast' + (toast ? ' show' : '')}><i>✓</i>{toast}</div>

        <div className={'slip' + (count ? '' : ' hide')}>
          <div className="slip-top">
            <div className="slip-legs">
              <span className="n num">{count}</span>
              <span>{count > 1 ? `${count} 串 1` : '单关'}</span>
              <span className="num" style={{ color: 'rgba(255,255,255,.5)' }}>@ {fmtOdds(combined || 1, fmt)}</span>
            </div>
            <button className="slip-clear" onClick={clear}>清空</button>
          </div>
          <div className="slip-grid">
            <div>
              <div className="slip-meta">投注积分</div>
              <div className="stake">
                <button className="step" onClick={() => bump(-50)}>-</button>
                <input className="num" value={stake} onChange={(e) => setStake(Math.max(0, +String(e.target.value).replace(/\D/g, '') || 0))} />
                <button className="step" onClick={() => bump(50)}>+</button>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="slip-meta">预计可中</div>
              <div className="payout num">{pts(shown)}<small style={{ fontSize: 13, marginLeft: 3 }}>分</small></div>
            </div>
          </div>
          <button className="cta" disabled={!count || !stake || stake > me.pts} onClick={place}>
            {stake > me.pts ? '积分不足' : `确认投注 · ${pts(stake)} 积分`}
          </button>
        </div>
      </React.Fragment>
    );
  }

  window.BetScreen = BetScreen;
})();
