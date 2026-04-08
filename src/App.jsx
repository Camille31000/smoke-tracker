import { useState, useEffect } from "react";

const PRICE_PER_PACK = 12.5;
const CIGS_PER_PACK = 20;
const PRICE_PER_CIG = PRICE_PER_PACK / CIGS_PER_PACK;
const MINUTES_PER_CIG = 11; // minutes de vie perdus par cigarette (estimation médicale)

const HEALTH_FACTS = [
  "Chaque cigarette réduit ton espérance de vie d'environ 11 minutes.",
  "20 minutes après la dernière : ta tension artérielle baisse déjà.",
  "La nicotine atteint le cerveau en 10 secondes.",
  "Les cils bronchiques commencent à récupérer après 72h sans fumer.",
  "Fumer augmente le risque de maladies cardiovasculaires de 2 à 4 fois.",
  "La fumée contient plus de 70 substances cancérigènes connues.",
  "Le CO dans la fumée réduit l'oxygène dans ton sang.",
];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function loadData() {
  try {
    const raw = localStorage.getItem("smoketracker_v1");
    return raw ? JSON.parse(raw) : { days: {}, startDate: getToday() };
  } catch {
    return { days: {}, startDate: getToday() };
  }
}

function saveData(data) {
  localStorage.setItem("smoketracker_v1", JSON.stringify(data));
}

function formatTime(minutes) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function SmokeTracker() {
  const [data, setData] = useState(loadData);
  const [factIndex, setFactIndex] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const today = getToday();
  const todayCount = data.days[today] || 0;

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((i) => (i + 1) % HEALTH_FACTS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const totalCigs = Object.values(data.days).reduce((a, b) => a + b, 0);
  const totalMoney = totalCigs * PRICE_PER_CIG;
  const totalMinutes = totalCigs * MINUTES_PER_CIG;

  const dayCount = Object.keys(data.days).length || 1;
  const avgPerDay = totalCigs / dayCount;

  function addCig() {
    setPulse(true);
    setTimeout(() => setPulse(false), 400);
    setData((prev) => ({
      ...prev,
      days: { ...prev.days, [today]: (prev.days[today] || 0) + 1 },
    }));
  }

  function removeCig() {
    if (todayCount === 0) return;
    setData((prev) => ({
      ...prev,
      days: { ...prev.days, [today]: prev.days[today] - 1 },
    }));
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("fr-CA", { weekday: "short" });
    return { key, label, count: data.days[key] || 0 };
  });
  const maxBar = Math.max(...last7.map((d) => d.count), 1);

  return (
    <div style={styles.root}>
      <div style={styles.grain} />

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>🚬</span>
        <h1 style={styles.title}>smoke<em>less</em></h1>
        <p style={styles.sub}>ton compteur personnel</p>
      </div>

      {/* Today counter */}
      <div style={styles.card}>
        <p style={styles.cardLabel}>aujourd'hui</p>
        <div style={styles.counterRow}>
          <button style={styles.btnMinus} onClick={removeCig}>−</button>
          <div style={{ ...styles.countDisplay, ...(pulse ? styles.pulse : {}) }}>
            <span style={styles.countNum}>{todayCount}</span>
            <span style={styles.countUnit}>cig</span>
          </div>
          <button style={styles.btnPlus} onClick={addCig}>+</button>
        </div>
        <p style={styles.cardSub}>
          ≈ {(todayCount * PRICE_PER_CIG).toFixed(2)} $ · {formatTime(todayCount * MINUTES_PER_CIG)} de vie
        </p>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <div style={styles.statBox}>
          <span style={styles.statVal}>{totalCigs}</span>
          <span style={styles.statLabel}>au total</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statBox}>
          <span style={styles.statVal}>{totalMoney.toFixed(0)} $</span>
          <span style={styles.statLabel}>dépensés</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statBox}>
          <span style={styles.statVal}>{avgPerDay.toFixed(1)}</span>
          <span style={styles.statLabel}>/ jour moy.</span>
        </div>
      </div>

      {/* Time lost */}
      <div style={styles.timeLost}>
        <span style={styles.timeLostIcon}>⏳</span>
        <div>
          <p style={styles.timeLostLabel}>temps de vie fumé</p>
          <p style={styles.timeLostVal}>{formatTime(totalMinutes)}</p>
        </div>
      </div>

      {/* 7-day chart */}
      <div style={styles.card}>
        <p style={styles.cardLabel}>7 derniers jours</p>
        <div style={styles.chartRow}>
          {last7.map((d) => (
            <div key={d.key} style={styles.barCol}>
              <div style={styles.barTrack}>
                <div
                  style={{
                    ...styles.barFill,
                    height: `${(d.count / maxBar) * 100}%`,
                    background: d.key === today ? "#e8a838" : "#c97b2a",
                    opacity: d.key === today ? 1 : 0.55,
                  }}
                />
              </div>
              <span style={styles.barNum}>{d.count}</span>
              <span style={styles.barLabel}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Health fact */}
      <div style={styles.factBox}>
        <span style={styles.factIcon}>💡</span>
        <p style={styles.factText} key={factIndex}>{HEALTH_FACTS[factIndex]}</p>
      </div>

      <p style={styles.footer}>données stockées localement · aucun compte requis</p>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:ital@0;1&display=swap');
        @keyframes pulseAnim { 0%{transform:scale(1)} 50%{transform:scale(1.18)} 100%{transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .fact-fade { animation: fadeUp 0.5s ease; }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#1a1208",
    color: "#f2e8d5",
    fontFamily: "'Syne', sans-serif",
    padding: "28px 20px 60px",
    maxWidth: 420,
    margin: "0 auto",
    position: "relative",
    overflowX: "hidden",
  },
  grain: {
    position: "fixed",
    inset: 0,
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
    opacity: 0.4,
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    textAlign: "center",
    marginBottom: 28,
    position: "relative",
    zIndex: 1,
  },
  logo: { fontSize: 36 },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 32,
    fontWeight: 800,
    margin: "4px 0 0",
    letterSpacing: "-1px",
    color: "#f2e8d5",
  },
  sub: { fontSize: 13, opacity: 0.5, margin: 0, fontFamily: "'DM Mono', monospace", fontStyle: "italic" },

  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "20px 20px 16px",
    marginBottom: 14,
    position: "relative",
    zIndex: 1,
  },
  cardLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    opacity: 0.45,
    textTransform: "uppercase",
    letterSpacing: 2,
    margin: "0 0 12px",
  },
  cardSub: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    opacity: 0.5,
    textAlign: "center",
    margin: "8px 0 0",
  },

  counterRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  btnMinus: {
    width: 48, height: 48,
    borderRadius: "50%",
    border: "1.5px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "#f2e8d5",
    fontSize: 26,
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s",
  },
  btnPlus: {
    width: 56, height: 56,
    borderRadius: "50%",
    border: "none",
    background: "#e8a838",
    color: "#1a1208",
    fontSize: 30,
    fontWeight: 800,
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 0 20px rgba(232,168,56,0.35)",
    transition: "transform 0.1s",
  },
  countDisplay: {
    display: "flex", flexDirection: "column", alignItems: "center",
    minWidth: 80,
  },
  countNum: { fontSize: 64, fontWeight: 800, lineHeight: 1, color: "#e8a838" },
  countUnit: { fontSize: 12, opacity: 0.4, fontFamily: "'DM Mono', monospace" },
  pulse: { animation: "pulseAnim 0.4s ease" },

  statsRow: {
    display: "flex",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    position: "relative",
    zIndex: 1,
  },
  statBox: {
    flex: 1,
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "16px 8px",
    gap: 4,
  },
  statVal: { fontSize: 22, fontWeight: 700, color: "#f2e8d5" },
  statLabel: { fontSize: 10, opacity: 0.4, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 1 },
  statDivider: { width: 1, background: "rgba(255,255,255,0.08)", margin: "12px 0" },

  timeLost: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "rgba(232,168,56,0.08)",
    border: "1px solid rgba(232,168,56,0.2)",
    borderRadius: 16,
    padding: "16px 20px",
    marginBottom: 14,
    position: "relative",
    zIndex: 1,
  },
  timeLostIcon: { fontSize: 28 },
  timeLostLabel: { margin: 0, fontSize: 11, opacity: 0.5, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 1 },
  timeLostVal: { margin: "2px 0 0", fontSize: 26, fontWeight: 700, color: "#e8a838" },

  chartRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 6,
    height: 90,
  },
  barCol: {
    flex: 1,
    display: "flex", flexDirection: "column", alignItems: "center",
    height: "100%",
    gap: 3,
  },
  barTrack: {
    flex: 1, width: "100%",
    display: "flex", alignItems: "flex-end",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 4,
    transition: "height 0.4s ease",
    minHeight: 2,
  },
  barNum: { fontSize: 11, fontWeight: 700, opacity: 0.8 },
  barLabel: { fontSize: 9, opacity: 0.35, fontFamily: "'DM Mono', monospace" },

  factBox: {
    display: "flex", gap: 12, alignItems: "flex-start",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: "16px 18px",
    marginBottom: 14,
    position: "relative",
    zIndex: 1,
  },
  factIcon: { fontSize: 18, marginTop: 1 },
  factText: {
    margin: 0, fontSize: 13, lineHeight: 1.6, opacity: 0.7,
    animation: "fadeUp 0.5s ease",
  },

  footer: {
    textAlign: "center",
    fontSize: 10,
    opacity: 0.25,
    fontFamily: "'DM Mono', monospace",
    position: "relative",
    zIndex: 1,
    marginTop: 8,
  },
};
