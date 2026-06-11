// Shared small UI helpers → window
(function () {
  const { useState, useEffect } = React;

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
  function decToFrac(dec) {
    const n = dec - 1; let best = [Math.round(n), 1], err = Infinity;
    for (let d = 1; d <= 20; d++) { const num = Math.round(n * d); const e = Math.abs(n - num / d); if (e < err - 1e-9) { err = e; best = [num, d]; } }
    const g = gcd(best[0], best[1]); return `${best[0] / g}/${best[1] / g}`;
  }
  const fmtOdds = (dec, fmt) => fmt === 'fraction' ? decToFrac(dec) : dec.toFixed(2);
  const pts = (n) => Math.round(n).toLocaleString('zh-CN');
  const initial = (name) => name === '我' ? '我' : name.slice(0, 1);

  const OUT = { H: '主胜', D: '平局', A: '客胜' };

  function Badge({ team, size = 44 }) {
    return <div className="badge" style={{ width: size, height: size, background: team.c, color: team.fg, fontSize: size * 0.3 }}>{team.code}</div>;
  }

  function useCountUp(value, ms = 420) {
    const [shown, setShown] = useState(value);
    useEffect(() => {
      const from = shown, to = value, t0 = performance.now(); let raf;
      const tick = (t) => { const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3); setShown(from + (to - from) * e); if (k < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
      // eslint-disable-next-line
    }, [value]);
    return shown;
  }

  Object.assign(window, { decToFrac, fmtOdds, pts, initial, OUT, Badge, useCountUp });
})();
