import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { supabaseClient } from "../services/supabase.client";

type Period = "Today" | "Yesterday" | "This Week" | "This Month" | "Last Month" | "This Year" | "Last Year" | "Custom";
type Analytics = {
  success: boolean;
  error?: string;
  start: string;
  end: string;
  summary: { revenue: number; productRevenue: number; revenueItemDifference: number; discrepantOrders: number; orderCount: number; itemsSold: number; averageOrderValue: number; sessionCount: number; averageSessionSpend: number; tableOrders: number; takeawayOrders: number; previousRevenue: number; revenueChange: number | null; previousOrderCount: number; cancellationCount: number; cancelledQuantity: number; cancelledRevenue: number; cancellationRate: number; averageSessionMinutes: number | null; activeSessions: number };
  products: { product: string; category: string; quantity: number; revenue: number; contribution: number; rank: number; station: string; cancelledQuantity: number; cancelledRevenue: number; cancelledRate: number; hourly: Record<string, number> }[];
  categories: { category: string; revenue: number }[];
  stations: { station: string; revenue: number }[];
  payments: { CASH: number; CARD: number; other: number; count: number };
  trends: { date: string; orders: number; revenue: number }[];
  productTrends: { date: string; quantity: number; revenue: number }[];
  hours: { hour: number; orders: number; revenue: number }[];
  weekdays: { day: number; orders: number; revenue: number }[];
  busiestHour: { hour: number; orders: number; revenue: number };
  busiestDay: { day: number; orders: number; revenue: number };
  waiters: { id: string; name: string; payments: number; paymentCount: number; sessionsOpened: number; attributedSessionRevenue: number }[];
  attribution: { waiterOrdersAvailable: boolean; shiftSalesAvailable: boolean };
};

const ORANGE = "#FA994F";
const TURQUOISE = "#5AD7D9";
const DAY = 86400000;
const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function money(value: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value || 0);
}
function dateInput(date: Date) {
  const year = date.getFullYear(); const month = `${date.getMonth() + 1}`.padStart(2, "0"); const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function fromDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
function spanFor(period: Period) {
  const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "Yesterday") return { start: new Date(today.getTime() - DAY), end: today };
  if (period === "This Week") { const mondayOffset = (today.getDay() + 6) % 7; return { start: new Date(today.getTime() - mondayOffset * DAY), end: new Date(today.getTime() + DAY) }; }
  if (period === "This Month") return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(today.getTime() + DAY) };
  if (period === "Last Month") return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 1) };
  if (period === "This Year") return { start: new Date(now.getFullYear(), 0, 1), end: new Date(today.getTime() + DAY) };
  if (period === "Last Year") return { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear(), 0, 1) };
  return { start: today, end: new Date(today.getTime() + DAY) };
}
function previousSpan(start: Date, end: Date) { const duration = end.getTime() - start.getTime(); return { start: new Date(start.getTime() - duration), end: start }; }
function comparisonSpan(start: Date, end: Date, period: Period) {
  if (period === "This Month") {
    const elapsedDays = Math.round((end.getTime() - start.getTime()) / DAY);
    const previousMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const previousMonthEnd = new Date(start.getFullYear(), start.getMonth(), 1);
    const endDay = Math.min(elapsedDays, Math.round((previousMonthEnd.getTime() - previousMonthStart.getTime()) / DAY));
    return { start: previousMonthStart, end: new Date(previousMonthStart.getTime() + endDay * DAY) };
  }
  if (period === "Last Month") return { start: new Date(start.getFullYear(), start.getMonth() - 1, 1), end: start };
  if (period === "This Year") return {
    start: new Date(start.getFullYear() - 1, start.getMonth(), start.getDate()),
    end: new Date(end.getFullYear() - 1, end.getMonth(), end.getDate()),
  };
  if (period === "Last Year") return { start: new Date(start.getFullYear() - 1, 0, 1), end: start };
  return previousSpan(start, end);
}
function localIso(date: Date) { return date.toISOString(); }

function Card({ label, value, detail, accent = ORANGE }: { label: string; value: string; detail?: string; accent?: string }) {
  return <article style={{ background: "#fff", border: "1px solid #e7e9ed", borderTop: `3px solid ${accent}`, borderRadius: 14, padding: "18px 20px", minWidth: 0, boxShadow: "0 2px 8px rgba(17,24,39,.035)" }}><div style={{ color: "#727986", fontSize: 13, fontWeight: 700 }}>{label}</div><div style={{ fontSize: 26, fontWeight: 900, marginTop: 8, letterSpacing: "-.03em" }}>{value}</div>{detail && <div style={{ color: "#818895", fontSize: 12, marginTop: 5 }}>{detail}</div>}</article>;
}
function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section style={{ background: "#fff", border: "1px solid #e7e9ed", borderRadius: 16, padding: 20, minWidth: 0 }}><header style={{ marginBottom: 18 }}><h2 style={{ fontSize: 17, margin: 0 }}>{title}</h2>{subtitle && <p style={{ color: "#7b8290", fontSize: 12, margin: "5px 0 0" }}>{subtitle}</p>}</header>{children}</section>;
}
function BarList({ rows, value, color = ORANGE, format = (v: number) => `${v}` }: { rows: { label: string; value: number }[]; value?: number; color?: string; format?: (v: number) => string }) {
  const max = value ?? Math.max(...rows.map((row) => row.value), 1);
  if (!rows.length) return <div style={{ color: "#8b929c", padding: "12px 0" }}>No data in this period.</div>;
  return <div style={{ display: "grid", gap: 13 }}>{rows.map((row) => <div key={row.label} style={{ display: "grid", gridTemplateColumns: "minmax(90px, 1.1fr) 2fr auto", gap: 10, alignItems: "center", fontSize: 12 }}><div style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", color: "#444c59" }} title={row.label}>{row.label}</div><div style={{ height: 9, background: "#f0f2f4", borderRadius: 10, overflow: "hidden" }}><div style={{ width: `${Math.max(row.value > 0 ? 2 : 0, Math.min(100, max ? row.value / max * 100 : 0))}%`, height: "100%", background: color, borderRadius: 10 }} /></div><strong style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{format(row.value)}</strong></div>)}</div>;
}

const CHART_COLORS = [ORANGE, TURQUOISE, "#45657b", "#9a7bb5", "#84a98c", "#e4bd63", "#d97865", "#7d8ba0"];

function TrendChart({ points, color = TURQUOISE, format = money }: { points: { label: string; value: number }[]; color?: string; format?: (value: number) => string }) {
  if (!points.length) return <div style={{ color: "#8b929c", padding: "16px 0" }}>No data in this period.</div>;
  const width = 760; const height = 220; const left = 62; const right = 12; const top = 16; const bottom = 34;
  const plotWidth = width - left - right; const plotHeight = height - top - bottom;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const timestamps = points.map((point) => Date.parse(point.label));
  const isDateSeries = timestamps.every(Number.isFinite);
  const firstTimestamp = timestamps[0];
  const lastTimestamp = timestamps[timestamps.length - 1];
  const coordinates = points.map((point, index) => {
    const fraction = points.length === 1 ? 0.5 : isDateSeries && lastTimestamp > firstTimestamp ? (timestamps[index] - firstTimestamp) / (lastTimestamp - firstTimestamp) : index / (points.length - 1);
    return { ...point, x: left + fraction * plotWidth, y: top + plotHeight - point.value / maxValue * plotHeight };
  });
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${left},${top + plotHeight} ${line} ${coordinates.at(-1)?.x ?? left},${top + plotHeight}`;
  const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  return <div style={{ minWidth: 0 }}><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Trend chart with ${points.length} points`} style={{ display: "block", width: "100%", overflow: "visible" }}>
    {[0, 0.5, 1].map((fraction) => { const y = top + plotHeight * fraction; return <g key={fraction}><line x1={left} x2={width - right} y1={y} y2={y} stroke="#edf0f2" strokeDasharray={fraction === 1 ? undefined : "3 5"} /><text x={left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#8b929c">{format(maxValue * (1 - fraction))}</text></g>; })}
    <polygon points={area} fill={`${color}22`} />
    <polyline points={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    {coordinates.map((point) => <circle key={point.label} cx={point.x} cy={point.y} r={points.length < 25 ? 4 : 2.5} fill="#fff" stroke={color} strokeWidth="2"><title>{`${point.label}: ${format(point.value)}`}</title></circle>)}
    {labelIndexes.map((index) => <text key={index} x={coordinates[index].x} y={height - 8} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} fontSize="10" fill="#818895">{coordinates[index].label}</text>)}
  </svg></div>;
}

function DonutChart({ rows, format = money, centerLabel = "Total" }: { rows: { label: string; value: number }[]; format?: (value: number) => string; centerLabel?: string }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  if (!rows.length || !total) return <div style={{ color: "#8b929c", padding: "16px 0" }}>No data in this period.</div>;
  const circumference = 2 * Math.PI * 52;
  let offset = 0;
  const slices = rows.map((row, index) => {
    const length = row.value / total * circumference;
    const slice = { ...row, color: CHART_COLORS[index % CHART_COLORS.length], length, offset };
    offset += length;
    return slice;
  });
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))", alignItems: "center", gap: 14 }}>
    <div style={{ position: "relative", width: "100%", maxWidth: 180, margin: "0 auto" }}><svg viewBox="0 0 140 140" role="img" aria-label={`Donut chart; total ${format(total)}`} style={{ display: "block", width: "100%", transform: "rotate(-90deg)" }}><circle cx="70" cy="70" r="52" fill="none" stroke="#f0f2f4" strokeWidth="17" />{slices.map((slice) => <circle key={slice.label} cx="70" cy="70" r="52" fill="none" stroke={slice.color} strokeWidth="17" strokeDasharray={`${slice.length} ${circumference - slice.length}`} strokeDashoffset={-slice.offset}><title>{`${slice.label}: ${format(slice.value)}`}</title></circle>)}</svg><div style={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", textAlign: "center", pointerEvents: "none" }}><strong style={{ fontSize: 17, lineHeight: 1.15 }}>{format(total)}</strong><span style={{ marginTop: 3, fontSize: 10, color: "#858c97" }}>{centerLabel}</span></div></div>
    <div style={{ display: "grid", gap: 9, maxHeight: 225, overflowY: "auto" }}>{slices.map((slice) => <div key={slice.label} style={{ display: "grid", gridTemplateColumns: "9px minmax(0,1fr) auto", alignItems: "center", gap: 8, fontSize: 11 }}><span style={{ width: 8, height: 8, borderRadius: 9, background: slice.color }} /><span style={{ color: "#525a66", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }} title={slice.label}>{slice.label}</span><strong style={{ fontVariantNumeric: "tabular-nums" }}>{format(slice.value)} <span style={{ color: "#858c97", fontWeight: 500 }}>({(slice.value / total * 100).toFixed(0)}%)</span></strong></div>)}</div>
  </div>;
}

function LollipopChart({ rows, format = money, color = ORANGE }: { rows: { label: string; value: number }[]; format?: (value: number) => string; color?: string }) {
  if (!rows.length) return <div style={{ color: "#8b929c", padding: "12px 0" }}>No data in this period.</div>;
  const max = Math.max(...rows.map((row) => row.value), 1);
  return <div style={{ display: "grid", gap: 15 }}>{rows.map((row, index) => <div key={`${row.label}-${index}`} style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(90px,1.8fr) auto", gap: 10, alignItems: "center", fontSize: 12 }}><span style={{ color: "#454d59", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }} title={row.label}>{String(index + 1).padStart(2, "0")} · {row.label}</span><div style={{ height: 2, background: "#e9ecef", position: "relative" }}><span style={{ position: "absolute", inset: "-3px auto -3px 0", width: `${Math.max(row.value > 0 ? 2 : 0, row.value / max * 100)}%`, background: color, borderRadius: 4 }} /><span style={{ position: "absolute", left: `${Math.min(100, row.value / max * 100)}%`, top: "50%", width: 11, height: 11, borderRadius: "50%", background: color, border: "2px solid #fff", boxShadow: "0 0 0 1px #dfe3e8", transform: "translate(-50%,-50%)" }} /></div><strong style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{format(row.value)}</strong></div>)}</div>;
}

function HourHeatmap({ rows }: { rows: { hour: number; orders: number; revenue: number }[] }) {
  const max = Math.max(...rows.map((row) => row.orders), 1);
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 6 }}>{rows.map((row) => { const intensity = row.orders / max; return <div key={row.hour} title={`${String(row.hour).padStart(2, "0")}:00 · ${row.orders} orders · ${money(row.revenue)}`} style={{ minHeight: 54, padding: "7px 5px", borderRadius: 8, display: "grid", alignContent: "space-between", background: row.orders ? `rgba(90,215,217,${0.15 + intensity * 0.75})` : "#f3f5f6", color: intensity > 0.55 ? "#14383b" : "#68727d" }}><span style={{ fontSize: 10, fontWeight: 700 }}>{String(row.hour).padStart(2, "0")}:00</span><strong style={{ fontSize: 14 }}>{row.orders}</strong></div>; })}</div>;
}

function WeekdayChart({ rows }: { rows: { day: number; orders: number; revenue: number }[] }) {
  const ordered = [...rows].sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7));
  const max = Math.max(...ordered.map((row) => row.orders), 1);
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 5, alignItems: "end", minHeight: 145 }}>{ordered.map((row) => <div key={row.day} title={`${weekdayNames[row.day]} · ${row.orders} orders · ${money(row.revenue)}`} style={{ display: "grid", justifyItems: "center", gap: 7 }}><div style={{ height: 82, width: "100%", display: "flex", alignItems: "end", justifyContent: "center" }}><div style={{ width: "min(30px,70%)", height: `${Math.max(row.orders ? 10 : 0, row.orders / max * 100)}%`, borderRadius: "7px 7px 3px 3px", background: row.orders ? TURQUOISE : "#edf0f2", position: "relative" }}><span style={{ position: "absolute", top: -19, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "#69727e", whiteSpace: "nowrap" }}>{row.orders}</span></div></div><span style={{ fontSize: 10, color: "#737b86" }}>{weekdayNames[row.day].slice(0, 3)}</span></div>)}</div>;
}

function SegmentedMix({ rows, format = money }: { rows: { label: string; value: number }[]; format?: (value: number) => string }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  if (!total) return <div style={{ color: "#8b929c", padding: "12px 0" }}>No data in this period.</div>;
  return <div><div style={{ display: "flex", height: 13, overflow: "hidden", borderRadius: 10, background: "#eff1f3" }}>{rows.map((row, index) => <span key={row.label} title={`${row.label}: ${format(row.value)}`} style={{ width: `${row.value / total * 100}%`, background: CHART_COLORS[index % CHART_COLORS.length] }} />)}</div><div style={{ display: "grid", gridTemplateColumns: `repeat(${rows.length},minmax(0,1fr))`, gap: 10, marginTop: 13 }}>{rows.map((row, index) => <div key={row.label} style={{ fontSize: 11 }}><div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6f7783" }}><span style={{ width: 8, height: 8, borderRadius: 8, background: CHART_COLORS[index % CHART_COLORS.length] }} />{row.label}</div><strong style={{ display: "block", marginTop: 4, fontSize: 15 }}>{format(row.value)}</strong><small style={{ color: "#858c97" }}>{(row.value / total * 100).toFixed(0)}%</small></div>)}</div></div>;
}

function QuietRanking({ rows }: { rows: { label: string; value: number }[] }) {
  if (!rows.length) return <div style={{ color: "#8b929c", padding: "12px 0" }}>No products in this period.</div>;
  return <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 3 }}>{rows.map((row, index) => <li key={`${row.label}-${index}`} style={{ display: "grid", gridTemplateColumns: "28px minmax(0,1fr) auto", alignItems: "center", gap: 9, padding: "8px 0", borderBottom: "1px solid #f0f1f3" }}><span style={{ color: "#9aa1aa", fontSize: 11, fontWeight: 800 }}>{String(index + 1).padStart(2, "0")}</span><span style={{ fontSize: 12, color: "#49515c" }}>{row.label}</span><strong style={{ minWidth: 48, textAlign: "right", background: "#f4f5f6", borderRadius: 6, padding: "4px 7px", fontSize: 11 }}>{row.value} sold</strong></li>)}</ol>;
}

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const initial = spanFor("This Month");
  const [period, setPeriod] = useState<Period>("This Month");
  const [startDate, setStartDate] = useState(dateInput(initial.start));
  const [endDate, setEndDate] = useState(dateInput(new Date(initial.end.getTime() - DAY)));
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState("Overview");
  const [waiterId, setWaiterId] = useState("");

  const range = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = fromDateInput(startDate); const end = new Date(fromDateInput(endDate).getTime() + DAY);
    if (end <= start) return null;
    return { start, end, previous: comparisonSpan(start, end, period) };
  }, [startDate, endDate, period]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setAnalytics(null);
      if (!range) { setError("The end date must be on or after the start date."); setLoading(false); return; }
      setLoading(true); setError(null);
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.access_token) throw new Error("Admin session expired. Please sign in again.");
        const params = new URLSearchParams({ start: localIso(range.start), end: localIso(range.end), previousStart: localIso(range.previous.start), previousEnd: localIso(range.previous.end) });
        const response = await fetch(`/api/admin/analytics?${params}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        const result = await response.json() as Analytics;
        if (!response.ok || !result.success) throw new Error(result.error || "Could not load analytics.");
        if (!cancelled) setAnalytics(result);
      } catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : "Could not load analytics."); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [range]);

  function choosePeriod(next: Period) {
    setPeriod(next);
    if (next === "Custom") return;
    const span = spanFor(next);
    setStartDate(dateInput(span.start)); setEndDate(dateInput(new Date(span.end.getTime() - DAY)));
  }

  const data = analytics;
  const selectedWaiter = data?.waiters.find((waiter) => waiter.id === waiterId) || data?.waiters[0];
  const topProducts = data?.products.slice(0, 8) ?? [];
  const lowestProducts = [...(data?.products ?? [])].sort((a, b) => a.quantity - b.quantity).slice(0, 5);
  const navItems = ["Overview", "Products", "Waiters", "Operations"];
  const dateSummary = range ? `${range.start.toLocaleDateString()} – ${new Date(range.end.getTime() - DAY).toLocaleDateString()}` : "Choose a valid range";

  return <main style={{ minHeight: "100vh", background: "#f5f6f8", color: "#171b23", padding: "24px clamp(16px, 3vw, 40px) 48px", boxSizing: "border-box" }}>
    <div style={{ maxWidth: 1440, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap", marginBottom: 22 }}>
        <div><div style={{ color: "#737b86", fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>AIOLIA / ADMIN</div><h1 style={{ margin: "5px 0 4px", fontSize: 30, letterSpacing: "-.035em" }}>Analytics</h1><div style={{ color: "#737b86", fontSize: 13 }}>{dateSummary}</div></div>
        <button onClick={() => navigate("/admin")} style={{ border: "1px solid #dadee4", background: "#fff", borderRadius: 9, minHeight: 42, padding: "0 14px", fontWeight: 750, cursor: "pointer" }}>← Admin dashboard</button>
      </header>

      <section style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end", background: "#fff", border: "1px solid #e7e9ed", borderRadius: 14, padding: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: "1 1 450px" }}>{(["Today", "Yesterday", "This Week", "This Month", "Last Month", "This Year", "Last Year"] as Period[]).map((name) => <button key={name} onClick={() => choosePeriod(name)} style={{ border: period === name ? `1px solid ${ORANGE}` : "1px solid #e4e6e9", color: period === name ? "#8b4611" : "#525a66", background: period === name ? "#fff3e9" : "#fff", borderRadius: 8, padding: "8px 11px", fontSize: 12, fontWeight: 750, cursor: "pointer" }}>{name}</button>)}</div>
        <label style={{ fontSize: 11, fontWeight: 800, color: "#6c7480" }}>START<input type="date" value={startDate} onChange={(e) => { setPeriod("Custom"); setStartDate(e.target.value); }} style={{ display: "block", marginTop: 5, minHeight: 36, border: "1px solid #dadee4", borderRadius: 8, padding: "0 8px", color: "#20242a" }} /></label>
        <label style={{ fontSize: 11, fontWeight: 800, color: "#6c7480" }}>END<input type="date" value={endDate} onChange={(e) => { setPeriod("Custom"); setEndDate(e.target.value); }} style={{ display: "block", marginTop: 5, minHeight: 36, border: "1px solid #dadee4", borderRadius: 8, padding: "0 8px", color: "#20242a" }} /></label>
      </section>

      <nav style={{ display: "flex", borderBottom: "1px solid #dfe3e8", gap: 22, marginBottom: 18, overflowX: "auto" }}>{navItems.map((name) => <button key={name} onClick={() => setSection(name)} style={{ background: "none", border: "none", borderBottom: section === name ? `3px solid ${TURQUOISE}` : "3px solid transparent", padding: "10px 2px", color: section === name ? "#151a20" : "#727985", fontWeight: 800, whiteSpace: "nowrap", cursor: "pointer" }}>{name}</button>)}</nav>

      {error && <div role="alert" style={{ padding: 13, border: "1px solid #fecaca", color: "#991b1b", background: "#fff1f2", borderRadius: 10, marginBottom: 16 }}>{error}</div>}
      {loading && <div style={{ margin: "0 0 14px", color: "#7b8290", fontSize: 13 }}>Updating analytics for {dateSummary}…</div>}
      {!data ? !loading && <div style={{ padding: 30, textAlign: "center", background: "#fff", borderRadius: 14, color: "#7b8290" }}>Analytics are not available for this range.</div> : <>
        {section === "Overview" && <>
          {data.summary.discrepantOrders > 0 && <div role="status" style={{ marginBottom: 14, padding: 12, border: "1px solid #f3cfad", background: "#fff8f1", borderRadius: 10, color: "#76522f", fontSize: 12 }}>Stored order totals differ from active item totals for {data.summary.discrepantOrders} orders in this period. Product-level totals are shown in Products and are calculated from item rows.</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 16 }}>
            <Card label="NET ORDER SALES" value={money(data.summary.revenue)} detail={data.summary.revenueChange === null ? "No previous period to compare" : `${data.summary.revenueChange >= 0 ? "+" : ""}${data.summary.revenueChange.toFixed(1)}% vs previous equivalent period`} />
            <Card label="ORDERS" value={`${data.summary.orderCount}`} detail={`${data.summary.tableOrders} dine-in · ${data.summary.takeawayOrders} takeaway`} accent={TURQUOISE} />
            <Card label="AVERAGE ORDER" value={money(data.summary.averageOrderValue)} detail={`${data.summary.previousOrderCount} orders in the previous period`} />
            <Card label="ITEMS SOLD" value={`${data.summary.itemsSold}`} detail={`${data.summary.cancelledQuantity} cancelled units excluded`} accent={TURQUOISE} />
            <Card label="AVG. SESSION SPEND" value={money(data.summary.averageSessionSpend)} detail={`${data.summary.sessionCount} table sessions with orders`} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 14, marginBottom: 14 }}>
            <Panel title="Revenue trend" subtitle="Order totals by order date, grouped by UTC day · EUR"><TrendChart points={data.trends.map((entry) => ({ label: entry.date, value: entry.revenue }))} /><div style={{ color: "#858c97", fontSize: 11, marginTop: 4 }}>{data.trends.reduce((sum, entry) => sum + entry.orders, 0)} orders across {data.trends.length} active days</div></Panel>
            <Panel title="Payment methods" subtitle={`${data.payments.count} recorded payments`}><DonutChart rows={[{ label: "Cash", value: data.payments.CASH }, { label: "Card", value: data.payments.CARD }]} centerLabel="Collected" /><div style={{ borderTop: "1px solid #eceef0", marginTop: 14, paddingTop: 11, color: "#747c87", fontSize: 12 }}>Cash and card recorded in the selected period.</div></Panel>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}><Panel title="Top products" subtitle="Ranked by active quantity sold"><BarList rows={topProducts.slice(0, 5).map((item) => ({ label: item.product, value: item.quantity }))} color={TURQUOISE} /></Panel><Panel title="Restaurant pulse"><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><div><small style={{ color: "#858c97" }}>Busiest hour (UTC)</small><div style={{ fontSize: 21, fontWeight: 900, marginTop: 4 }}>{`${`${data.busiestHour.hour}`.padStart(2, "0")}:00`}</div><small>{data.busiestHour.orders} orders</small></div><div><small style={{ color: "#858c97" }}>Busiest weekday (UTC)</small><div style={{ fontSize: 21, fontWeight: 900, marginTop: 4 }}>{weekdayNames[data.busiestDay.day]}</div><small>{data.busiestDay.orders} orders</small></div><div><small style={{ color: "#858c97" }}>Avg. closed session</small><div style={{ fontSize: 21, fontWeight: 900, marginTop: 4 }}>{data.summary.averageSessionMinutes == null ? "—" : `${Math.round(data.summary.averageSessionMinutes)} min`}</div></div><div><small style={{ color: "#858c97" }}>Open sessions</small><div style={{ fontSize: 21, fontWeight: 900, marginTop: 4 }}>{data.summary.activeSessions}</div></div></div></Panel></div>
        </>}

        {section === "Products" && <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 14, marginBottom: 14 }}><Panel title="Best sellers" subtitle="Quantity sold; cancelled units excluded"><BarList rows={topProducts.slice(0, 8).map((item) => ({ label: item.product, value: item.quantity }))} color={TURQUOISE} /></Panel><Panel title="Revenue leaders" subtitle="Ranked product revenue · EUR"><LollipopChart rows={[...data.products].sort((a, b) => b.revenue - a.revenue).slice(0, 7).map((item) => ({ label: item.product, value: item.revenue }))} /></Panel></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginBottom: 14 }}><Panel title="Sales by menu section" subtitle="Share of active item revenue · derived from product_id"><DonutChart rows={data.categories.map((item) => ({ label: item.category, value: item.revenue }))} centerLabel="Item sales" /></Panel><Panel title="Sales by station" subtitle="Production station stored on each order item"><SegmentedMix rows={data.stations.map((item) => ({ label: item.station, value: item.revenue }))} /></Panel><Panel title="Lowest sellers" subtitle="Menu products with the fewest units in this range"><QuietRanking rows={lowestProducts.map((item) => ({ label: item.product, value: item.quantity }))} /></Panel></div>
          {data.summary.discrepantOrders > 0 && <div role="status" style={{ marginBottom: 14, padding: 13, border: "1px solid #f3cfad", background: "#fff8f1", borderRadius: 10, color: "#76522f", fontSize: 12, lineHeight: 1.5 }}>Order totals and active item line totals differ for {data.summary.discrepantOrders} orders in this period by {money(data.summary.revenueItemDifference)}. Product revenue and contribution percentages reconcile to active order item rows ({money(data.summary.productRevenue)}); the Overview revenue follows stored orders.total ({money(data.summary.revenue)}).</div>}
          <Panel title="Product sales over time" subtitle="Daily active item revenue, grouped by order creation date · EUR"><TrendChart points={data.productTrends.map((entry) => ({ label: entry.date, value: entry.revenue }))} /><div style={{ color: "#858c97", fontSize: 11, marginTop: 4 }}>{data.productTrends.reduce((sum, entry) => sum + entry.quantity, 0)} active units sold across {data.productTrends.length} active days</div></Panel>
          <div style={{ height: 14 }} />
          <Panel title="Product performance" subtitle="Active product sales; category comes from the versioned menu section encoded in product_id"><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700, fontSize: 13 }}><thead><tr>{["Rank", "Product", "Category", "Station", "Qty sold", "Revenue", "% of item sales", "Cancelled qty"].map((label) => <th key={label} style={{ textAlign: label === "Product" || label === "Category" ? "left" : "right", color: "#78808b", fontSize: 11, padding: "0 10px 11px", borderBottom: "1px solid #e7e9ed" }}>{label}</th>)}</tr></thead><tbody>{data.products.map((item) => <tr key={`${item.rank}-${item.product}`}><td style={{ padding: 11, textAlign: "right", borderBottom: "1px solid #f0f1f3" }}>{item.rank}</td><td style={{ padding: 11, fontWeight: 750, borderBottom: "1px solid #f0f1f3" }}>{item.product}</td><td style={{ padding: 11, borderBottom: "1px solid #f0f1f3" }}>{item.category}</td><td style={{ padding: 11, textAlign: "right", borderBottom: "1px solid #f0f1f3" }}>{item.station}</td><td style={{ padding: 11, textAlign: "right", borderBottom: "1px solid #f0f1f3" }}>{item.quantity}</td><td style={{ padding: 11, textAlign: "right", fontWeight: 750, borderBottom: "1px solid #f0f1f3" }}>{money(item.revenue)}</td><td style={{ padding: 11, textAlign: "right", borderBottom: "1px solid #f0f1f3" }}>{item.contribution.toFixed(1)}%</td><td style={{ padding: 11, textAlign: "right", borderBottom: "1px solid #f0f1f3" }}>{item.cancelledQuantity}</td></tr>)}</tbody></table></div></Panel>
        </>}

        {section === "Waiters" && <>
          <div style={{ padding: 14, marginBottom: 14, border: "1px solid #f3cfad", background: "#fff8f1", color: "#76522f", borderRadius: 12, fontSize: 13, lineHeight: 1.5 }}><strong>Attribution note.</strong> Orders do not store who created or handled them, and waiter shift tracking is not linked to orders. This view reports only stored activity: payments recorded by a waiter and sessions they opened. Session spend is the period’s order total on sessions they opened; it does not prove they handled those orders. Historical waiter sales and shift sales cannot be reported reliably yet.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: 14, marginBottom: 14 }}><Panel title="Waiter activity ranking" subtitle="Ranked by payments entered in the selected period"><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 440, fontSize: 12 }}><thead><tr>{["Waiter", "Collected", "Payments", "Sessions opened"].map((label) => <th key={label} style={{ textAlign: label === "Waiter" ? "left" : "right", padding: "0 6px 10px", color: "#78808b" }}>{label}</th>)}</tr></thead><tbody>{data.waiters.map((waiter) => <tr key={waiter.id} onClick={() => setWaiterId(waiter.id)} style={{ cursor: "pointer", background: (waiterId || data.waiters[0]?.id) === waiter.id ? "#fff4ea" : "transparent" }}><td style={{ padding: 9, borderTop: "1px solid #eee", fontWeight: 800 }}>{waiter.name}</td><td style={{ padding: 9, borderTop: "1px solid #eee", textAlign: "right" }}>{money(waiter.payments)}</td><td style={{ padding: 9, borderTop: "1px solid #eee", textAlign: "right" }}>{waiter.paymentCount}</td><td style={{ padding: 9, borderTop: "1px solid #eee", textAlign: "right" }}>{waiter.sessionsOpened}</td></tr>)}</tbody></table>{!data.waiters.length && <div style={{ color: "#8b929c" }}>No waiter profiles found.</div>}</div></Panel><Panel title={selectedWaiter ? `${selectedWaiter.name} · recorded activity` : "Waiter detail"} subtitle="Payment and session attribution recorded in Supabase">{data.waiters.length > 0 && <label style={{ display: "block", color: "#737b86", fontSize: 11, fontWeight: 800, marginBottom: 12 }}>SELECT WAITER<select value={selectedWaiter?.id ?? ""} onChange={(event) => setWaiterId(event.target.value)} style={{ display: "block", width: "100%", minHeight: 40, marginTop: 5, border: "1px solid #dadee4", borderRadius: 8, padding: "0 10px", background: "#fff", color: "#20242a" }}>{data.waiters.map((waiter) => <option key={waiter.id} value={waiter.id}>{waiter.name}</option>)}</select></label>}{selectedWaiter ? <div style={{ display: "grid", gap: 12 }}><Card label="PAYMENTS RECORDED" value={money(selectedWaiter.payments)} detail={`${selectedWaiter.paymentCount} transactions`} /><Card label="SESSIONS OPENED" value={`${selectedWaiter.sessionsOpened}`} detail="Recorded on table_sessions.opened_by" accent={TURQUOISE} /><Card label="ORDERS IN OPENED SESSIONS" value={money(selectedWaiter.attributedSessionRevenue)} detail="Session context only; order handler is unknown" /></div> : <div style={{ color: "#8b929c" }}>No waiter details in this period.</div>}</Panel></div>
          <Panel title="Recommended attribution change"><p style={{ color: "#5f6875", fontSize: 13, lineHeight: 1.55, margin: 0 }}>Add a nullable <code>waiter_id</code> foreign key to <code>orders</code>, populate it from the authenticated staff user in the waiter order creation endpoint, and backfill no historical rows. For shift sales, also add a nullable <code>staff_shift_id</code> and record it only when an active waiter shift exists. Current shift assignment logic covers BAR/KITCHEN; it does not provide active waiter shifts.</p></Panel>
        </>}

        {section === "Operations" && <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 14 }}><Card label="CANCELLATIONS" value={`${data.summary.cancellationCount}`} detail={`${data.summary.cancelledQuantity} units · ${data.summary.cancellationRate.toFixed(1)}% operational rate`} /><Card label="CANCELLED VALUE" value={money(data.summary.cancelledRevenue)} detail="Cancellation event unit price × quantity" accent={TURQUOISE} /><Card label="ACTIVE ITEM VALUE" value={money(data.summary.productRevenue)} detail="Current active item rows for orders placed in range" /><Card label="DINE-IN ORDERS" value={`${data.summary.tableOrders}`} detail={`${data.summary.sessionCount} sessions with orders`} accent={TURQUOISE} /><Card label="TAKEAWAY ORDERS" value={`${data.summary.takeawayOrders}`} detail="Based on orders.order_type" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 14, marginBottom: 14 }}><Panel title="Busy hours" subtitle="Order count intensity by UTC hour"><HourHeatmap rows={data.hours} /></Panel><Panel title="Orders by weekday (UTC)" subtitle="Seven-day rhythm · order count"><WeekdayChart rows={data.weekdays} /></Panel><Panel title="Payment mix" subtitle="Payments recorded in the selected range"><SegmentedMix rows={[{ label: "Cash", value: data.payments.CASH }, { label: "Card", value: data.payments.CARD }]} /></Panel></div>
          <Panel title="Product cancellations" subtitle="Cancelled item rows grouped by cancelled_at event date"><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500, fontSize: 13 }}><thead><tr>{["Product", "Qty cancelled", "Cancelled value", "Cancellation rate"].map((label) => <th key={label} style={{ textAlign: label === "Product" ? "left" : "right", color: "#78808b", padding: "0 8px 10px" }}>{label}</th>)}</tr></thead><tbody>{[...data.products].filter((product) => product.cancelledQuantity).sort((a, b) => b.cancelledRevenue - a.cancelledRevenue).map((product) => <tr key={product.product}><td style={{ padding: 9, borderTop: "1px solid #eee" }}>{product.product}</td><td style={{ padding: 9, borderTop: "1px solid #eee", textAlign: "right" }}>{product.cancelledQuantity}</td><td style={{ padding: 9, borderTop: "1px solid #eee", textAlign: "right" }}>{money(product.cancelledRevenue)}</td><td style={{ padding: 9, borderTop: "1px solid #eee", textAlign: "right" }}>{product.cancelledRate.toFixed(1)}%</td></tr>)}</tbody></table>{!data.products.some((product) => product.cancelledQuantity) && <div style={{ color: "#8b929c" }}>No cancelled items recorded in this period.</div>}</div><p style={{ color: "#858c97", fontSize: 11, margin: "14px 0 0" }}>Cancellation rate uses cancellation events in this range divided by active item units plus those cancellation events; it is an operational rate, not a cohort rate. Session duration uses sessions closed in this range. Open-session count includes sessions opened and still open in this range. Hours and weekdays use UTC database timestamps.</p></Panel>
        </>}
      </>}
    </div>
  </main>;
}
