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
function getMonthKey(d) { return d.slice(0, 7); }
function getMonthLabel(k) {
  const [y, m] = k.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("fr-CA", { month: "long", year: "numeric" });
}
function getDaysInMonth(k) {
  const [y, m] = k.split("-");
  const days = [], d = new Date(+y, +m - 1, 1);
  while (d.getMonth() === +m - 1) { days.push(d.toISOString().split("T")[0]); d.setDate(d.getDate() + 1); }
  return days;
}
function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" });
}
function formatTime(min) {
  if (min < 60) return `${Math.round(min)}min`;
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return m > 0 ? `${h}h${m}` : `${h}h`;
}
function loadData() {
  try {
    const r = localStorage.getItem("smoketracker_v1");
    return r ? JSON.parse(r) : { days: {}, startDate: getToday() };
  } catch { return { days: {}, startDate: getToday() }; }
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState("home");
  const [factIndex, setFactIndex] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(getMonthKey(getToday()));
  const [popup, setPopup] = useState(null);

  const today = getToday();
  const todayCount = data.days[today] || 0;

  useEffect(() => { localStorage.setItem("smoketracker_v1", JSON.stringify(data)); }, [data]);
  useEffect(() => {
    const i = setInterval(() => setFactIndex(f => (f + 1) % HEALTH_FACTS.length), 6000);
    return () => clearInterval(i);
  }, []);

  function addCig() {
    setPulse(true); setTimeout(() => setPulse(false), 400);
    setData(p => ({ ...p, days: { ...p.days, [today]: (p.days[today] || 0) + 1 } }));
  }
  function removeCig() {
    if (!todayCount) return;
    setData(p => ({ ...p, days: { ...p.days, [today]: p.days[today] - 1 } }));
  }

  function openPopup(day) {
    if (day > today) return;
    setPopup({ day, inputVal: String(data.days[day] || 0) });
  }
  function savePopup() {
    const count = Math.max(0, parseInt(popup.inputVal) || 0);
    setData(p => ({ ...p, days: { ...p.days, [popup.day]: count } }));
    setPopup(null);
  }

  const totalCigs = Object.values(data.days).reduce((a, b) => a + b, 0);
  const totalMoney = totalCigs * PRICE_PER_CIG;
  const totalMin = totalCigs * MINUTES_PER_CIG;
  const dayCount = Math.max(Object.keys(data.days).length, 1);
  const avg = totalCigs / dayCount;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    return { key, label: d.toLocaleDateString("fr-CA", { weekday: "short" }).slice(0, 3), count: data.days[key] || 0 };
  });
  const maxBar = Math.max(...last7.map(d => d.count), 1);

  const allMonths = (() => {
    const keys = new Set(Object.keys(data.days).map(getMonthKey));
    keys.add(getMonthKey(today));
    return Array.from(keys).sort().reverse();
  })();
  const monthDays = getDaysInMonth(historyMonth);
  const firstDOW = new Date(historyMonth + "-01T12:00:00").getDay();
  const monthTotal = monthDays.reduce((a, d) => a + (data.days[d] || 0), 0);
  const maxDayMonth = Math.max(...monthDays.map(d => data.days[d] || 0), 1);
  const monthDaysLogged = monthDays.filter(d => d <= today && data.days[d] !== undefined);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; overflow: hidden; background: #1a1208; }
        @keyframes pulseAnim { 0%{transform:scale(1)} 50%{transform:scale(1.15)} 100%{transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        button { cursor: pointer; }
        button:active { opacity: 0.7; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ height: "100dvh", width: "100%", background: "#1a1208", color: "#f2e8d5", fontFamily: "'Syne', sans-serif", display: "flex", flexDirection: "column", maxWidth: 440, margin: "0 auto", overflow: "hidden", position: "relative" }}>

        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")", opacity: 0.4, pointerEvents: "none", zIndex: 0 }} />

        {/* Popup */}
        {popup && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px" }} onClick={() => setPopup(null)}>
            <div style={{ background: "#221508", border: "1px solid rgba(232,168,56,0.2)", borderRadius: 20, padding: "24px 20px", width: "100%", display: "flex", flexDirection: "column", gap: 16 }} onClick={e => e.stopPropagation()}>
              <div>
                <p style={{ fontSize: 11, opacity: 0.4, fontFamily: "'DM Mono'", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>modifier</p>
                <p style={{ fontSize: 14, fontWeight: 700, textTransform: "capitalize" }}>{formatDate(popup.day)}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="number"
                  value={popup.inputVal}
                  onChange={e => setPopup(p => ({ ...p, inputVal: e.target.value }))}
                  style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(232,168,56,0.25)", borderRadius: 12, color: "#f2e8d5", fontSize: 28, fontWeight: 700, fontFamily: "'Syne'", padding: "10px 14px", textAlign: "center", outline: "none" }}
                  autoFocus
                />
                <span style={{ fontSize: 16, opacity: 0.5, fontFamily: "'DM Mono'" }}>cig</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2, 3, 4, 5].map(v => (
                  <button key={v} onClick={() => setPopup(p => ({ ...p, inputVal: String(v) }))} style={{ flex: 1, background: "rgba(232,168,56,0.1)", border: "1px solid rgba(232,168,56,0.2)", borderRadius: 10, color: "#f2e8d5", fontSize: 13, fontWeight: 700, padding: "8px 0" }}>{v}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setPopup(null)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 12, color: "rgba(242,232,213,0.5)", fontSize: 14, fontWeight: 600, padding: "12px 0" }}>annuler</button>
                <button onClick={savePopup} style={{ flex: 2, background: "#e8a838", border: "none", borderRadius: 12, color: "#1a1208", fontSize: 14, fontWeight: 700, padding: "12px 0" }}>enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <div style={{ display: "flex", gap: 4, padding: "12px 14px 8px", flexShrink: 0, zIndex: 2, background: "#1a1208" }}>
          {["home", "stats", "history"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ flex: 1, background: view === v ? "rgba(232,168,56,0.12)" : "rgba(255,255,255,0.04)", border: "none", color: view === v ? "#e8a838" : "rgba(242,232,213,0.35)", fontSize: 12, padding: "8px 0", borderRadius: 10, fontFamily: "'Syne', sans-serif", fontWeight: 700, letterSpacing: "0.3px" }}>
              {v === "home" ? "aujourd'hui" : v === "stats" ? "stats" : "historique"}
            </button>
          ))}
        </div>

        {/* ── HOME ── */}
        {view === "home" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 16px 16px", gap: 10, zIndex: 1, overflow: "hidden" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26 }}>🚬</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-1px" }}>smoke<em>less</em></h1>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px 16px 10px", flexShrink: 0 }}>
              <p style={{ fontFamily: "'DM Mono'", fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>aujourd'hui</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
                <button onClick={removeCig} style={{ width: 44, height: 44, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.15)", background: "transparent", color: "#f2e8d5", fontSize: 24 }}>−</button>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 70, ...(pulse ? { animation: "pulseAnim 0.4s ease" } : {}) }}>
                  <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, color: "#e8a838" }}>{todayCount}</span>
                  <span style={{ fontSize: 10, opacity: 0.4, fontFamily: "'DM Mono'" }}>cig</span>
                </div>
                <button onClick={addCig} style={{ width: 52, height: 52, borderRadius: "50%", border: "none", background: "#e8a838", color: "#1a1208", fontSize: 28, fontWeight: 800, boxShadow: "0 0 18px rgba(232,168,56,0.35)" }}>+</button>
              </div>
              <p style={{ fontFamily: "'DM Mono'", fontSize: 11, opacity: 0.45, textAlign: "center", marginTop: 8 }}>
                ≈ {(todayCount * PRICE_PER_CIG).toFixed(2)} $ · {formatTime(todayCount * MINUTES_PER_CIG)} de vie
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "12px 14px 10px", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <p style={{ fontFamily: "'DM Mono'", fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, flexShrink: 0 }}>7 derniers jours</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 5, flex: 1, minHeight: 0 }}>
                {last7.map(d => (
                  <div key={d.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", gap: 3 }}>
                    <div style={{ flex: 1, width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                      <div style={{ width: "100%", borderRadius: 4, minHeight: 2, transition: "height 0.4s ease", height: `${(d.count / maxBar) * 100}%`, background: d.key === today ? "#e8a838" : "#c97b2a", opacity: d.key === today ? 1 : 0.55 }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.8 }}>{d.count}</span>
                    <span style={{ fontSize: 8, opacity: 0.35, fontFamily: "'DM Mono'" }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "10px 14px", flexShrink: 0 }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <p key={factIndex} style={{ fontSize: 11, lineHeight: 1.55, opacity: 0.65, animation: "fadeUp 0.5s ease" }}>{HEALTH_FACTS[factIndex]}</p>
            </div>
          </div>
        )}

        {/* ── STATS ── */}
        {view === "stats" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 16px 16px", gap: 10, zIndex: 1, overflow: "hidden" }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-1px", textAlign: "center" }}>stats</h1>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flexShrink: 0 }}>
              {[
                { val: totalCigs, lbl: "cigarettes fumées" },
                { val: `${totalMoney.toFixed(0)} $`, lbl: "dépensés" },
                { val: avg.toFixed(1), lbl: "par jour en moy." },
                { val: formatTime(totalMin), lbl: "de vie fumée" },
              ].map(({ val, lbl }) => (
                <div key={lbl} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 12px" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#e8a838" }}>{val}</div>
                  <div style={{ fontSize: 10, opacity: 0.4, fontFamily: "'DM Mono'", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 }}>{lbl}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px 16px", flexShrink: 0 }}>
              <p style={{ fontFamily: "'DM Mono'", fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>si tu arrêtais aujourd'hui</p>
              <div style={{ display: "flex", alignItems: "center" }}>
                {[
                  { val: `${(avg * 30 * PRICE_PER_CIG).toFixed(0)} $`, lbl: "économisés / mois" },
                  { val: `${(avg * 365 * PRICE_PER_CIG).toFixed(0)} $`, lbl: "économisés / an" },
                ].map(({ val, lbl }, i) => (
                  <>
                    {i === 1 && <div key="div" style={{ width: 1, height: 40, background: "rgba(255,255,255,0.08)" }} />}
                    <div key={lbl} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "#e8a838" }}>{val}</span>
                      <span style={{ fontSize: 10, opacity: 0.4, fontFamily: "'DM Mono'", textTransform: "uppercase", letterSpacing: 0.8 }}>{lbl}</span>
                    </div>
                  </>
                ))}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <p style={{ fontFamily: "'DM Mono'", fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>⏳ temps de vie fumée</p>
              <p style={{ fontSize: 38, fontWeight: 800, color: "#e8a838" }}>{formatTime(totalMin)}</p>
              <p style={{ fontSize: 11, opacity: 0.4, fontFamily: "'DM Mono'", marginTop: 4 }}>soit {formatTime(avg * MINUTES_PER_CIG)} perdues par jour</p>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {view === "history" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 16px 16px", gap: 10, zIndex: 1, overflow: "hidden" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <button onClick={() => { const i = allMonths.indexOf(historyMonth); if (i < allMonths.length - 1) setHistoryMonth(allMonths[i + 1]); }} style={{ background: "none", border: "none", color: "#e8a838", fontSize: 22, padding: "0 8px" }}>‹</button>
              <span style={{ fontSize: 15, fontWeight: 700, textTransform: "capitalize" }}>{getMonthLabel(historyMonth)}</span>
              <button onClick={() => { const i = allMonths.indexOf(historyMonth); if (i > 0) setHistoryMonth(allMonths[i - 1]); }} style={{ background: "none", border: "none", color: "#e8a838", fontSize: 22, padding: "0 8px" }}>›</button>
            </div>

            <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, flexShrink: 0 }}>
              {[
                { val: monthTotal, lbl: "cigarettes" },
                { val: `${(monthTotal * PRICE_PER_CIG).toFixed(0)} $`, lbl: "dépensés" },
                { val: monthDaysLogged.length > 0 ? (monthTotal / monthDaysLogged.length).toFixed(1) : "—", lbl: "/ jour moy." },
              ].map(({ val, lbl }, i) => (
                <>
                  {i > 0 && <div key={`d${i}`} style={{ width: 1, background: "rgba(255,255,255,0.08)", margin: "10px 0" }} />}
                  <div key={lbl} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 6px", gap: 3 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#e8a838" }}>{val}</span>
                    <span style={{ fontSize: 9, opacity: 0.4, fontFamily: "'DM Mono'", textTransform: "uppercase", letterSpacing: 0.8 }}>{lbl}</span>
                  </div>
                </>
              ))}
            </div>

            {/* Calendrier cliquable */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "12px 10px", flexShrink: 0 }}>
              <p style={{ fontFamily: "'DM Mono'", fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>appuie sur un jour pour modifier</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                {["dim","lun","mar","mer","jeu","ven","sam"].map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 8, opacity: 0.3, fontFamily: "'DM Mono'", paddingBottom: 4 }}>{d}</div>
                ))}
                {Array.from({ length: firstDOW }).map((_, i) => <div key={`e${i}`} />)}
                {monthDays.map(day => {
                  const count = data.days[day] || 0;
                  const hasData = data.days[day] !== undefined;
                  const isFuture = day > today;
                  const intensity = hasData ? Math.min(count / maxDayMonth, 1) : 0;
                  return (
                    <button key={day} onClick={() => openPopup(day)} style={{ borderRadius: 7, padding: "4px 2px", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minHeight: 38, background: isFuture ? "transparent" : hasData ? `rgba(232,168,56,${0.08 + intensity * 0.5})` : "rgba(255,255,255,0.02)", border: day === today ? "1px solid rgba(232,168,56,0.6)" : "1px solid transparent", opacity: isFuture ? 0.2 : 1, cursor: isFuture ? "default" : "pointer" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.65, color: "#f2e8d5" }}>{+day.split("-")[2]}</span>
                      {!isFuture && hasData && <span style={{ fontSize: 11, fontWeight: 800, color: "#e8a838" }}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Liste */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "10px 14px", flex: 1, overflowY: "auto", minHeight: 0 }}>
              <p style={{ fontFamily: "'DM Mono'", fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>détail</p>
              {monthDays.filter(d => d <= today).reverse().map(day => {
                const count = data.days[day] || 0;
                const hasData = data.days[day] !== undefined;
                return (
                  <div key={day} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 12, width: 18, textAlign: "center" }}>{hasData ? (count === 0 ? "✦" : "🚬") : "·"}</span>
                    <span style={{ flex: 1, fontSize: 11, opacity: 0.55, textTransform: "capitalize" }}>{new Date(day + "T12:00:00").toLocaleDateString("fr-CA", { weekday: "short", day: "numeric", month: "short" })}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono'", color: hasData ? (count <= 2 ? "#e8a838" : count <= 4 ? "#c97b2a" : "#e05555") : "rgba(242,232,213,0.2)" }}>
                      {hasData ? `${count} cig` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
