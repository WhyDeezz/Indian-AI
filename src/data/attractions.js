const CATEGORY_SEQUENCE = ["historical", "natural", "cultural"];

const PALETTE = [
  "20 90% 52%",
  "28 95% 58%",
  "145 60% 42%",
  "195 85% 46%",
  "250 72% 62%",
  "318 70% 60%",
];

const KNOWN_STATES = {
  "Madhya Pradesh": {
    avgTemp: 38,
    baseColor: "28 92% 54%",
    center: [78.6569, 22.9734],
    attractions: [
      { name: "Khajuraho Temples", category: "historical", detail: "UNESCO heritage temples and stone carvings.", coords: [79.93, 24.85] },
      { name: "Sanchi Stupa", category: "historical", detail: "Ancient Buddhist architecture and monument zone.", coords: [77.73, 23.48] },
      { name: "Pachmarhi Hills", category: "natural", detail: "Scenic hill station and Satpura views.", coords: [78.44, 22.47] },
    ],
  },
  Karnataka: {
    avgTemp: 34,
    baseColor: "32 90% 52%",
    center: [75.71, 15.32],
    attractions: [
      { name: "Mysore Palace", category: "historical", detail: "Royal heritage and city landmark.", coords: [76.65, 12.30] },
      { name: "Hampi Ruins", category: "historical", detail: "Ancient empire ruins and rock landscape.", coords: [76.47, 15.34] },
      { name: "Coorg Coffee Hills", category: "natural", detail: "Coffee estates, green hills and waterfalls.", coords: [75.73, 12.42] },
    ],
  },
  Maharashtra: {
    avgTemp: 35,
    baseColor: "18 88% 54%",
    center: [75.34, 19.75],
    attractions: [
      { name: "Gateway of India", category: "historical", detail: "Mumbai harbor landmark and heritage site.", coords: [72.83, 18.92] },
      { name: "Ajanta Caves", category: "historical", detail: "Rock-cut cave temples and murals.", coords: [75.71, 20.55] },
      { name: "Lonavala Hills", category: "natural", detail: "Weekend hill retreat with viewpoints.", coords: [73.41, 18.75] },
    ],
  },
  "Uttar Pradesh": {
    avgTemp: 41,
    baseColor: "24 92% 55%",
    center: [80.95, 26.85],
    attractions: [
      { name: "Taj Mahal", category: "historical", detail: "World-famous monument of love.", coords: [78.04, 27.18] },
      { name: "Bara Imambara", category: "historical", detail: "Nawabi architecture and legacy site.", coords: [80.93, 26.87] },
      { name: "Varanasi Ghats", category: "cultural", detail: "Sacred riverfront and spiritual culture.", coords: [83.01, 25.32] },
    ],
  },
  "Tamil Nadu": {
    avgTemp: 35,
    baseColor: "24 88% 53%",
    center: [78.65, 11.02],
    attractions: [
      { name: "Marina Beach", category: "natural", detail: "Long city beach and public promenade.", coords: [80.28, 13.05] },
      { name: "Meenakshi Temple", category: "historical", detail: "Temple architecture and pilgrimage site.", coords: [78.12, 9.92] },
      { name: "Nilgiri Hills", category: "natural", detail: "Tea gardens and cool mountain air.", coords: [76.74, 11.41] },
    ],
  },
  "West Bengal": {
    avgTemp: 35,
    baseColor: "36 90% 54%",
    center: [87.85, 22.98],
    attractions: [
      { name: "Howrah Bridge", category: "historical", detail: "Iconic Kolkata bridge and city symbol.", coords: [88.34, 22.57] },
      { name: "Sundarbans", category: "natural", detail: "Mangrove delta and wildlife reserve.", coords: [88.88, 21.95] },
      { name: "Darjeeling Tea Gardens", category: "natural", detail: "Himalayan tea slopes and views.", coords: [88.26, 27.04] },
    ],
  },
  Telangana: {
    avgTemp: 37,
    baseColor: "20 90% 53%",
    center: [79.09, 18.11],
    attractions: [
      { name: "Charminar", category: "historical", detail: "City monument and old Hyderabad core.", coords: [78.48, 17.36] },
      { name: "Golconda Fort", category: "historical", detail: "Fort complex and panoramic city views.", coords: [78.40, 17.38] },
      { name: "Hussain Sagar", category: "natural", detail: "Urban lake and recreation zone.", coords: [78.47, 17.44] },
    ],
  },
  Kerala: {
    avgTemp: 31,
    baseColor: "45 92% 55%",
    center: [76.45, 10.20],
    attractions: [
      { name: "Alappuzha Backwaters", category: "natural", detail: "Houseboats and lagoon scenery.", coords: [76.34, 9.49] },
      { name: "Munnar Tea Gardens", category: "natural", detail: "Highland tea plantations and mist.", coords: [77.06, 10.09] },
      { name: "Fort Kochi", category: "cultural", detail: "Colonial lanes and coastal heritage.", coords: [76.24, 9.97] },
    ],
  },
  Gujarat: {
    avgTemp: 36,
    baseColor: "30 90% 54%",
    center: [71.20, 22.30],
    attractions: [
      { name: "Rann of Kutch", category: "natural", detail: "Salt desert and seasonal festival zone.", coords: [69.97, 23.91] },
      { name: "Sabarmati Ashram", category: "historical", detail: "Freedom movement heritage site.", coords: [72.58, 23.05] },
      { name: "Gir Forest", category: "natural", detail: "Home of the Asiatic lion.", coords: [70.83, 21.15] },
    ],
  },
  Rajasthan: {
    avgTemp: 39,
    baseColor: "22 92% 56%",
    center: [73.85, 27.02],
    attractions: [
      { name: "Amber Fort", category: "historical", detail: "Hill fort and royal architecture.", coords: [75.85, 26.98] },
      { name: "Jaisalmer Fort", category: "historical", detail: "Golden fort in the desert city.", coords: [70.91, 26.91] },
      { name: "Lake Pichola", category: "natural", detail: "Udaipur lake and scenic city views.", coords: [73.68, 24.58] },
    ],
  },
};

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const offsetPoint = ([lng, lat], dx, dy) => [
  Number((lng + dx).toFixed(4)),
  Number((lat + dy).toFixed(4)),
];

const generateFallbackData = (stateName, centroid = [78, 22]) => {
  const seed = hashString(stateName);
  const paletteColor = PALETTE[seed % PALETTE.length];
  const avgTemp = 28 + (seed % 10);
  const [lng, lat] = centroid;

  return {
    avgTemp,
    baseColor: paletteColor,
    center: centroid,
    attractions: [
      {
        name: `${stateName} Heritage Gate`,
        category: CATEGORY_SEQUENCE[seed % CATEGORY_SEQUENCE.length],
        detail: `A signature stop that represents ${stateName}.`,
        coords: offsetPoint([lng, lat], -0.6, 0.25),
      },
      {
        name: `${stateName} Central Market`,
        category: CATEGORY_SEQUENCE[(seed + 1) % CATEGORY_SEQUENCE.length],
        detail: `A popular local gathering point in ${stateName}.`,
        coords: offsetPoint([lng, lat], 0.4, -0.15),
      },
      {
        name: `${stateName} Scenic View`,
        category: CATEGORY_SEQUENCE[(seed + 2) % CATEGORY_SEQUENCE.length],
        detail: `A scenic landmark commonly associated with ${stateName}.`,
        coords: offsetPoint([lng, lat], 0.1, 0.45),
      },
    ],
    heat: [
      [lng - 0.55, lat + 0.25, avgTemp - 3],
      [lng - 0.1, lat + 0.05, avgTemp + 1],
      [lng + 0.35, lat - 0.18, avgTemp + 2],
      [lng + 0.12, lat + 0.38, avgTemp - 1],
    ],
    economy: [
      [lng - 0.45, lat + 0.22, 0.24],
      [lng - 0.05, lat - 0.05, 0.55],
      [lng + 0.30, lat - 0.2, 0.82],
      [lng + 0.16, lat + 0.34, 0.66],
    ],
    economyIntensity: 0.62,
  };
};

export const getStateMapData = (stateName, centroid) => {
  const known = KNOWN_STATES[stateName];
  if (known) {
    return {
      ...known,
      heat: [
        [known.center[0] - 0.55, known.center[1] + 0.25, known.avgTemp - 3],
        [known.center[0] - 0.1, known.center[1] + 0.05, known.avgTemp + 1],
        [known.center[0] + 0.35, known.center[1] - 0.18, known.avgTemp + 2],
        [known.center[0] + 0.12, known.center[1] + 0.38, known.avgTemp - 1],
      ],
      economy: [
        [known.center[0] - 0.45, known.center[1] + 0.22, 0.25],
        [known.center[0] - 0.05, known.center[1] - 0.05, 0.52],
        [known.center[0] + 0.30, known.center[1] - 0.2, 0.84],
        [known.center[0] + 0.16, known.center[1] + 0.34, 0.68],
      ],
      economyIntensity: 0.78,
    };
  }

  return generateFallbackData(stateName, centroid);
};

export default getStateMapData;
