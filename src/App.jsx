import { useState, useEffect } from "react";

const PRICE_PER_PACK = 12.5;
const CIGS_PER_PACK = 20;
const PRICE_PER_CIG = PRICE_PER_PACK / CIGS_PER_PACK;
const MINUTES_PER_CIG = 11;

const HEALTH_FACTS = [
  "Chaque cigarette réduit ton espérance de vie d'environ 11 minutes.",
  "20 minutes après la dernière : ta tension artérielle baisse déjà.",
  "La nicotine atteint le cerveau en 10 secondes.",
  "Les cils bronchiques récupèrent après 72h sans fumer.",
  "Fumer augmente le risque cardiovasculaire de 2 à 4 fois.",
  "La fumée contient plus de 70 substances cancérigènes.",
  "Le CO dans la fumée réduit l'oxygène dans ton sang.",
];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getMonthKey(dateStr) { return dateStr.slice(0, 7); }

function getMonthLabel(monthKey) {
  const [y, m] = monthKey.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("fr-CA", { month: "long", year: "numeric" });
}

function getDaysInMonth(monthKey) {
  const [y, m] = monthKey.split("-");
  const days = [];
  const d = new Date(+y, +m - 1, 1);
  while (d.getMonth() === +m - 1) {
    days.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("fr-CA", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(minutes) {
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function loadData() {
  try {
    const raw = localStorage.getItem("smoketracker_v1");
    return raw ? JSON.parse(raw) : { days: {}, startDate: getToday() };
  } catch { return { days: {}, startDate: getToday() }; }
}

function saveData(data) {
  localStorage.setItem("smoketracker_v1", JSON.stringify(data));
}

export default function SmokeTracker() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState("home"); // home | stats | history
  const [factIndex, setFactIndex] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(getMonthKey(getToday()));

  const today = getToday();
  const todayCount = data.days[today] || 0;

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => {
    const i = setInterval(() => setFactIndex(f => (f + 1) % HEALTH_FACTS.length), 6000);
    return () => clearInterval(i);
  }, []);

  function addCig() {
    setPulse(true); setTimeout(() => setPulse(false), 400);
    setData(prev => ({ ...prev, days: { ...prev.days, [today]: (prev.days[today] || 0) + 1 } }));
  }
  function removeCig() {
    if (todayCount === 0) return;
    setData(prev => ({ ...prev, days: { ...prev.days, [today]: prev.days[today] - 1 } }));
  }

  const totalCigs = Object.values(data.days).reduce((a, b) => a + b, 0);
  const totalMoney = totalCigs * PRICE_PER_CIG;
  const totalMinutes = totalCigs * MINUTES_PER_CIG;
  const dayCount = Math.max(Object.keys(data.days).length, 1);
  const avgPerDay = (totalCigs / dayCount).toFixed(1);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    return { key, label: d.toLocaleDateString("fr-CA", { weekday: "short" }).slice(0, 3), count: data.days[key] || 0 };
  });
  const maxBar = Math.max(...last7.map(d => d.count), 1);

  // History
  const allMonths = (() => {
    const keys = new Set(Object.keys(data.days).map(getMonthKey));
    keys.add(getMonthKey(today));
    return Array.from(keys).sort().reverse();
  })();
  const monthDays = getDaysInMonth(historyMonth);
  const firstDayOfWeek = new Date(historyMonth + "-01T12:00:00").getDay();
  const monthTotal = monthDays.reduce((a, d) => a + (data.days[d] || 0), 0);
  const monthMoney = (monthTotal * PRICE_PER_CIG).toFixed(0);
  const maxDayInMonth = Math.max(...monthDays.map(d => data.days[d] || 0), 1);

  return (
    <div style={s.root}>
      <div style={s.grain} />

      {/* Nav */}
      <div style={s.nav}>
        <button style={{ ...s.navBtn, ...(view === "home" ? s.navActive : {}) }} onClick={() => setView("home")}>aujourd'hui</button>
        <button style={{ ...s.navBtn, ...(view === "stats" ? s.navActive : {}) }} onClick={() => setView("stats")}>stats</button>
        <button style={{ ...s.navBtn, ...(view === "history" ? s.navActive : {}) }} onClick={() => setView("history")}>historique</button>
      </div>

      {/* ── HOME ── */}
      {view === "home" && (
        <div style={s.page}>
          <div style={s.header}>
            <span style={s.logo}>🚬</span>
            <h1 style={s.title}>smoke<em>less</em></h1>
          </div>

          <div style={s.card}>
            <p style={s.cardLabel}>aujourd'hui</p>
            <div style={s.counterRow}>
              <button style={s.btnMinus} onClick={removeCig}>−</button>
              <div style={{ ...s.countDisplay, ...(pulse ? s.pulse : {}) }}>
                <span style={s.countNum}>{todayCount}</span>
                <span style={s.countUnit}>cig</span>
              </div>
              <button style={s.btnPlus} onClick={addCig}>+</button>
            </div>
            <p style={s.cardSub}>
              ≈ {(todayCount * PRICE_PER_CIG).toFixed(2)} $ · {formatTime(todayCount * MINUTES_PER_CIG)} de vie
            </p>
          </div>

          <div style={s.card}>
            <p style={s.cardLabel}>7 derniers jours</p>
            <div style={s.chartRow}>
              {last7.map(d => (
                <div key={d.key} style={s.barCol}>
                  <div style={s.barTrack}>
                    <div style={{ ...s.barFill, height: `${(d.count / maxBar) * 100}%`, background: d.key === today ? "#e8a838" : "#c97b2a", opacity: d.key === today ? 1 : 0.55 }} />
                  </div>
                  <span style={s.barNum}>{d.count}</span>
                  <span style={s.barLabel}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={s.factBox}>
            <span style={s.factIcon}>💡</span>
            <p style={s.factText} key={factIndex}>{HEALTH_FACTS[factIndex]}</p>
          </div>
        </div>
      )}

      {/* ── STATS ── */}
      {view === "stats" && (
        <div style={s.page}>
          <div style={s.header}>
            <h1 style={s.title}>stats</h1>
          </div>

          <div style={s.statsGrid}>
            <div style={s.statCard}>
              <span style={s.statBig}>{totalCigs}</span>
              <span style={s.statLbl}>cigarettes fumées</span>
            </div>
            <div style={s.statCard}>
              <span style={s.statBig}>{totalMoney.toFixed(0)} $</span>
              <span style={s.statLbl}>dépensés</span>
            </div>
            <div style={s.statCard}>
              <span style={s.statBig}>{avgPerDay}</span>
              <span style={s.statLbl}>par jour en moy.</span>
            </div>
            <div style={s.statCard}>
              <span style={s.statBig}>{formatTime(totalMinutes)}</span>
              <span style={s.statLbl}>de vie fumée</span>
            </div>
          </div>

          <div style={s.card}>
            <p style={s.cardLabel}>si tu arrêtais aujourd'hui</p>
            <div style={s.projRow}>
              <div style={s.proj}>
                <span style={s.projVal}>{(avgPerDay * 30 * PRICE_PER_CIG).toFixed(0)} $</span>
                <span style={s.projLbl}>économisés / mois</span>
              </div>
              <div style={s.projDiv} />
              <div style={s.proj}>
                <span style={s.projVal}>{(avgPerDay * 365 * PRICE_PER_CIG).toFixed(0)} $</span>
                <span style={s.projLbl}>économisés / an</span>
              </div>
            </div>
          </div>

          <div style={s.card}>
            <p style={s.cardLabel}>⏳ temps de vie fumée</p>
            <p style={s.bigTime}>{formatTime(totalMinutes)}</p>
            <p style={s.bigTimeSub}>soit {formatTime(avgPerDay * MINUTES_PER_CIG)} perdues par jour</p>
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {view === "history" && (
        <div style={s.page}>
          <div style={s.monthNav}>
            <button style={s.monthArrow} onClick={() => {
              const idx = allMonths.indexOf(historyMonth);
              if (idx < allMonths.length - 1) setHistoryMonth(allMonths[idx + 1]);
            }}>‹</button>
            <span style={s.monthLabel}>{getMonthLabel(historyMonth)}</span>
            <button style={s.monthArrow} onClick={() => {
              const idx = allMonths.indexOf(historyMonth);
              if (idx > 0) setHistoryMonth(allMonths[idx - 1]);
            }}>›</button>
          </div>

          <div style={s.monthSummary}>
            <div style={s.mStat}>
              <span style={s.mStatVal}>{monthTotal}</span>
              <span style={s.mStatLbl}>cigarettes</span>
            </div>
            <div style={s.mDiv} />
            <div style={s.mStat}>
              <span style={s.mStatVal}>{monthMoney} $</span>
              <span style={s.mStatLbl}>dépensés</span>
            </div>
            <div style={s.mDiv} />
            <div style={s.mStat}>
              <span style={s.mStatVal}>{monthDays.filter(d => d <= today && data.days[d] !== undefined).length > 0 ? (monthTotal / monthDays.filter(d => d <= today && data.days[d] !== undefined).length).toFixed(1) : "—"}</span>
              <span style={s.mStatLbl}>/ jour moy.</span>
            </div>
          </div>

          {/* Calendar */}
          <div style={s.card}>
            <div style={s.calGrid}>
              {["dim","lun","mar","mer","jeu","ven","sam"].map(d => (
                <div key={d} style={s.calHeader}>{d}</div>
              ))}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
              {monthDays.map(day => {
                const count = data.days[day] || 0;
                const hasData = data.days[day] !== undefined;
                const isToday = day === today;
                const isFuture = day > today;
                const intensity = hasData ? Math.min(count / maxDayInMonth, 1) : 0;
                return (
                  <div key={day} style={{
                    ...s.calDay,
                    background: isFuture ? "transparent" : hasData ? `rgba(232,168,56,${0.1 + intensity * 0.5})` : "transparent",
                    border: isToday ? "1px solid rgba(232,168,56,0.6)" : "1px solid transparent",
                    opacity: isFuture ? 0.2 : 1,
                  }}>
                    <span style={s.calNum}>{+day.split("-")[2]}</span>
                    {!isFuture && hasData && <span style={s.calCount}>{count}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily list */}
          <div style={s.card}>
            <p style={s.cardLabel}>détail</p>
            {monthDays.filter(d => d <= today).reverse().map(day => {
              const count = data.days[day] || 0;
              const hasData = data.days[day] !== undefined;
              return (
                <div key={day} style={s.listRow}>
                  <span style={s.listDot}>{hasData ? (count === 0 ? "✦" : "🚬") : "·"}</span>
                  <span style={s.listDate}>{formatDate(day)}</span>
                  <span style={{ ...s.listVal, color: hasData ? (count <= 2 ? "#e8a838" : count <= 4 ? "#c97b2a" : "#e05555") : "rgba(242,232,213,0.2)" }}>
                    {hasData ? `${count} cig` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:ital@0;1&display=swap');
        @keyframes pulseAnim { 0%{transform:scale(1)} 50%{transform:scale(1.18)} 100%{transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; }
        button:active { opacity: 0.7; }
      `}</style>
    </div>
  );
}

const s = {
  root: { height: "100dvh", width: "100%", background: "#1a1208", color: "#f2e8d5", fontFamily: "'Syne', sans-serif", display: "flex", flexDirection: "column", maxWidth: 440, margin: "0 auto", position: "relative", overflow: "hidden" },
  grain: { position: "fixed", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")", opacity: 0.4, pointerEvents: "none", zIndex: 0 },

  nav: { display: "flex", gap: 4, padding: "12px 16px 0", background: "rgba(26,18,8,0.95)", flexShrink: 0, position: "relative", zIndex: 2 },
  navBtn: { flex: 1, background: "none", border: "none", color: "rgba(242,232,213,0.35)", fontSize: 12, padding: "8px 0", borderRadius: 10, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700, transition: "all 0.2s", letterSpacing: "0.3px" },
  navActive: { background: "rgba(232,168,56,0.12)", color: "#e8a838" },

  page: { flex: 1, overflowY: "auto", padding: "14px 16px 20px", display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 },

  header: { textAlign: "center", marginBottom: 2 },
  logo: { fontSize: 28 },
  title: { fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, margin: "2px 0 0", letterSpacing: "-1px", color: "#f2e8d5" },

  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px 16px 12px" },
  cardLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" },
  cardSub: { fontFamily: "'DM Mono', monospace", fontSize: 11, opacity: 0.45, textAlign: "center", margin: "6px 0 0" },

  counterRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 20 },
  btnMinus: { width: 44, height: 44, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.15)", background: "transparent", color: "#f2e8d5", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  btnPlus: { width: 52, height: 52, borderRadius: "50%", border: "none", background: "#e8a838", color: "#1a1208", fontSize: 28, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(232,168,56,0.35)" },
  countDisplay: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: 70 },
  countNum: { fontSize: 56, fontWeight: 800, lineHeight: 1, color: "#e8a838" },
  countUnit: { fontSize: 11, opacity: 0.4, fontFamily: "'DM Mono', monospace" },
  pulse: { animation: "pulseAnim 0.4s ease" },

  chartRow: { display: "flex", alignItems: "flex-end", gap: 5, height: 70 },
  barCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", gap: 3 },
  barTrack: { flex: 1, width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", display: "flex", alignItems: "flex-end" },
  barFill: { width: "100%", borderRadius: 4, transition: "height 0.4s ease", minHeight: 2 },
  barNum: { fontSize: 10, fontWeight: 700, opacity: 0.8 },
  barLabel: { fontSize: 8, opacity: 0.35, fontFamily: "'DM Mono', monospace" },

  factBox: { display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 14px" },
  factIcon: { fontSize: 15, marginTop: 1 },
  factText: { margin: 0, fontSize: 12, lineHeight: 1.55, opacity: 0.65, animation: "fadeUp 0.5s ease" },

  // Stats
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  statCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 4 },
  statBig: { fontSize: 24, fontWeight: 800, color: "#e8a838" },
  statLbl: { fontSize: 10, opacity: 0.4, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 0.8 },

  projRow: { display: "flex", alignItems: "center" },
  proj: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", gap: 4 },
  projVal: { fontSize: 22, fontWeight: 800, color: "#e8a838" },
  projLbl: { fontSize: 10, opacity: 0.4, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 0.8 },
  projDiv: { width: 1, height: 40, background: "rgba(255,255,255,0.08)" },

  bigTime: { fontSize: 36, fontWeight: 800, color: "#e8a838", margin: "4px 0 2px", textAlign: "center" },
  bigTimeSub: { fontSize: 11, opacity: 0.4, fontFamily: "'DM Mono', monospace", textAlign: "center", margin: 0 },

  // History
  monthNav: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  monthArrow: { background: "none", border: "none", color: "#e8a838", fontSize: 22, cursor: "pointer", padding: "0 8px", lineHeight: 1 },
  monthLabel: { fontSize: 15, fontWeight: 700, color: "#f2e8d5", textTransform: "capitalize" },

  monthSummary: { display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 },
  mStat: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 6px", gap: 3 },
  mStatVal: { fontSize: 18, fontWeight: 800, color: "#e8a838" },
  mStatLbl: { fontSize: 9, opacity: 0.4, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 0.8 },
  mDiv: { width: 1, background: "rgba(255,255,255,0.08)", margin: "10px 0" },

  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 },
  calHeader: { textAlign: "center", fontSize: 8, opacity: 0.3, fontFamily: "'DM Mono', monospace", paddingBottom: 5 },
  calDay: { borderRadius: 7, padding: "4px 2px", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minHeight: 38 },
  calNum: { fontSize: 10, fontWeight: 600, opacity: 0.65 },
  calCount: { fontSize: 11, fontWeight: 800, color: "#e8a838" },

  listRow: { display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  listDot: { fontSize: 12, width: 18, textAlign: "center" },
  listDate: { flex: 1, fontSize: 11, opacity: 0.55, textTransform: "capitalize" },
  listVal: { fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace" },
};
