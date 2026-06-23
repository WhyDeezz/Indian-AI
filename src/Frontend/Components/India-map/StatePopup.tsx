import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis,
} from "recharts";
import {
  X, Star, Wind, Droplets, Sun, Eye, MapPin, ArrowUpRight, TrendingUp,
} from "lucide-react";

// ── Leaflet icon factory ─────────────────────────────────────────────────────
const PIN_CACHE: Record<string, L.DivIcon> = {};
function makePinIcon(emoji: string, color: string): L.DivIcon {
  const key = emoji + color;
  if (!PIN_CACHE[key]) {
    PIN_CACHE[key] = L.divIcon({
      className: "",
      html: `<div style="width:38px;height:38px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid rgba(255,255,255,0.35);box-shadow:0 4px 16px rgba(0,0,0,0.55),0 0 0 5px ${color}28;cursor:pointer;transition:transform .2s;">
               ${emoji}
             </div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
  }
  return PIN_CACHE[key];
}

// ── Color palette constants ───────────────────────────────────────────────────
const C = {
  bg: "#07111D",
  card: "rgba(255,255,255,0.05)",
  cardBorder: "rgba(255,255,255,0.08)",
  cyan: "#4CC9F0",
  cyanDim: "rgba(76,201,240,0.12)",
  cyanBorder: "rgba(76,201,240,0.22)",
  violet: "#7C4DFF",
  neon: "#00E5FF",
  green: "#22c55e",
  amber: "#f59e0b",
  pink: "#ec4899",
  teal: "#06b6d4",
} as const;

// ── Data ─────────────────────────────────────────────────────────────────────
const PIN_CATS = [
  { id: "all",        emoji: "🗺",  label: "All",         color: C.cyan },
  { id: "city",       emoji: "🏙",  label: "Cities",      color: C.cyan },
  { id: "attraction", emoji: "🏛",  label: "Attractions", color: C.violet },
  { id: "park",       emoji: "🌳",  label: "Parks",       color: C.green },
  { id: "lake",       emoji: "🏞",  label: "Lakes",       color: C.teal },
  { id: "mountain",   emoji: "🏔",  label: "Mountains",   color: "#a855f7" },
  { id: "beach",      emoji: "🏖",  label: "Beaches",     color: C.amber },
];

const MAP_PINS = [
  { id:1,  cat:"city",       emoji:"🏙", color:C.cyan,     coords:[19.0760,72.8777] as [number,number], name:"Mumbai",              img:"https://images.unsplash.com/photo-1662737897280-226e47d4db8e?w=320&h=200&fit=crop&auto=format", desc:"Financial capital of India — Bollywood, stock exchange, 20M+ residents.", dist:"Capital", rating:4.9 },
  { id:2,  cat:"city",       emoji:"🏙", color:C.cyan,     coords:[18.5204,73.8567] as [number,number], name:"Pune",                img:"https://images.unsplash.com/photo-1732022648903-737e66c18b08?w=320&h=200&fit=crop&auto=format", desc:"Silicon Valley of India — IT, education, automotive powerhouse.",          dist:"147 km from Mumbai", rating:4.7 },
  { id:3,  cat:"city",       emoji:"🏙", color:C.cyan,     coords:[21.1458,79.0882] as [number,number], name:"Nagpur",              img:"https://images.unsplash.com/photo-1648831180276-2dc08f3db3ef?w=320&h=200&fit=crop&auto=format", desc:"The Orange City — geographic center of India.",                           dist:"878 km from Mumbai", rating:4.5 },
  { id:4,  cat:"city",       emoji:"🏙", color:C.cyan,     coords:[19.9975,73.7898] as [number,number], name:"Nashik",              img:"https://images.unsplash.com/photo-1626419825300-c56f471b94a2?w=320&h=200&fit=crop&auto=format", desc:"Wine capital of India and host of Kumbh Mela every 12 years.",            dist:"162 km from Mumbai", rating:4.6 },
  { id:5,  cat:"city",       emoji:"🏙", color:C.cyan,     coords:[19.8762,75.3433] as [number,number], name:"Aurangabad",          img:"https://images.unsplash.com/photo-1704788564069-d54cab4169aa?w=320&h=200&fit=crop&auto=format", desc:"Gateway to Ajanta & Ellora — historic Mughal heritage city.",             dist:"335 km from Mumbai", rating:4.7 },
  { id:6,  cat:"attraction", emoji:"🏛", color:C.violet,   coords:[18.9219,72.8347] as [number,number], name:"Gateway of India",    img:"https://images.unsplash.com/photo-1670165184224-85d9145f614f?w=320&h=200&fit=crop&auto=format", desc:"Iconic 1924 arch monument overlooking the Arabian Sea.",                  dist:"0.5 km from CST",   rating:4.8 },
  { id:7,  cat:"attraction", emoji:"🏛", color:C.violet,   coords:[20.5519,75.7033] as [number,number], name:"Ajanta Caves",        img:"https://images.unsplash.com/photo-1704788564069-d54cab4169aa?w=320&h=200&fit=crop&auto=format", desc:"UNESCO rock-cut Buddhist cave monuments from 2nd century BCE.",           dist:"107 km from Aurangabad", rating:4.9 },
  { id:8,  cat:"attraction", emoji:"🏛", color:C.violet,   coords:[20.0258,75.1780] as [number,number], name:"Ellora Caves",        img:"https://images.unsplash.com/photo-1670509628897-333df68d1d90?w=320&h=200&fit=crop&auto=format", desc:"34 monasteries carved from basalt cliff — three faiths, one wonder.",     dist:"30 km from Aurangabad", rating:4.9 },
  { id:9,  cat:"park",       emoji:"🌳", color:C.green,    coords:[20.3944,79.3243] as [number,number], name:"Tadoba Tiger Reserve", img:"https://images.unsplash.com/photo-1626419825300-c56f471b94a2?w=320&h=200&fit=crop&auto=format", desc:"Maharashtra's oldest national park — 88 tigers, highest density in India.",dist:"935 km from Mumbai", rating:4.8 },
  { id:10, cat:"park",       emoji:"🌳", color:C.green,    coords:[21.4800,79.3333] as [number,number], name:"Pench National Park",  img:"https://images.unsplash.com/photo-1648115124749-b5d0c3ced1fa?w=320&h=200&fit=crop&auto=format", desc:"Inspiration for Rudyard Kipling's The Jungle Book — 60+ tigers.",        dist:"982 km from Mumbai", rating:4.7 },
  { id:11, cat:"lake",       emoji:"🏞", color:C.teal,     coords:[19.9737,76.5086] as [number,number], name:"Lonar Crater Lake",   img:"https://images.unsplash.com/photo-1648831180276-2dc08f3db3ef?w=320&h=200&fit=crop&auto=format", desc:"World's rarest saltwater impact crater lake, formed 50,000 years ago.",  dist:"475 km from Mumbai", rating:4.7 },
  { id:12, cat:"mountain",   emoji:"🏔", color:"#a855f7",  coords:[19.5969,73.7150] as [number,number], name:"Kalsubai Peak",       img:"https://images.unsplash.com/photo-1648115124749-b5d0c3ced1fa?w=320&h=200&fit=crop&auto=format", desc:"Highest peak in Maharashtra at 1,646 m — prime trekking destination.",    dist:"167 km from Mumbai", rating:4.7 },
  { id:13, cat:"beach",      emoji:"🏖", color:C.amber,    coords:[17.1452,73.2656] as [number,number], name:"Ganpatipule Beach",    img:"https://images.unsplash.com/photo-1599661046289-e31897846e41?w=320&h=200&fit=crop&auto=format", desc:"Virgin Konkan coast beach with crystal-clear water and swaying palms.",   dist:"375 km from Mumbai", rating:4.7 },
];

const ATTRACTIONS = [
  { name:"Gateway of India",    district:"Mumbai",     rating:4.8, season:"Oct–Mar", unesco:false, img:"https://images.unsplash.com/photo-1670165184224-85d9145f614f?w=600&h=400&fit=crop&auto=format",  desc:"Iconic 26m basalt arch built in 1924 to honour King George V's visit, now the symbolic entrance to India by sea." },
  { name:"Ajanta Caves",        district:"Aurangabad", rating:4.9, season:"Nov–Feb", unesco:true,  img:"https://images.unsplash.com/photo-1704788564069-d54cab4169aa?w=600&h=400&fit=crop&auto=format",  desc:"30 rock-cut Buddhist cave monuments adorned with extraordinary frescoes and sculptures from the 2nd century BCE." },
  { name:"Ellora Caves",        district:"Aurangabad", rating:4.9, season:"Nov–Mar", unesco:true,  img:"https://images.unsplash.com/photo-1670509628897-333df68d1d90?w=600&h=400&fit=crop&auto=format",  desc:"34 monasteries carved directly into basalt cliffs, spanning Buddhist, Hindu, and Jain traditions across 5 centuries." },
  { name:"Lonar Crater Lake",   district:"Buldhana",   rating:4.6, season:"Dec–Mar", unesco:false, img:"https://images.unsplash.com/photo-1648831180276-2dc08f3db3ef?w=600&h=400&fit=crop&auto=format",  desc:"A rare alkaline saltwater crater lake formed by a meteorite impact 50,000 years ago — a true geological wonder." },
  { name:"Mahabaleshwar",       district:"Satara",     rating:4.7, season:"Mar–Jun", unesco:false, img:"https://images.unsplash.com/photo-1648115124749-b5d0c3ced1fa?w=600&h=400&fit=crop&auto=format",  desc:"Lush Sahyadri hill station famed for strawberry farms, panoramic viewpoints, and the serene Venna Lake." },
  { name:"Tadoba Tiger Reserve",district:"Chandrapur", rating:4.8, season:"Apr–Jun", unesco:false, img:"https://images.unsplash.com/photo-1626419825300-c56f471b94a2?w=600&h=400&fit=crop&auto=format",  desc:"Maharashtra's oldest national park — home to 88 Royal Bengal tigers, leopards, wild dogs, and sloth bears." },
];

const HERO_MAP: Record<string, { heroImg: string; tagline: string; capital: string; temp: string; gsdp: string; attractions: number; bestTime: string }> = {
  "Maharashtra":  { heroImg:"https://images.unsplash.com/photo-1710582999228-bf5a133c4573?w=1800&h=900&fit=crop&auto=format",  tagline:"The Land of Opportunities — Powering India's Future",  capital:"Mumbai",           temp:"28°C", gsdp:"₹36.4T", attractions:47, bestTime:"Oct–Mar" },
  "Rajasthan":    { heroImg:"https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1800&h=900&fit=crop&auto=format",  tagline:"The Land of Kings — Royalty Written in Every Stone",    capital:"Jaipur",           temp:"32°C", gsdp:"₹12.8T", attractions:63, bestTime:"Nov–Feb" },
  "Karnataka":    { heroImg:"https://images.unsplash.com/photo-1670165184224-85d9145f614f?w=1800&h=900&fit=crop&auto=format",  tagline:"One State, Many Worlds — From Silicon to Silk",         capital:"Bengaluru",        temp:"24°C", gsdp:"₹24.9T", attractions:38, bestTime:"Oct–Mar" },
  "Gujarat":      { heroImg:"https://images.unsplash.com/photo-1648831180276-2dc08f3db3ef?w=1800&h=900&fit=crop&auto=format",  tagline:"Vibrant Gujarat — Innovation Meets Heritage",           capital:"Gandhinagar",      temp:"30°C", gsdp:"₹22.1T", attractions:29, bestTime:"Nov–Feb" },
  "Tamil Nadu":   { heroImg:"https://images.unsplash.com/photo-1704788564069-d54cab4169aa?w=1800&h=900&fit=crop&auto=format",  tagline:"The Land of Temples, Traditions and Tigers",           capital:"Chennai",          temp:"30°C", gsdp:"₹25.7T", attractions:54, bestTime:"Nov–Mar" },
  "Kerala":       { heroImg:"https://images.unsplash.com/photo-1626419825300-c56f471b94a2?w=1800&h=900&fit=crop&auto=format",  tagline:"God's Own Country — Where Nature Breathes Freely",     capital:"Thiruvananthapuram",temp:"27°C", gsdp:"₹10.4T", attractions:41, bestTime:"Sep–Mar" },
  "West Bengal":  { heroImg:"https://images.unsplash.com/photo-1648115124749-b5d0c3ced1fa?w=1800&h=900&fit=crop&auto=format",  tagline:"The Cultural Soul of India — Art, Song and Spirit",     capital:"Kolkata",          temp:"25°C", gsdp:"₹16.2T", attractions:35, bestTime:"Oct–Feb" },
};
const FALLBACK_HERO = HERO_MAP["Maharashtra"];

const WEATHER = {
  temp:31, feelsLike:35, condition:"Partly Cloudy", humidity:72, wind:18, aqi:68, uv:7, rain:40,
  sunrise:"6:12 AM", sunset:"7:28 PM",
  hourly:[
    {time:"Now",  temp:31, icon:"⛅"},{time:"1 PM", temp:32, icon:"☀️"},{time:"2 PM", temp:33, icon:"☀️"},
    {time:"3 PM", temp:32, icon:"⛅"},{time:"4 PM", temp:31, icon:"🌦"},{time:"5 PM", temp:30, icon:"🌧"},
    {time:"6 PM", temp:29, icon:"🌧"},{time:"7 PM", temp:28, icon:"⛅"},{time:"8 PM", temp:27, icon:"🌙"},
  ],
  weekly:[
    {day:"Mon",high:33,low:26,icon:"☀️"},{day:"Tue",high:31,low:25,icon:"⛅"},{day:"Wed",high:29,low:24,icon:"🌧"},
    {day:"Thu",high:28,low:23,icon:"🌧"},{day:"Fri",high:30,low:25,icon:"⛅"},{day:"Sat",high:32,low:26,icon:"☀️"},
    {day:"Sun",high:31,low:25,icon:"⛅"},
  ],
  seasonal:[
    {m:"Jan",t:23},{m:"Feb",t:25},{m:"Mar",t:29},{m:"Apr",t:32},{m:"May",t:33},{m:"Jun",t:30},
    {m:"Jul",t:27},{m:"Aug",t:27},{m:"Sep",t:28},{m:"Oct",t:30},{m:"Nov",t:27},{m:"Dec",t:24},
  ],
};

const ECONOMY = {
  gsdp:"₹36.4T", rank:"#1 India", growth:"8.2%", perCapita:"₹2.84L",
  sectors:[
    {name:"Services",  value:58, color:C.cyan},
    {name:"Industry",  value:26, color:C.violet},
    {name:"Agriculture",value:16,color:C.green},
  ],
  industries:[
    {name:"Financial Services",    pct:91, color:C.cyan},
    {name:"Manufacturing",         pct:84, color:C.violet},
    {name:"Information Technology",pct:76, color:C.green},
    {name:"Tourism & Hospitality", pct:55, color:C.amber},
    {name:"Logistics & Ports",     pct:63, color:C.pink},
  ],
  exports:["💎 Gems & Jewellery","🚗 Automobiles","🌾 Agriculture","💻 IT Services","💊 Pharmaceuticals","⚓ Marine Exports"],
};

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  {id:"map",         label:"🗺",  full:"Map"},
  {id:"attractions", label:"🏛",  full:"Attractions"},
  {id:"weather",     label:"🌤",  full:"Weather"},
  {id:"economy",     label:"💹",  full:"Economy"},
];

// ── Hero section ─────────────────────────────────────────────────────────────
function Hero({ stateName, heroData, parallax, onClose }: {
  stateName: string;
  heroData: typeof FALLBACK_HERO;
  parallax: number;
  onClose: () => void;
}) {
  return (
    <div className="relative overflow-hidden shrink-0" style={{ height: 300 }}>
      <img
        src={heroData.heroImg}
        alt={stateName}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: `translateY(${parallax}px) scale(1.18)`, transformOrigin: "center top" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(7,17,29,0.1) 0%, rgba(7,17,29,0.55) 55%, rgba(7,17,29,1) 100%)" }}
      />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
        style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.18)" }}
      >
        <X size={15} className="text-white" />
      </button>

      {/* Content */}
      <div className="absolute bottom-0 inset-x-0 px-6 md:px-10 pb-5">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-[clamp(2.2rem,6vw,3.5rem)] font-black text-white leading-none mb-1"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {stateName}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="text-sm mb-5"
          style={{ color: "rgba(255,255,255,0.52)" }}
        >
          {heroData.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          className="flex flex-wrap gap-2"
        >
          {[
            { icon: "🌡", label: "Temperature", val: heroData.temp },
            { icon: "💹", label: "GSDP",        val: heroData.gsdp },
            { icon: "📍", label: "Attractions", val: `${heroData.attractions}+` },
            { icon: "🗓", label: "Best Time",   val: heroData.bestTime },
          ].map(({ icon, label, val }) => (
            <div
              key={label}
              className="px-3 py-2 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.14)" }}
            >
              <p className="text-[9px] text-white/45 leading-none mb-1 tracking-wide">{label}</p>
              <p className="text-sm font-bold text-white leading-none">{icon} {val}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ── Tab nav ───────────────────────────────────────────────────────────────────
function TabNav({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <div
      className="sticky top-0 z-20 flex gap-1 px-4 md:px-10 py-3 overflow-x-auto"
      style={{
        background: "rgba(7,17,29,0.9)",
        backdropFilter: "blur(24px)",
        borderBottom: `1px solid ${C.cardBorder}`,
        scrollbarWidth: "none",
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className="shrink-0 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300"
            style={
              isActive
                ? { background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}` }
                : { color: "rgba(255,255,255,0.38)", border: "1px solid transparent" }
            }
          >
            <span className="mr-1.5">{tab.label}</span>
            <span className="hidden sm:inline">{tab.full}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Map section ───────────────────────────────────────────────────────────────
function MapSection() {
  const [filter, setFilter] = useState("all");
  const [pin, setPin] = useState<(typeof MAP_PINS)[0] | null>(null);
  const visible = filter === "all" ? MAP_PINS : MAP_PINS.filter((p) => p.cat === filter);

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {PIN_CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className="text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-200"
            style={
              filter === c.id
                ? { background: c.color, color: "#07111D", fontWeight: 700 }
                : { background: C.card, color: "rgba(255,255,255,0.48)", border: `1px solid ${C.cardBorder}` }
            }
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="relative rounded-3xl overflow-hidden" style={{ height: 420, border: `1px solid ${C.cardBorder}` }}>
        <MapContainer
          center={[19.5, 76.5]}
          zoom={6}
          style={{ height: "100%", width: "100%", background: C.bg }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {visible.map((p) => (
            <Marker
              key={p.id}
              position={p.coords}
              icon={makePinIcon(p.emoji, p.color)}
              eventHandlers={{ click: () => setPin(p) }}
            />
          ))}
        </MapContainer>

        {/* Floating attribution */}
        <div className="absolute bottom-2 right-2 text-[9px] z-[1000]" style={{ color: "rgba(255,255,255,0.25)" }}>
          © CartoDB / OpenStreetMap
        </div>

        {/* Pin popup */}
        {pin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 rounded-2xl overflow-hidden z-[999]"
            style={{ background: "rgba(7,17,29,0.96)", backdropFilter: "blur(24px)", border: `1px solid ${C.cardBorder}`, boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}
          >
            <div className="h-28 relative overflow-hidden">
              <img src={pin.img} alt={pin.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,17,29,0.88) 0%, transparent 55%)" }} />
              <button onClick={() => setPin(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
                <X size={11} className="text-white" />
              </button>
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: pin.color + "cc" }}>
                {pin.emoji} {PIN_CATS.find(c => c.id === pin.cat)?.label}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-sm">{pin.name}</p>
                <span className="flex items-center gap-1">
                  <Star size={11} fill={C.amber} color={C.amber} />
                  <span className="text-xs font-bold" style={{ color: C.amber }}>{pin.rating}</span>
                </span>
              </div>
              <p className="text-xs mb-2 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.38)" }}>
                <MapPin size={9} /> {pin.dist}
              </p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.58)" }}>{pin.desc}</p>
              <button className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:brightness-110" style={{ background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}` }}>
                View Details <ArrowUpRight size={11} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Attractions section ────────────────────────────────────────────────────────
function AttractionsSection() {
  const [modal, setModal] = useState<(typeof ATTRACTIONS)[0] | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ATTRACTIONS.map((place, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 26 }}
            whileHover={{ y: -5 }}
            onClick={() => setModal(place)}
            className="group rounded-2xl overflow-hidden cursor-pointer"
            style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={place.img}
                alt={place.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,17,29,0.82) 0%, transparent 55%)" }} />
              {place.unesco && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide" style={{ background: "rgba(124,77,255,0.88)", backdropFilter: "blur(8px)" }}>
                  UNESCO ✦
                </div>
              )}
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(8px)" }}>
                <Star size={10} fill={C.amber} color={C.amber} />
                <span className="text-xs font-bold text-white">{place.rating}</span>
              </div>
            </div>
            <div className="p-4">
              <p className="font-bold text-sm mb-1 text-white">{place.name}</p>
              <p className="text-xs mb-2 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.38)" }}>
                <MapPin size={9} /> {place.district}
              </p>
              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.52)" }}>{place.desc}</p>
              <p className="text-xs mt-2.5 font-medium" style={{ color: C.green }}>✦ Best: {place.season}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          style={{ background: "rgba(3,9,18,0.9)", backdropFilter: "blur(24px)" }}
          onClick={() => setModal(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="w-full max-w-md rounded-3xl overflow-hidden"
            style={{ background: "#0B1726", border: `1px solid ${C.cardBorder}`, boxShadow: "0 50px 120px rgba(0,0,0,0.85)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-56">
              <img src={modal.img} alt={modal.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0B1726 0%, transparent 50%)" }} />
              <button onClick={() => setModal(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
                <X size={15} className="text-white" />
              </button>
              {modal.unesco && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-xl text-xs font-bold" style={{ background: "rgba(124,77,255,0.9)" }}>
                  UNESCO World Heritage ✦
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{modal.name}</h3>
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  <Star size={14} fill={C.amber} color={C.amber} />
                  <span className="font-bold text-sm" style={{ color: C.amber, fontFamily: "'Space Grotesk', sans-serif" }}>{modal.rating}</span>
                </div>
              </div>
              <p className="text-xs mb-4 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.38)" }}>
                <MapPin size={9} /> {modal.district}, Maharashtra
              </p>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.68)" }}>{modal.desc}</p>
              <span className="inline-block text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: "rgba(34,197,94,0.1)", color: C.green, border: "1px solid rgba(34,197,94,0.2)" }}>
                Best Season: {modal.season}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

// ── Weather section ────────────────────────────────────────────────────────────
function WeatherSection() {
  const w = WEATHER;

  return (
    <div className="space-y-4">
      {/* Hero weather card */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #0A1628 60%, #101D35 100%)", border: `1px solid rgba(76,201,240,0.15)` }}>
        {/* Atmospheric particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute opacity-[0.07]" style={{ top: "8%", right: "12%", fontSize: 80, animation: "wdrift 14s ease-in-out infinite" }}>⛅</div>
          <div className="absolute opacity-[0.05]" style={{ top: "45%", right: "30%", fontSize: 52, animation: "wdrift 20s ease-in-out infinite reverse" }}>☁️</div>
        </div>

        <div className="relative p-6 md:p-8">
          <div className="flex items-start justify-between mb-7">
            <div>
              <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                <MapPin size={10} /> Mumbai, Maharashtra · Live
              </p>
              <div className="flex items-end gap-3 mb-1">
                <span className="font-black leading-none" style={{ fontSize: "5rem", fontFamily: "'Space Grotesk', sans-serif", color: C.neon }}>
                  {w.temp}°
                </span>
                <span className="text-6xl mb-2">⛅</span>
              </div>
              <p className="text-base" style={{ color: "rgba(255,255,255,0.58)" }}>{w.condition}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="mb-2">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Feels Like</p>
                <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "rgba(255,255,255,0.8)" }}>{w.feelsLike}°C</p>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>🌅 {w.sunrise}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>🌇 {w.sunset}</p>
            </div>
          </div>

          {/* Quick metrics */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { icon: <Droplets size={14} />, label: "Humidity",    val: `${w.humidity}%`, color: C.teal },
              { icon: <Wind      size={14} />, label: "Wind",        val: `${w.wind} km/h`, color: C.cyan },
              { icon: <Eye       size={14} />, label: "AQI",         val: `${w.aqi}`,       color: C.green },
              { icon: <Sun       size={14} />, label: "UV Index",    val: `${w.uv}`,        color: C.amber },
            ].map(({ icon, label, val, color }) => (
              <div key={label} className="flex flex-col items-center py-3 px-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="mb-1.5" style={{ color }}>{icon}</div>
                <p className="text-sm font-bold leading-none mb-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{val}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.36)" }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Rain bar */}
          <div className="p-3.5 rounded-2xl mb-6" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="flex justify-between text-xs mb-2">
              <span style={{ color: "rgba(255,255,255,0.45)" }}>🌧 Rain Probability</span>
              <span className="font-bold" style={{ color: C.cyan, fontFamily: "'Space Grotesk', sans-serif" }}>{w.rain}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.09)" }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${w.rain}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                style={{ background: `linear-gradient(to right, ${C.cyan}, ${C.violet})` }}
              />
            </div>
          </div>

          {/* Hourly */}
          <div>
            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.38)" }}>Hourly Forecast</p>
            <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {w.hourly.map((h, i) => (
                <div
                  key={i}
                  className="shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl"
                  style={{
                    background: i === 0 ? C.cyanDim : "rgba(255,255,255,0.04)",
                    border: i === 0 ? `1px solid ${C.cyanBorder}` : "1px solid transparent",
                  }}
                >
                  <p className="text-[10px]" style={{ color: i === 0 ? C.cyan : "rgba(255,255,255,0.36)" }}>{h.time}</p>
                  <p className="text-lg">{h.icon}</p>
                  <p className="text-xs font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{h.temp}°</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 7-day */}
      <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.38)" }}>7-Day Forecast</p>
        <div className="space-y-2.5">
          {w.weekly.map((day, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <p className="text-sm w-9" style={{ color: "rgba(255,255,255,0.58)" }}>{day.day}</p>
              <p className="text-lg w-7">{day.icon}</p>
              <div className="flex-1 mx-2">
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.round(((day.high - 20) / 15) * 100)}%`, background: `linear-gradient(to right, ${C.cyan}, ${C.amber})` }} />
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{day.high}°</span>
                <span style={{ color: "rgba(255,255,255,0.38)" }}>{day.low}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal chart */}
      <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.38)" }}>Annual Temperature Pattern (°C)</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={w.seasonal}>
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.cyan} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={C.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="m" tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[18, 38]} />
              <Tooltip contentStyle={{ background: "#0B1726", border: `1px solid ${C.cardBorder}`, borderRadius: 12, color: "#fff", fontSize: 12 }} />
              <Area type="monotone" dataKey="t" stroke={C.cyan} strokeWidth={2} fill="url(#tg)" name="Avg °C" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        @keyframes wdrift { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-18px,-12px) scale(1.04);} }
      `}</style>
    </div>
  );
}

// ── Economy section ────────────────────────────────────────────────────────────
function EconomySection() {
  const e = ECONOMY;
  const kpis = [
    { label:"GSDP",          val: e.gsdp,     sub:"Gross State Domestic Product", color: C.cyan,   icon:"💹" },
    { label:"GDP Rank",      val: e.rank,     sub:"Among all Indian states",       color: C.violet, icon:"🏆" },
    { label:"Growth Rate",   val: e.growth,   sub:"Year-over-year increase",       color: C.green,  icon:"📈" },
    { label:"Per Capita",    val: e.perCapita,sub:"Annual income per person",       color: C.amber,  icon:"👤" },
  ];

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(({ label, val, sub, color, icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -4 }}
            className="rounded-2xl p-4"
            style={{ background: C.card, border: `1px solid ${color}1a` }}
          >
            <p className="text-xl mb-2">{icon}</p>
            <p className="text-[1.35rem] font-black leading-none mb-1.5" style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}>{val}</p>
            <p className="text-[10px] leading-snug" style={{ color: "rgba(255,255,255,0.36)" }}>{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Sector donut + bars */}
      <div className="rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-5 gap-6 items-center" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
        <div className="sm:col-span-2">
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.38)" }}>Sector Contribution</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={e.sectors} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={4}>
                  {e.sectors.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0B1726", border: `1px solid ${C.cardBorder}`, borderRadius: 12, color: "#fff", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="sm:col-span-3 space-y-3">
          {e.sectors.map((s) => (
            <div key={s.name}>
              <div className="flex justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span style={{ color: "rgba(255,255,255,0.75)" }}>{s.name}</span>
                </div>
                <span className="font-bold" style={{ color: s.color, fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Industries */}
      <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
        <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.38)" }}>Top Industries — Performance Index</p>
        <div className="space-y-4">
          {e.industries.map((ind, i) => (
            <div key={ind.name}>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: "rgba(255,255,255,0.78)" }}>{ind.name}</span>
                <span className="font-bold" style={{ color: ind.color, fontFamily: "'Space Grotesk', sans-serif" }}>{ind.pct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${ind.pct}%` }}
                  transition={{ duration: 1, delay: i * 0.1 + 0.2, ease: "easeOut" }}
                  style={{ background: `linear-gradient(to right, ${ind.color}88, ${ind.color})` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export chips */}
      <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
        <p className="text-xs mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.38)" }}>
          <TrendingUp size={12} /> Export Highlights
        </p>
        <div className="flex flex-wrap gap-2">
          {e.exports.map((exp, i) => (
            <motion.span
              key={exp}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 + 0.1 }}
              whileHover={{ scale: 1.06, y: -1 }}
              className="text-sm px-4 py-2 rounded-full font-medium cursor-default"
              style={{ background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyanBorder}` }}
            >
              {exp}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── StatePopup ────────────────────────────────────────────────────────────────
export default function StatePopup({ stateName, onClose }: { stateName: string | null; onClose: () => void }) {
  const isOpen = Boolean(stateName);
  const [activeTab, setActiveTab] = useState("map");
  const [parallax, setParallax] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const heroData = stateName ? (HERO_MAP[stateName] || FALLBACK_HERO) : FALLBACK_HERO;

  const requestClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => { setIsClosing(false); onClose(); }, 260);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) { setActiveTab("map"); setParallax(0); }
  }, [stateName, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") requestClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, requestClose]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setParallax(el.scrollTop * 0.28);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}
        style={{ background: "rgba(2,6,14,0.88)", backdropFilter: "blur(18px)" }}
        onClick={requestClose}
      />

      {/* Panel */}
      <div
        className={`fixed z-50 flex flex-col overflow-hidden transition-all duration-300
          inset-0 rounded-none
          md:rounded-[28px] md:inset-auto md:top-[4%] md:left-[5%] md:right-[5%] md:bottom-[4%]
          ${isClosing ? "opacity-0 scale-[0.97]" : "opacity-100 scale-100"}
        `}
        style={{
          background: "rgba(7,17,29,0.97)",
          backdropFilter: "blur(32px) saturate(180%)",
          border: `1px solid ${C.cardBorder}`,
          boxShadow: `0 60px 160px rgba(0,0,0,0.95), 0 0 0 0.5px ${C.cyanBorder} inset`,
        }}
      >
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: `${C.cyanBorder} transparent` }}
        >
          {stateName && (
            <>
              <Hero stateName={stateName} heroData={heroData} parallax={parallax} onClose={requestClose} />
              <TabNav active={activeTab} onSelect={setActiveTab} />

              <div className="px-4 md:px-10 py-7 pb-12">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                >
                  {activeTab === "map"         && <MapSection />}
                  {activeTab === "attractions" && <AttractionsSection />}
                  {activeTab === "weather"     && <WeatherSection />}
                  {activeTab === "economy"     && <EconomySection />}
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Demo App ──────────────────────────────────────────────────────────────────

