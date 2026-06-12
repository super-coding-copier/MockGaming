// App shell + navigation -> window.WCApp
(function () {
  const { useState } = React;
  const { LoginScreen, BetScreen, RankScreen, ProfileScreen, AdminScreen } = window;

  const Icon = ({ d, fill }) => (
    <svg className="ic" viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  );

  const icBet = <Icon d={<><circle cx="12" cy="12" r="9" /><path d="M12 7l1.5 3 3 .3-2.2 2 .7 3-3-1.6-3 1.6.7-3-2.2-2 3-.3z" /></>} />;
  const icRank = <Icon d={<><path d="M4 20h4v-7H4zM10 20h4V5h-4zM16 20h4v-10h-4z" /></>} />;
  const icMe = <Icon d={<><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></>} />;
  const icAdmin = <Icon d={<><path d="M12 3l7 4v5c0 5-3 8-7 9-4-1-7-4-7-9V7z" /><path d="M9 12l2 2 4-4" /></>} />;

  function WCApp({ t }) {
    const auth = window.useAuth();
    const [tab, setTab] = useState('bet');
    const [sel, setSel] = useState({});
    const [stake, setStake] = useState(100);

    if (!auth.ready) {
      return (
        <div className="app is-loading" style={{ '--accent': t.accent }}>
          <div className="loading-card">加载中...</div>
        </div>
      );
    }

    if (!auth.me) {
      return <div className="app" style={{ '--accent': t.accent }}><LoginScreen auth={auth} /></div>;
    }

    const isAdmin = auth.me.role === 'admin';
    const activeTab = isAdmin && tab === 'bet' ? 'admin' : tab;

    return (
      <div className="app shell" style={{ '--accent': t.accent }}>
        <nav className="nav">
          <div className="nav-brand">
            <span>MG</span>
            <b>MockGaming</b>
          </div>
          {!isAdmin && <button className={activeTab === 'bet' ? 'on' : ''} onClick={() => setTab('bet')}>{icBet}<span className="tx">竞猜</span></button>}
          <button className={activeTab === 'rank' ? 'on' : ''} onClick={() => setTab('rank')}>{icRank}<span className="tx">积分榜</span></button>
          {isAdmin && <button className={activeTab === 'admin' ? 'on' : ''} onClick={() => setTab('admin')}>{icAdmin}<span className="tx">后台</span></button>}
          <button className={activeTab === 'me' ? 'on' : ''} onClick={() => setTab('me')}>{icMe}<span className="tx">我的</span></button>
        </nav>

        <main className="workspace">
          {activeTab === 'bet' && <BetScreen auth={auth} t={t} sel={sel} setSel={setSel} stake={stake} setStake={setStake} />}
          {activeTab === 'rank' && <RankScreen auth={auth} />}
          {activeTab === 'me' && <ProfileScreen auth={auth} />}
          {activeTab === 'admin' && <AdminScreen auth={auth} />}
        </main>
      </div>
    );
  }

  window.WCApp = WCApp;
})();
