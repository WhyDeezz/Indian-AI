import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { geoMercator, geoPath } from "d3-geo";
import {
  X,
  MapPin,
  Thermometer,
  BarChart3,
  Star,
  Building2,
  Users,
  GraduationCap,
  Landmark,
  Droplets,
  Wind,
  Eye,
  Sun,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORY_META, STATES, type Category } from "./indiaData";
import indiaStates from "./indiastates.json";


const SYS = {
  blue:    "#0A84FF",
  green:   "#30D158",
  orange:  "#FF9F0A",
  red:     "#FF453A",
  teal:    "#40C8E0",
  purple:  "#BF5AF2",
  yellow:  "#FFD60A",
  pink:    "#FF375F",
};

// Apple HIG dark material layers
const M = {
  base:          "#000000",
  l1:            "#1C1C1E",   // grouped bg
  l2:            "#2C2C2E",   // elevated card
  l3:            "#3A3A3C",   // secondary fill
  l4:            "#48484A",   // tertiary fill / separator
  separator:     "rgba(255,255,255,0.08)",
  separatorHard: "rgba(255,255,255,0.13)",
  fill1:         "rgba(255,255,255,0.05)",
  fill2:         "rgba(255,255,255,0.08)",
  fill3:         "rgba(255,255,255,0.12)",
  labelPrimary:  "#FFFFFF",
  labelSecondary:"rgba(255,255,255,0.55)",
  labelTertiary: "rgba(255,255,255,0.30)",
  labelQuart:    "rgba(255,255,255,0.18)",
};

type Feature = {
  type: "Feature";
  properties: { name: string };
  geometry: GeoJSON.Geometry | GeoJSON.GeometryCollection;
};
type FC = { type: "FeatureCollection"; features: Feature[] };
type Tab = "attractions" | "temperature" | "economy";

export default function StatePopup({
  stateName = "Maharashtra",
  onClose = () => {},
}: {
  stateName?: string;
  onClose?: () => void;
}) {
  const info = STATES[stateName];
  const [tab, setTab] = useState<Tab>("attractions");
  const [activeCats, setActiveCats] = useState<Record<Category, boolean>>({
    historical: true,
    natural: true,
    cultural: true,
  });
  const [geo, setGeo] = useState<Feature | null>(null);
  const [hoverPin, setHoverPin] = useState<string | null>(null);

  useEffect(() => {
    setTab("attractions");
    const feature = indiaStates.features.find(
      (f) => f.properties.name === stateName
    );
    setGeo(feature ?? null);
  }, [stateName]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const W = 720, H = 480;
  const { pathD, project } = useMemo(() => {
    if (!geo)
      return { pathD: "", project: null as ReturnType<typeof geoMercator> | null };
    const fc: FC = { type: "FeatureCollection", features: [geo] };
    const proj = geoMercator().fitExtent([[40, 40], [W - 40, H - 40]], fc as unknown as GeoPermissibleObjects);
    const pathGen = geoPath(proj);
    return { pathD: pathGen(geo as unknown as GeoPermissibleObjects) ?? "", project: proj };
  }, [geo]);

  if (!info) return null;

  const visiblePins = info.attractions.filter((a) => activeCats[a.category]);
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "attractions", label: "Attractions", icon: <MapPin size={14} /> },
    { id: "temperature", label: "Weather",     icon: <Thermometer size={14} /> },
    { id: "economy",     label: "Economy",     icon: <BarChart3 size={14} /> },
  ];
  const activeTabIdx = tabs.findIndex((t) => t.id === tab);

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        // Dark scrim — iOS sheet backdrop
        css-note="backdrop"
      >
        {/* Blurred scrim */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

        <motion.div
          key="card"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 36, mass: 0.8 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden"
          style={{
            background: M.l1,
            borderRadius: 20,
            border: `0.5px solid ${M.separatorHard}`,
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.06) inset",
          }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-6 pt-5 pb-4"
            style={{ borderBottom: `0.5px solid ${M.separator}` }}
          >
            <div>
              <h2
                className="text-2xl font-bold tracking-tight"
                style={{ color: M.labelPrimary, letterSpacing: "-0.025em" }}
              >
                {info.name}
              </h2>
              <p className="mt-0.5 text-[13px]" style={{ color: M.labelSecondary }}>
                {info.attractions.length} attractions · {info.avgTemp}°C avg · {info.subtitle}
              </p>
            </div>

            {/* iOS close button — circular SF-style */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
              style={{ background: M.fill2, color: M.labelSecondary }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = M.fill3;
                (e.currentTarget as HTMLButtonElement).style.color = M.labelPrimary;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = M.fill2;
                (e.currentTarget as HTMLButtonElement).style.color = M.labelSecondary;
              }}
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] max-h-[calc(92vh-80px)] overflow-y-auto"
            style={{ scrollbarWidth: "none" }}>

            <div className="p-6 min-w-0">
              {tab === "attractions" && (
                <AttractionsPanel
                  W={W} H={H} pathD={pathD} project={project}
                  attractions={info.attractions}
                  visible={visiblePins}
                  activeCats={activeCats}
                  setActiveCats={setActiveCats}
                  hoverPin={hoverPin}
                  setHoverPin={setHoverPin}
                />
              )}
              {tab === "temperature" && <WeatherSection info={info} />}
              {tab === "economy" && <EconomyPanel info={info} />}
            </div>

            {/* ── iOS Segmented / Tab Rail ── */}
            <div className="md:sticky md:top-5 md:self-start flex md:flex-col gap-1.5 px-4 pb-4 md:py-0 md:pt-1 md:pr-5">
              {/* Segmented container */}
              <div
                className="flex md:flex-col p-1 gap-0 rounded-2xl relative"
                style={{ background: M.l2 }}
              >
                {/* Sliding indicator */}
                <motion.div
                  className="absolute rounded-xl"
                  style={{ background: M.l3 }}
                  animate={{
                    top:    `calc(${activeTabIdx} * (100% / ${tabs.length}) + 4px)`,
                    left:   4,
                    right:  4,
                    height: `calc(100% / ${tabs.length} - 8px)`,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
                {tabs.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
                    style={{
                      color: tab === id ? M.labelPrimary : M.labelTertiary,
                      letterSpacing: "-0.01em",
                      minWidth: 130,
                    }}
                  >
                    <span style={{ color: tab === id ? SYS.blue : M.labelTertiary }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────
// Attractions Panel
// ─────────────────────────────────────────────────────────────────
type Attractions = (typeof STATES)[string]["attractions"];

function AttractionsPanel({
  W, H, pathD, project, visible, activeCats, setActiveCats, hoverPin, setHoverPin,
}: {
  W: number; H: number; pathD: string;
  project: ReturnType<typeof geoMercator> | null;
  attractions: Attractions; visible: Attractions;
  activeCats: Record<Category, boolean>;
  setActiveCats: (v: Record<Category, boolean>) => void;
  hoverPin: string | null; setHoverPin: (v: string | null) => void;
}) {
  const cats: Category[] = ["historical", "natural", "cultural"];

  // Apple HIG system colors for categories
  const catColors: Record<Category, string> = {
    historical: SYS.orange,
    natural:    SYS.green,
    cultural:   SYS.purple,
  };

  return (
    <div className="space-y-4">
      {/* Category filter pills — iOS chip style */}
      <div className="flex flex-wrap gap-2">
        {cats.map((c) => {
          const meta = CATEGORY_META[c];
          const color = catColors[c];
          const on = activeCats[c];
          return (
            <button
              key={c}
              onClick={() => setActiveCats({ ...activeCats, [c]: !on })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
              style={{
                background: on ? `${color}22` : M.fill1,
                color: on ? color : M.labelTertiary,
                border: `0.5px solid ${on ? `${color}55` : M.separator}`,
                letterSpacing: "-0.01em",
              }}
            >
              <Landmark size={11} />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: M.l2, border: `0.5px solid ${M.separator}` }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <defs>
            <filter id="sf-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor={SYS.green} floodOpacity="0.3" />
            </filter>
            <linearGradient id="sf-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34C75922" />
              <stop offset="100%" stopColor="#30D15833" />
            </linearGradient>
          </defs>
          {pathD && (
            <path
              d={pathD}
              fill="url(#sf-fill)"
              stroke={SYS.green}
              strokeWidth={1.5}
              filter="url(#sf-glow)"
            />
          )}
          {project && visible.map((a) => {
            const xy = project(a.coords);
            if (!xy) return null;
            const color = catColors[a.category];
            const isHover = hoverPin === a.id;
            return (
              <g
                key={a.id}
                transform={`translate(${xy[0]}, ${xy[1]})`}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoverPin(a.id)}
                onMouseLeave={() => setHoverPin(null)}
              >
                <g style={{
                  transform: isHover ? "scale(1.3)" : "scale(1)",
                  transformOrigin: "0px -10px",
                  transition: "transform 200ms cubic-bezier(0.34,1.56,0.64,1)",
                }}>
                  <path
                    d="M0,-22 C-8,-22 -14,-16 -14,-9 C-14,-1 0,12 0,12 C0,12 14,-1 14,-9 C14,-16 8,-22 0,-22 Z"
                    fill={color}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={1}
                  />
                  <circle cx={0} cy={-10} r={4} fill="rgba(255,255,255,0.9)" />
                </g>
                {isHover && (
                  <g transform="translate(0, -44)">
                    <rect x={-55} y={-18} width={110} height={18} rx={9}
                      fill={M.l1} stroke={M.separatorHard} strokeWidth={0.5} />
                    <text x={0} y={-5} textAnchor="middle" fontSize={10} fontWeight={600}
                      fill="white" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {a.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Attraction list — iOS grouped table rows */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: M.l2, border: `0.5px solid ${M.separator}` }}
      >
        {visible.map((a, i) => {
          const color = catColors[a.category];
          const isLast = i === visible.length - 1;
          return (
            <div
              key={a.id}
              onMouseEnter={(e) => {
                setHoverPin(a.id);
                (e.currentTarget as HTMLDivElement).style.background = M.fill1;
              }}
              onMouseLeave={(e) => {
                setHoverPin(null);
                (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }}
              className="transition-colors"
              style={{
                background: hoverPin === a.id ? M.fill1 : "transparent",
                borderBottom: isLast ? "none" : `0.5px solid ${M.separator}`,
              }}
            >
              <div className="flex items-start gap-3 px-4 py-3.5">
                {/* Category dot badge */}
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                  style={{ background: `${color}20` }}
                >
                  <Landmark size={13} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[14px] font-semibold" style={{ color: M.labelPrimary, letterSpacing: "-0.012em" }}>
                      {a.name}
                    </p>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ background: `${color}22`, color }}
                    >
                      {CATEGORY_META[a.category].label}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: M.labelSecondary }}>
                    {a.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <Star size={11} className="fill-[#FFD60A] text-[#FFD60A]" />
                  <span className="text-[13px] font-semibold" style={{ color: M.labelPrimary, letterSpacing: "-0.01em" }}>
                    {a.rating}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-[14px]" style={{ color: M.labelTertiary }}>No attractions selected</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Weather Section
// ─────────────────────────────────────────────────────────────────
function WeatherSection({ info }: { info: (typeof STATES)[string] }) {
  const w = info.weather;

  return (
    <div className="space-y-3">
      {/* Hero weather card */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0A1628 0%, #0D2142 50%, #0A1628 100%)",
          border: `0.5px solid rgba(10,132,255,0.2)`,
        }}
      >
        {/* Ambient glow blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-48 h-48 rounded-full opacity-10"
            style={{ top: "-20%", right: "5%", background: SYS.blue, filter: "blur(48px)" }} />
          <div className="absolute w-32 h-32 rounded-full opacity-10"
            style={{ bottom: "10%", left: "10%", background: SYS.teal, filter: "blur(36px)" }} />
          <div className="absolute opacity-[0.06]" style={{ top: "8%", right: "12%", fontSize: 80, animation: "wdrift 14s ease-in-out infinite" }}>⛅</div>
        </div>

        <div className="relative p-6 md:p-7">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[11px] mb-3 flex items-center gap-1" style={{ color: M.labelTertiary }}>
                <MapPin size={10} /> {info.name} · Live
              </p>
              <div className="flex items-end gap-2 mb-1">
                <span
                  className="font-black leading-none"
                  style={{
                    fontSize: "4.5rem",
                    color: "#FFFFFF",
                    letterSpacing: "-0.04em",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {w.temp}°
                </span>
                <span className="text-5xl mb-1.5">⛅</span>
              </div>
              <p className="text-[15px] font-medium" style={{ color: M.labelSecondary }}>{w.condition}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] mb-1" style={{ color: M.labelTertiary }}>Feels like</p>
              <p className="text-[22px] font-bold mb-3" style={{ color: M.labelPrimary, letterSpacing: "-0.02em" }}>
                {w.feelsLike}°
              </p>
              <p className="text-[11px]" style={{ color: M.labelTertiary }}>🌅 {w.sunrise}</p>
              <p className="text-[11px] mt-1" style={{ color: M.labelTertiary }}>🌇 {w.sunset}</p>
            </div>
          </div>

          {/* 4-stat row */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { icon: <Droplets size={13} />, label: "Humidity", val: `${w.humidity}%`, color: SYS.teal },
              { icon: <Wind size={13} />,     label: "Wind",     val: `${w.wind} km/h`,  color: SYS.blue },
              { icon: <Eye size={13} />,      label: "AQI",      val: `${w.aqi}`,        color: SYS.green },
              { icon: <Sun size={13} />,      label: "UV Index", val: `${w.uv}`,         color: SYS.orange },
            ].map(({ icon, label, val, color }) => (
              <div key={label}
                className="flex flex-col items-center py-3 rounded-2xl"
                style={{ background: M.fill1, border: `0.5px solid ${M.separator}` }}
              >
                <div className="mb-1.5" style={{ color }}>{icon}</div>
                <p className="text-[14px] font-bold leading-none mb-0.5"
                  style={{ color: M.labelPrimary, letterSpacing: "-0.015em" }}>
                  {val}
                </p>
                <p className="text-[10px]" style={{ color: M.labelTertiary }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Rain probability bar */}
          <div className="p-3.5 rounded-xl mb-5" style={{ background: M.fill1 }}>
            <div className="flex justify-between text-[12px] mb-2">
              <span style={{ color: M.labelSecondary }}>🌧 Rain Probability</span>
              <span className="font-bold" style={{ color: SYS.blue }}>{w.rain}%</span>
            </div>
            <div className="h-1 rounded-full" style={{ background: M.fill2 }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${w.rain}%` }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                style={{ background: `linear-gradient(to right, ${SYS.blue}, ${SYS.purple})` }}
              />
            </div>
          </div>

          {/* Hourly forecast */}
          <div>
            <p className="text-[11px] mb-2.5 font-medium uppercase tracking-wide"
              style={{ color: M.labelTertiary }}>
              Hourly
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {w.hourly.map((h, i) => (
                <div
                  key={i}
                  className="shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl"
                  style={{
                    background: i === 0 ? `${SYS.blue}18` : M.fill1,
                    border: `0.5px solid ${i === 0 ? `${SYS.blue}44` : M.separator}`,
                    minWidth: 52,
                  }}
                >
                  <p className="text-[10px]" style={{ color: i === 0 ? SYS.blue : M.labelTertiary }}>
                    {h.time}
                  </p>
                  <p className="text-lg">{h.icon}</p>
                  <p className="text-[13px] font-semibold" style={{ color: M.labelPrimary, letterSpacing: "-0.01em" }}>
                    {h.temp}°
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 7-day forecast */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: M.l2, border: `0.5px solid ${M.separator}` }}
      >
        <p className="text-[11px] font-medium uppercase tracking-wide px-4 pt-4 pb-2"
          style={{ color: M.labelTertiary }}>
          7-Day Forecast
        </p>
        {w.weekly.map((day, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-2.5"
            style={{ borderTop: i === 0 ? "none" : `0.5px solid ${M.separator}` }}
          >
            <p className="text-[14px] font-medium w-9" style={{ color: M.labelSecondary }}>{day.day}</p>
            <p className="text-lg w-7">{day.icon}</p>
            <div className="flex-1 mx-1">
              <div className="h-1 rounded-full" style={{ background: M.fill2 }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(((day.high - 20) / 15) * 100)}%`,
                    background: `linear-gradient(to right, ${SYS.blue}, ${SYS.orange})`,
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2.5 text-[13px]">
              <span className="font-semibold" style={{ color: M.labelPrimary }}>{day.high}°</span>
              <span style={{ color: M.labelTertiary }}>{day.low}°</span>
            </div>
          </div>
        ))}
      </div>

      {/* Seasonal area chart */}
      <div
        className="rounded-2xl p-5"
        style={{ background: M.l2, border: `0.5px solid ${M.separator}` }}
      >
        <p className="text-[11px] font-medium uppercase tracking-wide mb-4"
          style={{ color: M.labelTertiary }}>
          Annual Temperature (°C)
        </p>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={w.seasonal}>
              <defs>
                <linearGradient id="sf-tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SYS.blue} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={SYS.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="m"
                tick={{ fill: M.labelTertiary, fontSize: 10, fontFamily: "'Inter', sans-serif" }}
                axisLine={false} tickLine={false} />
              <YAxis hide domain={[18, 38]} />
              <Tooltip
                contentStyle={{
                  background: M.l1,
                  border: `0.5px solid ${M.separatorHard}`,
                  borderRadius: 10,
                  color: M.labelPrimary,
                  fontSize: 12,
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <Area type="monotone" dataKey="t" stroke={SYS.blue} strokeWidth={1.5}
                fill="url(#sf-tg)" name="Avg °C" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        @keyframes wdrift {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-14px,-10px) scale(1.03); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Economy Panel
// ─────────────────────────────────────────────────────────────────
function EconomyPanel({ info }: { info: (typeof STATES)[string] }) {
  const e = info.economy;
  return (
    <div className="space-y-4">
      {/* GDP / Per Capita — iOS grouped cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl p-5"
          style={{
            background: `${SYS.green}12`,
            border: `0.5px solid ${SYS.green}30`,
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
            style={{ background: `${SYS.green}22` }}>
            <Building2 size={16} style={{ color: SYS.green }} />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wide mb-1"
            style={{ color: SYS.green, opacity: 0.8 }}>
            GDP
          </p>
          <p className="text-[22px] font-bold" style={{ color: M.labelPrimary, letterSpacing: "-0.02em" }}>
            {e.gdp}
          </p>
        </div>
        <div
          className="rounded-2xl p-5"
          style={{
            background: `${SYS.blue}12`,
            border: `0.5px solid ${SYS.blue}30`,
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
            style={{ background: `${SYS.blue}22` }}>
            <Users size={16} style={{ color: SYS.blue }} />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wide mb-1"
            style={{ color: SYS.blue, opacity: 0.8 }}>
            Per Capita
          </p>
          <p className="text-[22px] font-bold" style={{ color: M.labelPrimary, letterSpacing: "-0.02em" }}>
            {e.perCapita}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Sector donut */}
        <div
          className="rounded-2xl p-5"
          style={{ background: M.l2, border: `0.5px solid ${M.separator}` }}
        >
          <p className="text-[13px] font-semibold mb-4" style={{ color: M.labelPrimary, letterSpacing: "-0.01em" }}>
            Sector Breakdown
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={e.sectors}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={46}
                  outerRadius={72}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {e.sectors.map((s) => <Cell key={s.name} fill={s.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: M.l1,
                    borderRadius: 10,
                    border: `0.5px solid ${M.separatorHard}`,
                    fontSize: 12,
                    color: M.labelPrimary,
                    fontFamily: "'Inter', sans-serif",
                  }}
                  formatter={(v) => `${v}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {e.sectors.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[12px]" style={{ color: M.labelSecondary }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="text-[13px] font-semibold" style={{ color: M.labelPrimary }}>
                  {s.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key stats */}
        <div
          className="rounded-2xl p-5"
          style={{ background: M.l2, border: `0.5px solid ${M.separator}` }}
        >
          <p className="text-[13px] font-semibold mb-4" style={{ color: M.labelPrimary, letterSpacing: "-0.01em" }}>
            Key Statistics
          </p>
          <div className="grid grid-cols-2 gap-2">
            {e.stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3.5"
                style={{ background: M.fill1, border: `0.5px solid ${M.separator}` }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5"
                  style={{ color: M.labelTertiary }}>
                  {s.label}
                </p>
                <p className="text-[15px] font-bold" style={{ color: M.labelPrimary, letterSpacing: "-0.015em" }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px]" style={{ color: M.labelQuart }}>
            <GraduationCap size={12} />
            Indicative figures for demo purposes.
          </div>
        </div>
      </div>
    </div>
  );
}
