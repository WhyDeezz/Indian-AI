import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { Thermometer, MapPin, BarChart3, X, Landmark, Trees, Music2 } from "lucide-react";
import topo from "@/data/india-states.json";
import { getStateMapData } from "@/data/attractions.js";
import { cn } from "@/lib/utils.js";

const CATEGORY_META = {
  historical: { label: "Historical", icon: Landmark, color: "28 95% 60%" },
  natural: { label: "Natural", icon: Trees, color: "142 65% 48%" },
  cultural: { label: "Cultural", icon: Music2, color: "270 70% 62%" },
};

const WIDTH = 800;
const HEIGHT = 600;

const getStateFeatures = () => {
  if (topo?.type === "FeatureCollection" && Array.isArray(topo.features)) {
    return topo.features;
  }

  if (topo?.objects) {
    const objectKey = Object.keys(topo.objects)[0];
    if (!objectKey) return [];
    return feature(topo, topo.objects[objectKey]).features;
  }

  return [];
};

const StateDetail = ({ stateName, onClose }) => {
  const stateGeo = useMemo(() => {
    const features = getStateFeatures();
    return features.find((f) => f?.properties?.st_nm === stateName);
  }, [stateName]);

  const centroid = useMemo(() => {
    if (!stateGeo) return [78, 22];
    const c = geoPath().centroid(stateGeo);
    return [c[0], c[1]];
  }, [stateGeo]);

  const data = useMemo(() => getStateMapData(stateName, centroid), [stateName, centroid]);

  const [layers, setLayers] = useState({
    attractions: true,
    temperature: false,
    economy: false,
  });
  const [filters, setFilters] = useState({
    historical: true,
    natural: true,
    cultural: true,
  });
  const [activePin, setActivePin] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  // Re-trigger drop animation when state changes or attractions toggled on
  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [stateName, layers.attractions, filters.historical, filters.natural, filters.cultural]);

  // Custom projection fitted to the state bounds
  const { projection, pathD } = useMemo(() => {
    const proj = geoMercator();
    if (stateGeo) {
      proj.fitExtent(
        [
          [40, 40],
          [WIDTH - 40, HEIGHT - 40],
        ],
        stateGeo
      );
    }
    const path = geoPath(proj);
    return { projection: proj, pathD: stateGeo ? path(stateGeo) ?? "" : "" };
  }, [stateGeo]);

  const project = (lng, lat) => projection([lng, lat]) ?? [0, 0];

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-muted-foreground">No detailed map available for {stateName} yet.</p>
        <button
          onClick={onClose}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Back
        </button>
      </div>
    );
  }

  const visibleAttractions = data.attractions.filter((a) => filters[a.category]);
  const baseHsl = `hsl(${data.baseColor})`;

  const toggleLayer = (l) =>
    setLayers((prev) => ({ ...prev, [l]: !prev[l] }));

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-panel-border bg-gradient-to-br from-slate-50 to-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-panel-border/60 bg-white/70 px-4 py-3 backdrop-blur">
        <div>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">{stateName}</h2>
          <p className="text-xs text-muted-foreground">
            {visibleAttractions.length} attractions · avg {data.avgTemp}°C
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-foreground/10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Map */}
      <div className="relative flex-1 overflow-hidden">
        <ComposableMap
          width={WIDTH}
          height={HEIGHT}
          projection={projection}
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <filter id="sd-emboss" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur" />
              <feSpecularLighting in="blur" surfaceScale="3" specularConstant="1.1" specularExponent="22" lightingColor="#ffffff" result="spec">
                <feDistantLight azimuth="135" elevation="55" />
              </feSpecularLighting>
              <feComposite in="spec" in2="SourceAlpha" operator="in" result="specClip" />
              <feComposite in="SourceGraphic" in2="specClip" operator="arithmetic" k1="0" k2="1" k3="0.85" k4="0" result="lit" />
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="sb" />
              <feOffset in="sb" dx="0" dy="1.5" result="so" />
              <feComponentTransfer in="so" result="shadow"><feFuncA type="linear" slope="0.45" /></feComponentTransfer>
              <feMerge><feMergeNode in="shadow" /><feMergeNode in="lit" /></feMerge>
            </filter>
            <linearGradient id="sd-gloss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
            </linearGradient>
            <radialGradient id="pin-glow">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Clip everything to state shape so overlays stay inside */}
          <clipPath id="sd-clip"><path d={pathD} /></clipPath>

          {/* Base state */}
          {stateGeo && (
            <g>
              <Geographies geography={{ type: "FeatureCollection", features: [stateGeo] }}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: { fill: baseHsl, stroke: "#ffffff", strokeWidth: 1.2, outline: "none", filter: "url(#sd-emboss)" },
                        hover: { fill: baseHsl, stroke: "#ffffff", strokeWidth: 1.2, outline: "none", filter: "url(#sd-emboss)" },
                        pressed: { fill: baseHsl, outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>
              <path d={pathD} fill="url(#sd-gloss)" pointerEvents="none" style={{ mixBlendMode: "overlay" }} />
            </g>
          )}

          {/* Economy gradient overlay (clipped to state) */}
          {layers.economy && (
            <g clipPath="url(#sd-clip)" style={{ transition: "opacity 400ms ease-in-out" }}>
              {data.economy.map(([lng, lat, w], i) => {
                const [x, y] = project(lng, lat);
                const r = 90 + w * 90;
                const id = `econ-${i}`;
                // Higher economy => darker/richer (higher alpha of base color)
                const alpha = 0.15 + w * 0.7;
                return (
                  <g key={`e-${i}`}>
                    <defs>
                      <radialGradient id={id}>
                        <stop offset="0%" stopColor={`hsla(${data.baseColor}, ${alpha})`} />
                        <stop offset="100%" stopColor={`hsla(${data.baseColor}, 0)`} />
                      </radialGradient>
                    </defs>
                    <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
                  </g>
                );
              })}
            </g>
          )}

          {/* Temperature heatmap (clipped to state) */}
          {layers.temperature && (
            <g clipPath="url(#sd-clip)" style={{ transition: "opacity 400ms ease-in-out" }}>
              {data.heat.map(([lng, lat, t], i) => {
                const [x, y] = project(lng, lat);
                // map 20..45 -> blue(220) .. red(0)
                const norm = Math.max(0, Math.min(1, (t - 20) / 25));
                const hue = 220 - norm * 220;
                const id = `heat-${i}`;
                return (
                  <g key={`h-${i}`}>
                    <defs>
                      <radialGradient id={id}>
                        <stop offset="0%" stopColor={`hsla(${hue}, 90%, 55%, 0.7)`} />
                        <stop offset="100%" stopColor={`hsla(${hue}, 90%, 55%, 0)`} />
                      </radialGradient>
                    </defs>
                    <circle cx={x} cy={y} r={110} fill={`url(#${id})`} style={{ mixBlendMode: "screen" }} />
                  </g>
                );
              })}
            </g>
          )}

          {/* Attraction pins */}
          {layers.attractions && (
            <g key={animKey}>
              {visibleAttractions.map((a, i) => {
                const [x, y] = project(a.coords[0], a.coords[1]);
                const cat = CATEGORY_META[a.category];
                const isActive = activePin?.name === a.name;
                const delay = i * 110;
                return (
                  <g
                    key={a.name}
                    transform={`translate(${x}, ${y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePin(a);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <g style={{ animation: `pin-drop 700ms cubic-bezier(.34,1.56,.64,1) ${delay}ms both` }}>
                      {/* pulse halo */}
                      <circle r={14} fill={`hsl(${cat.color})`} opacity={0.35}>
                        <animate attributeName="r" values="10;20;10" dur="2.2s" repeatCount="indefinite" begin={`${delay}ms`} />
                        <animate attributeName="opacity" values="0.35;0;0.35" dur="2.2s" repeatCount="indefinite" begin={`${delay}ms`} />
                      </circle>
                      <circle r={10} fill="url(#pin-glow)" />
                      {/* pin teardrop */}
                      <path
                        d="M0,-22 C7,-22 11,-16 11,-11 C11,-3 0,8 0,8 C0,8 -11,-3 -11,-11 C-11,-16 -7,-22 0,-22 Z"
                        fill={`hsl(${cat.color})`}
                        stroke="#fff"
                        strokeWidth={1.5}
                        style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))" }}
                      />
                      <circle cx={0} cy={-12} r={3.5} fill="#fff" />
                      {isActive && (
                        <circle r={18} fill="none" stroke="#fff" strokeWidth={2} opacity={0.9}>
                          <animate attributeName="r" values="14;22;14" dur="1.2s" repeatCount="indefinite" />
                        </circle>
                      )}
                    </g>
                  </g>
                );
              })}
            </g>
          )}
        </ComposableMap>

        {/* Info card */}
        {activePin && (
          <div className="absolute bottom-4 left-4 right-4 mx-auto max-w-sm animate-fade-in rounded-xl border border-white/40 bg-white/85 p-3 shadow-lg backdrop-blur-md sm:left-4 sm:right-auto">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ background: `hsl(${CATEGORY_META[activePin.category].color})` }}
              >
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-foreground">{activePin.name}</h3>
                <p className="text-xs text-muted-foreground">{activePin.detail}</p>
                <span className="mt-1 inline-block rounded-md bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-foreground/70">
                  {CATEGORY_META[activePin.category].label}
                </span>
              </div>
              <button
                onClick={() => setActivePin(null)}
                className="rounded-full p-1 text-foreground/60 hover:bg-foreground/10"
                aria-label="Close info"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Category filters (when attractions on) */}
        {layers.attractions && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 rounded-xl border border-white/50 bg-white/80 p-1.5 shadow-sm backdrop-blur">
            {Object.keys(CATEGORY_META).map((c) => {
              const meta = CATEGORY_META[c];
              const Icon = meta.icon;
              const on = filters[c];
              return (
                <button
                  key={c}
                  onClick={() => setFilters((f) => ({ ...f, [c]: !f[c] }))}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all",
                    on ? "text-white shadow-sm" : "bg-white text-foreground/60"
                  )}
                  style={on ? { background: `hsl(${meta.color})` } : undefined}
                >
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Legends */}
        {layers.temperature && (
          <div className="absolute right-3 top-3 rounded-xl border border-white/50 bg-white/85 p-2 text-[10px] shadow-sm backdrop-blur">
            <div className="mb-1 font-semibold text-foreground/80">Temp °C</div>
            <div
              className="h-2 w-32 rounded-full"
              style={{ background: "linear-gradient(to right, hsl(220,90%,55%), hsl(170,90%,50%), hsl(60,90%,55%), hsl(20,90%,55%), hsl(0,90%,55%))" }}
            />
            <div className="mt-1 flex justify-between text-foreground/60"><span>20</span><span>32</span><span>45</span></div>
          </div>
        )}
        {layers.economy && (
          <div className="absolute right-3 bottom-3 rounded-xl border border-white/50 bg-white/85 p-2 text-[10px] shadow-sm backdrop-blur">
            <div className="mb-1 font-semibold text-foreground/80">Economic value</div>
            <div
              className="h-2 w-32 rounded-full"
              style={{ background: `linear-gradient(to right, hsla(${data.baseColor}, 0.15), hsla(${data.baseColor}, 0.95))` }}
            />
            <div className="mt-1 flex justify-between text-foreground/60"><span>Low</span><span>High</span></div>
          </div>
        )}
      </div>

      {/* Floating action buttons */}
      <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col gap-2">
        <FabButton
          label="Attractions"
          active={layers.attractions}
          onClick={() => toggleLayer("attractions")}
          icon={<MapPin className="h-5 w-5" />}
          color="217 91% 60%"
        />
        <FabButton
          label="Temperature"
          active={layers.temperature}
          onClick={() => toggleLayer("temperature")}
          icon={<Thermometer className="h-5 w-5" />}
          color="0 85% 60%"
        />
        <FabButton
          label="Economy"
          active={layers.economy}
          onClick={() => toggleLayer("economy")}
          icon={<BarChart3 className="h-5 w-5" />}
          color={data.baseColor}
        />
      </div>
    </div>
  );
};

const FabButton = ({
  label,
  active,
  onClick,
  icon,
  color,
}) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    aria-label={label}
    className={cn(
      "pointer-events-auto group flex items-center gap-2 rounded-full pl-3 pr-3 py-2.5 text-xs font-semibold shadow-lg transition-all duration-300 ease-in-out",
      active ? "text-white scale-105" : "bg-white text-foreground/70 hover:scale-105"
    )}
    style={active ? { background: `hsl(${color})`, boxShadow: `0 8px 24px -8px hsl(${color} / 0.7)` } : undefined}
  >
    <span className={cn("transition-transform", active && "rotate-0")}>{icon}</span>
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default StateDetail;