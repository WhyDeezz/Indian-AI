import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { STATES } from "./indiaData.ts";
import geo from "./indiastates.json";


type Feature = {
  type: "Feature";
  properties: { name: string };
  geometry: GeoPermissibleObjects;
};

type FC = { type: "FeatureCollection"; features: Feature[] };
const PALETTE = [
  "#F94144", // Red
  "#F3722C", // Orange
  "#F9C80E", // Yellow
  "#2DC653", // Green
  "#29B6B6", // Teal
  "#25A0DA", // Sky Blue
  "#5B8DEF", // Blue
  "#6C63E6", // Indigo
  "#C44CE6", // Purple
  "#E0439A", // Magenta
];

const colorFor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

export default function IndiaMap({ onSelect }: { onSelect: (name: string) => void }) {
  const [geoData] = useState(geo);
  const [hover, setHover] = useState<string | null>(null);



  const { paths, width, height } = useMemo(() => {
    if (!geo) return { paths: [] as { d: string; name: string; active: boolean }[], width: 800, height: 800 };
    const W = 800, H = 800;
    const proj = geoMercator().fitSize([W, H], geo as unknown as GeoPermissibleObjects);
    const pathGen = geoPath(proj);
    const paths = geo.features.map((f) => ({
      d: pathGen(f as unknown as GeoPermissibleObjects) ?? "",
      name: f.properties.name,
      active: !!STATES[f.properties.name],
    }));
    return { paths, width: W, height: H };
  }, [geo]);

  if (!geo) {
    return (
      <div className="aspect-square w-full flex items-center justify-center text-muted-foreground">
        Loading India map…
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
      <defs>
        <filter id="state-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
        </filter>
      </defs>
      {paths.map((p) => {
        const isHover = hover === p.name;
        const fill = p.active ? colorFor(p.name) : "#e5e7eb";
        return (
          <path
            key={p.name}
            d={p.d}
            fill={fill}
            fillOpacity={p.active ? (isHover ? 1 : 0.85) : 0.55}
            stroke={isHover && p.active ? "#1e293b" : "#ffffff"}
            strokeWidth={isHover && p.active ? 1.6 : 0.8}
            style={{
              cursor: p.active ? "pointer" : "default",
              transition: "fill-opacity 150ms, stroke-width 150ms",
              filter: isHover && p.active ? "url(#state-shadow)" : undefined,
            }}
            onMouseEnter={() => p.active && setHover(p.name)}
            onMouseLeave={() => setHover(null)}
            onClick={() => p.active && onSelect(p.name)}
          >
            <title>{p.name}{p.active ? "" : " (coming soon)"}</title>
          </path>
        );
      })}
    </svg>
  );
}
