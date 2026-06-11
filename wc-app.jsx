// App shell + bottom nav → window.WCApp
(function () {
  const { useState } = React;
  const { LoginScreen, BetScreen, RankScreen, ProfileScreen } = window;

  const Icon = ({ d, fill }) => (
    <svg className="ic" viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  );
  const icBet = <Icon d={<><circle cx="12" cy="12" r="9" /><path d="M12 7l1.5 3 3 .3-2.2 2 .7 3-3-1.6-3 1.6.7-3-2.2-2 3-.3z" /></>} />;
  const icRank = <Icon d={<><path d="M4 20h4v-7H4zM10 20h4V5h-4zM16 20h4v-10h-4z" /></>} />;
  const icMe = <Icon d={<><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></>} />;

  function WCApp({ t }) {
    const auth = window.useAuth();
    const [tab, setTab] = useState('bet');
    // lifted slip state so it survives tab switches
    const [sel, setSel] = useState({});
    const [stake, setStake] = useState(100);

    if (!auth.me) {
      return <div className={'app' + (t.platform === 'android' ? ' is-android' : '')} style={{ '--accent': t.accent }}><LoginScreen auth={auth} /></div>;
    }

    return (
      <div className={'app' + (t.platform === 'android' ? ' is-android' : '')} style={{ '--accent': t.accent }}>
        {tab === 'bet' && <BetScreen auth={auth} t={t} sel={sel} setSel={setSel} stake={stake} setStake={setStake} />}
        {tab === 'rank' && <RankScreen auth={auth} />}
        {tab === 'me' && <ProfileScreen auth={auth} />}

        <div className="nav">
          <button className={tab === 'bet' ? 'on' : ''} onClick={() => setTab('bet')}>{icBet}<span className="tx">竞猜</span></button>
          <button className={tab === 'rank' ? 'on' : ''} onClick={() => setTab('rank')}>{icRank}<span className="tx">积分榜</span></button>
          <button className={tab === 'me' ? 'on' : ''} onClick={() => setTab('me')}>{icMe}<span className="tx">我的</span></button>
        </div>
      </div>
    );
  }

  window.WCApp = WCApp;
})();
