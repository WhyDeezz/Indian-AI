import { useState } from "react";
import indiaMap from "@svg-maps/india";

const STATE_COLORS = {
	"Jammu and Kashmir": "#ef4444",
	Punjab: "#f97316",
	Haryana: "#eab308",
	Delhi: "#84cc16",
	Rajasthan: "#22c55e",
	Gujarat: "#14b8a6",
	"Madhya Pradesh": "#06b6d4",
	Maharashtra: "#0ea5e9",
	Goa: "#3b82f6",
	Karnataka: "#6366f1",
	Kerala: "#8b5cf6",
	"Tamil Nadu": "#a855f7",
	"Andhra Pradesh": "#d946ef",
	Telangana: "#ec4899",
	"Uttar Pradesh": "#f43f5e",
	Bihar: "#f59e0b",
	Jharkhand: "#10b981",
	Odisha: "#0ea5e9",
	"West Bengal": "#e879f9",
	Assam: "#f87171",
};

const FALLBACK_STATE_COLOR = "#f97316";
const INACTIVE_COLOR = "#3f3f46";
const HOVER_COLOR = "#93c5fd";
const PALETTE = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

const fallbackColorForName = (name) => {
	let h = 0;
	for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
	return PALETTE[h % PALETTE.length];
};

const IndiaMap = ({ activeStates = [], selected, onSelect }) => {
	const [hovered, setHovered] = useState(null);
	const hasActiveStates = activeStates.length > 0;

	return (
		<div className="w-full h-full flex items-center justify-center">
			<svg
				viewBox={indiaMap.viewBox}
				width="100%"
				height="100%"
				preserveAspectRatio="xMidYMid meet"
			>
				{indiaMap.locations.map((location) => {
					const name = location.name;
					const isActive = hasActiveStates ? activeStates.includes(name) : true;
					const isSelected = selected === name;
					const isHovered = hovered === name;

					const baseColor = isActive
						? (STATE_COLORS[name] || fallbackColorForName(name) || FALLBACK_STATE_COLOR)
						: INACTIVE_COLOR;

					let fill = baseColor;
					if (isHovered && !isSelected) fill = HOVER_COLOR;
					if (isSelected) fill = "#ffffff";

					return (
						<path
							key={location.id}
							d={location.path}
							fill={fill}
							stroke={isSelected ? "#ffffff" : "#111827"}
							strokeWidth={isSelected ? 2.2 : 1}
							style={{ cursor: "pointer", transition: "fill 0.2s ease" }}
							onMouseEnter={() => setHovered(name)}
							onMouseLeave={() => setHovered(null)}
							onClick={() => onSelect?.(name)}
						/>
					);
				})}
			</svg>
		</div>
	);
};

export default IndiaMap;