// Curated demo data for a subset of Indian states.
// Each state has attractions tagged by category, average temperature, and economy stats.
type Weather = {
  temp: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  wind: number;
  aqi: number;
  uv: number;
  rain: number;
  sunrise: string;
  sunset: string;

  hourly: { time: string; icon: string; temp: number }[];
  weekly: { day: string; icon: string; high: number; low: number }[];
  seasonal: { m: string; t: number }[];
};

function makeWeather(
  temp: number,
  feelsLike: number,
  condition: string
): Weather {
  return {
    temp,
    feelsLike,
    condition,

    humidity: 72,
    wind: 14,
    aqi: 48,
    uv: 7,
    rain: 35,

    sunrise: "5:46 AM",
    sunset: "6:39 PM",

    hourly: [
      { time: "Now", icon: "☀️", temp },
      { time: "1 PM", icon: "⛅", temp: temp + 1 },
      { time: "2 PM", icon: "☁️", temp: temp + 2 },
      { time: "3 PM", icon: "🌤️", temp: temp + 1 },
      { time: "4 PM", icon: "🌦️", temp },
      { time: "5 PM", icon: "🌙", temp: temp - 1 },
    ],

    weekly: [
      { day: "Mon", icon: "☀️", high: temp + 2, low: temp - 6 },
      { day: "Tue", icon: "⛅", high: temp + 1, low: temp - 5 },
      { day: "Wed", icon: "🌦️", high: temp, low: temp - 7 },
      { day: "Thu", icon: "☀️", high: temp + 3, low: temp - 5 },
      { day: "Fri", icon: "☁️", high: temp + 1, low: temp - 6 },
      { day: "Sat", icon: "🌤️", high: temp + 2, low: temp - 4 },
      { day: "Sun", icon: "🌧️", high: temp - 1, low: temp - 7 },
    ],

    seasonal: [
      { m: "Jan", t: temp - 8 },
      { m: "Feb", t: temp - 6 },
      { m: "Mar", t: temp - 2 },
      { m: "Apr", t: temp + 2 },
      { m: "May", t: temp + 4 },
      { m: "Jun", t: temp + 2 },
      { m: "Jul", t: temp },
      { m: "Aug", t: temp - 1 },
      { m: "Sep", t: temp },
      { m: "Oct", t: temp - 2 },
      { m: "Nov", t: temp - 5 },
      { m: "Dec", t: temp - 7 },
    ],
  };
}


export type Category = "historical" | "natural" | "cultural";

export type Attraction = {
  id: string;
  name: string;
  category: Category;
  // Approximate lat/lng - used to position pins inside the state SVG.
  coords: [number, number];
  description: string;
  rating: number;
};

export type EconomyStat = {
  label: string;
  value: string;
};

export type StateInfo = {
  name: string;
  subtitle: string;
  avgTemp: number;
  attractions: Attraction[];
  // Annual temperature pattern (12 months).
   weather: Weather;
  economy: {
    gdp: string;
    perCapita: string;
    sectors: { name: string; value: number; color: string }[];
    stats: EconomyStat[];
  };
};

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const tempPattern = (low: number, high: number) =>
  months.map((m, i) => ({
    month: m,

    temp: Math.round(low + (high - low) * (0.5 + 0.5 * Math.sin(((i - 1) / 12) * Math.PI * 2 - Math.PI / 2 + Math.PI / 3))),
  }));

export const STATES: Record<string, StateInfo> = {
  "Madhya Pradesh": {
    name: "Madhya Pradesh",
    subtitle: "Heart of India",
    avgTemp: 38,
    attractions: [
      { id: "mp1", name: "Gwalior Fort",     category: "historical", coords: [78.1689, 26.2295], description: "Hilltop fort with palaces and rock-cut sculptures.", rating: 4.7 },
      { id: "mp2", name: "Khajuraho Temples", category: "cultural",  coords: [79.9199, 24.8318], description: "UNESCO nagara-style temple complex (10th c).",        rating: 4.9 },
      { id: "mp3", name: "Sanchi Stupa",      category: "historical", coords: [77.7397, 23.4793], description: "Oldest stone structure in India - Mauryan Buddhist.", rating: 4.8 },
      { id: "mp4", name: "Bhimbetka Caves",   category: "historical", coords: [77.6113, 22.9376], description: "30,000-year-old rock-shelter paintings.",             rating: 4.7 },
      { id: "mp5", name: "Kanha NP",          category: "natural",    coords: [80.6112, 22.3346], description: "Tiger reserve that inspired The Jungle Book.",        rating: 4.9 },
      { id: "mp6", name: "Bandhavgarh NP",    category: "natural",    coords: [80.9920, 23.7028], description: "Highest tiger density in India.",                     rating: 4.8 },
    ],
   weather: makeWeather(31, 35, "Partly Cloudy"),

    economy: {
      gdp: "$165 B",
      perCapita: "$1,560",
      sectors: [
        { name: "Services",     value: 43, color: "#3b82f6" },
        { name: "Agriculture",  value: 35, color: "#22c55e" },
        { name: "Industry",     value: 22, color: "#f59e0b" },
      ],
      stats: [
        { label: "Population", value: "85.3 M" },
        { label: "Literacy",   value: "70%" },
        { label: "Districts",  value: "55" },
        { label: "Languages",  value: "Hindi" },
      ],
    },
  },
  "Maharashtra": {
    name: "Maharashtra",
    subtitle: "Gateway of India",
    avgTemp: 33,
    attractions: [
      { id: "mh1", name: "Gateway of India", category: "historical", coords: [72.8347, 18.9219], description: "Iconic 1924 arch on the Mumbai waterfront.", rating: 4.8 },
      { id: "mh2", name: "Ajanta Caves",     category: "cultural",   coords: [75.7033, 20.5519], description: "UNESCO Buddhist rock-cut caves.",            rating: 4.9 },
      { id: "mh3", name: "Ellora Caves",     category: "cultural",   coords: [75.1780, 20.0258], description: "34 monasteries carved from basalt cliff.",  rating: 4.9 },
      { id: "mh4", name: "Tadoba NP",        category: "natural",    coords: [79.3243, 20.3944], description: "Maharashtra's oldest national park.",        rating: 4.8 },
      { id: "mh5", name: "Lonavala",         category: "natural",    coords: [73.4068, 18.7546], description: "Sahyadri hill station near Pune.",            rating: 4.6 },
    ],
     weather: makeWeather(31, 35, "Partly Cloudy"),
    economy: {
      gdp: "$485 B",
      perCapita: "$3,250",
      sectors: [
        { name: "Services",    value: 61, color: "#3b82f6" },
        { name: "Industry",    value: 27, color: "#f59e0b" },
        { name: "Agriculture", value: 12, color: "#22c55e" },
      ],
      stats: [
        { label: "Population", value: "126 M" },
        { label: "Literacy",   value: "82%" },
        { label: "Districts",  value: "36" },
        { label: "Capital",    value: "Mumbai" },
      ],
    },
  },
  "Rajasthan": {
    name: "Rajasthan",
    subtitle: "Land of Kings",
    avgTemp: 36,
    attractions: [
      { id: "rj1", name: "Amber Fort",      category: "historical", coords: [75.8513, 26.9855], description: "UNESCO hilltop fort with sheesh mahal.",  rating: 4.9 },
      { id: "rj2", name: "Mehrangarh Fort", category: "historical", coords: [73.0188, 26.2980], description: "36-metre ramparts above the Blue City.",  rating: 4.8 },
      { id: "rj3", name: "City Palace",     category: "cultural",   coords: [73.6800, 24.5760], description: "Udaipur's lakefront royal residence.",    rating: 4.8 },
      { id: "rj4", name: "Ranthambore NP",  category: "natural",    coords: [76.5026, 26.0173], description: "Famed tiger park amid ancient ruins.",    rating: 4.8 },
      { id: "rj5", name: "Thar Desert",     category: "natural",    coords: [71.4000, 27.0000], description: "Golden dunes near Jaisalmer.",            rating: 4.7 },
    ],
    weather: makeWeather(31, 35, "Partly Cloudy"),
    economy: {
      gdp: "$170 B",
      perCapita: "$2,100",
      sectors: [
        { name: "Services",    value: 47, color: "#3b82f6" },
        { name: "Agriculture", value: 28, color: "#22c55e" },
        { name: "Industry",    value: 25, color: "#f59e0b" },
      ],
      stats: [
        { label: "Population", value: "79.5 M" },
        { label: "Literacy",   value: "67%" },
        { label: "Districts",  value: "50" },
        { label: "Capital",    value: "Jaipur" },
      ],
    },
  },
  "Karnataka": {
    name: "Karnataka",
    subtitle: "Silicon Valley of India",
    avgTemp: 28,
    attractions: [
      { id: "ka1", name: "Hampi Ruins",     category: "historical", coords: [76.4600, 15.3350], description: "UNESCO Vijayanagara Empire ruins.",        rating: 4.9 },
      { id: "ka2", name: "Mysore Palace",   category: "cultural",   coords: [76.6552, 12.3052], description: "Indo-Saracenic palace lit by 96,000 bulbs.", rating: 4.9 },
      { id: "ka3", name: "Bandipur NP",     category: "natural",    coords: [76.6346, 11.6854], description: "Nilgiri biosphere - tigers and elephants.",   rating: 4.7 },
      { id: "ka4", name: "Coorg Hills",     category: "natural",    coords: [75.7382, 12.3375], description: "Coffee plantations in the Western Ghats.",   rating: 4.8 },
      { id: "ka5", name: "Pattadakal",      category: "historical", coords: [75.8167, 15.9486], description: "UNESCO Chalukya temple complex.",            rating: 4.7 },
    ],
    weather: makeWeather(31, 35, "Partly Cloudy"),
    economy: {
      gdp: "$248 B",
      perCapita: "$3,600",
      sectors: [
        { name: "Services",    value: 66, color: "#3b82f6" },
        { name: "Industry",    value: 22, color: "#f59e0b" },
        { name: "Agriculture", value: 12, color: "#22c55e" },
      ],
      stats: [
        { label: "Population", value: "67 M" },
        { label: "Literacy",   value: "75%" },
        { label: "Districts",  value: "31" },
        { label: "Capital",    value: "Bengaluru" },
      ],
    },
  },
  "Tamil Nadu": {
    name: "Tamil Nadu",
    subtitle: "Gateway to South India",
    avgTemp: 32,
    attractions: [
      { id: "tn1", name: "Meenakshi Temple",     category: "cultural",   coords: [78.1193, 9.9195],  description: "12-storey Dravidian gopurams at Madurai.", rating: 4.9 },
      { id: "tn2", name: "Brihadeeswarar Temple", category: "historical", coords: [79.1318, 10.7828], description: "1000-yr Chola granite marvel - UNESCO.",   rating: 4.9 },
      { id: "tn3", name: "Marina Beach",          category: "natural",    coords: [80.2824, 13.0500], description: "13 km urban beach in Chennai.",            rating: 4.5 },
      { id: "tn4", name: "Mahabalipuram",         category: "historical", coords: [80.1945, 12.6269], description: "Pallava-era seashore monuments.",         rating: 4.8 },
      { id: "tn5", name: "Mudumalai NP",          category: "natural",    coords: [76.6277, 11.6148], description: "Oldest wildlife sanctuary in India.",      rating: 4.7 },
    ],
 weather: makeWeather(31, 35, "Partly Cloudy"),
    economy: {
      gdp: "$320 B",
      perCapita: "$3,500",
      sectors: [
        { name: "Services",    value: 54, color: "#3b82f6" },
        { name: "Industry",    value: 34, color: "#f59e0b" },
        { name: "Agriculture", value: 12, color: "#22c55e" },
      ],
      stats: [
        { label: "Population", value: "77 M" },
        { label: "Literacy",   value: "80%" },
        { label: "Districts",  value: "38" },
        { label: "Capital",    value: "Chennai" },
      ],
    },
  },
  "Kerala": {
    name: "Kerala",
    subtitle: "God's Own Country",
    avgTemp: 29,
    attractions: [
      { id: "kl1", name: "Fort Kochi",        category: "historical", coords: [76.2432, 9.9638], description: "Chinese nets and colonial heritage.",        rating: 4.8 },
      { id: "kl2", name: "Padmanabhaswamy",   category: "cultural",   coords: [76.9488, 8.4854], description: "World's richest temple - Dravidian.",         rating: 4.9 },
      { id: "kl3", name: "Periyar Reserve",   category: "natural",    coords: [77.1810, 9.4650], description: "Lake sanctuary with wild elephants.",         rating: 4.8 },
      { id: "kl4", name: "Munnar Hills",      category: "natural",    coords: [77.0595, 10.0889], description: "Tea-carpeted Western Ghats hill town.",      rating: 4.9 },
      { id: "kl5", name: "Alleppey Backwaters",category: "natural",   coords: [76.3388, 9.4981], description: "Houseboats threading palm-lined canals.",    rating: 4.9 },
    ],
   weather: makeWeather(31, 35, "Partly Cloudy"),
    economy: {
      gdp: "$130 B",
      perCapita: "$3,800",
      sectors: [
        { name: "Services",    value: 63, color: "#3b82f6" },
        { name: "Agriculture", value: 22, color: "#22c55e" },
        { name: "Industry",    value: 15, color: "#f59e0b" },
      ],
      stats: [
        { label: "Population", value: "35.7 M" },
        { label: "Literacy",   value: "94%" },
        { label: "Districts",  value: "14" },
        { label: "Capital",    value: "Thiruvananthapuram" },
      ],
    },
  },
  "Gujarat": {
    name: "Gujarat",
    subtitle: "Jewel of the West",
    avgTemp: 34,
    attractions: [
      { id: "gj1", name: "Rann of Kutch",  category: "natural",    coords: [69.8597, 23.7337], description: "Largest salt desert on Earth.",         rating: 4.9 },
      { id: "gj2", name: "Somnath Temple", category: "cultural",   coords: [70.4014, 20.8881], description: "First of the 12 Jyotirlingas.",          rating: 4.9 },
      { id: "gj3", name: "Gir Forest",     category: "natural",    coords: [70.8242, 21.1243], description: "Only home of the Asiatic lion.",         rating: 4.8 },
      { id: "gj4", name: "Statue of Unity",category: "historical", coords: [73.7191, 21.8380], description: "World's tallest statue at 182 m.",       rating: 4.8 },
      { id: "gj5", name: "Sabarmati Ashram",category: "historical",coords: [72.5800, 23.0600], description: "Gandhi's home from 1917-1930.",         rating: 4.7 },
    ],
    weather: makeWeather(31, 35, "Partly Cloudy"),
    economy: {
      gdp: "$260 B",
      perCapita: "$3,200",
      sectors: [
        { name: "Industry",    value: 42, color: "#f59e0b" },
        { name: "Services",    value: 41, color: "#3b82f6" },
        { name: "Agriculture", value: 17, color: "#22c55e" },
      ],
      stats: [
        { label: "Population", value: "70 M" },
        { label: "Literacy",   value: "78%" },
        { label: "Districts",  value: "33" },
        { label: "Capital",    value: "Gandhinagar" },
      ],
    },
  },
  "West Bengal": {
    name: "West Bengal",
    subtitle: "Cultural Capital",
    avgTemp: 30,
    attractions: [
      { id: "wb1", name: "Victoria Memorial", category: "historical", coords: [88.3426, 22.5448], description: "Marble masterpiece in Kolkata.",                rating: 4.8 },
      { id: "wb2", name: "Dakshineswar",      category: "cultural",   coords: [88.3763, 22.6544], description: "Ramakrishna's Kali temple on the Hooghly.",     rating: 4.8 },
      { id: "wb3", name: "Sundarbans NP",     category: "natural",    coords: [89.1833, 21.9497], description: "World's largest mangrove forest.",              rating: 4.9 },
      { id: "wb4", name: "Darjeeling",        category: "natural",    coords: [88.2627, 27.0360], description: "Toy train and Kanchenjunga views.",             rating: 4.9 },
    ],
    weather: makeWeather(31, 35, "Partly Cloudy"),
    economy: {
      gdp: "$200 B",
      perCapita: "$1,900",
      sectors: [
        { name: "Services",    value: 56, color: "#3b82f6" },
        { name: "Industry",    value: 21, color: "#f59e0b" },
        { name: "Agriculture", value: 23, color: "#22c55e" },
      ],
      stats: [
        { label: "Population", value: "100 M" },
        { label: "Literacy",   value: "77%" },
        { label: "Districts",  value: "23" },
        { label: "Capital",    value: "Kolkata" },
      ],
    },
  },
  "Uttar Pradesh": {
    name: "Uttar Pradesh",
    subtitle: "Heartland of Heritage",
    avgTemp: 33,
    attractions: [
      { id: "up1", name: "Taj Mahal",      category: "historical", coords: [78.0421, 27.1751], description: "Mughal marble mausoleum, UNESCO icon.",     rating: 5.0 },
      { id: "up2", name: "Varanasi Ghats", category: "cultural",   coords: [83.0086, 25.3176], description: "Oldest living city on the Ganges.",         rating: 4.9 },
      { id: "up3", name: "Fatehpur Sikri", category: "historical", coords: [77.6610, 27.0937], description: "Akbar's planned red-sandstone city.",       rating: 4.8 },
      { id: "up4", name: "Dudhwa NP",      category: "natural",    coords: [80.6770, 28.5070], description: "Terai grasslands - tigers and rhinos.",     rating: 4.6 },
    ],
 weather: makeWeather(31, 35, "Partly Cloudy"),
    economy: {
      gdp: "$235 B",
      perCapita: "$1,000",
      sectors: [
        { name: "Services",    value: 48, color: "#3b82f6" },
        { name: "Agriculture", value: 26, color: "#22c55e" },
        { name: "Industry",    value: 26, color: "#f59e0b" },
      ],
      stats: [
        { label: "Population", value: "230 M" },
        { label: "Literacy",   value: "68%" },
        { label: "Districts",  value: "75" },
        { label: "Capital",    value: "Lucknow" },
      ],
    },
  },
"Andhra Pradesh": {
  name: "Andhra Pradesh",
  subtitle: "Rice Bowl of India",
  avgTemp: 33,
  attractions: [
    {
      id: "ap1",
      name: "Tirumala Venkateswara Temple",
      category: "cultural",
      coords: [79.3470, 13.6833],
      description: "One of the world's richest and most visited Hindu temples.",
      rating: 5.0
    },
    {
      id: "ap2",
      name: "Lepakshi Temple",
      category: "historical",
      coords: [77.6085, 13.8004],
      description: "Famous for its hanging pillar and exquisite Vijayanagara architecture.",
      rating: 4.8
    },
    {
      id: "ap3",
      name: "Araku Valley",
      category: "natural",
      coords: [82.8806, 18.3273],
      description: "Scenic hill station known for coffee plantations and tribal culture.",
      rating: 4.8
    },
    {
      id: "ap4",
      name: "Borra Caves",
      category: "natural",
      coords: [83.0418, 18.2795],
      description: "Million-year-old limestone caves with stunning rock formations.",
      rating: 4.7
    },
    {
      id: "ap5",
      name: "Amaravati Stupa",
      category: "historical",
      coords: [80.3575, 16.5726],
      description: "Ancient Buddhist monument dating back to the Mauryan era.",
      rating: 4.7
    }
  ],

  weather: makeWeather(32, 37, "Sunny"),

  economy: {
    gdp: "$185 B",
    perCapita: "$2,450",
    sectors: [
      { name: "Services", value: 48, color: "#3b82f6" },
      { name: "Agriculture", value: 30, color: "#22c55e" },
      { name: "Industry", value: 22, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "54 M" },
      { label: "Literacy", value: "67%" },
      { label: "Districts", value: "26" },
      { label: "Capital", value: "Amaravati" }
    ]
  }
},
"Arunachal Pradesh": {
  name: "Arunachal Pradesh",
  subtitle: "Land of the Rising Sun",
  avgTemp: 22,
  attractions: [
    {
      id: "ar1",
      name: "Tawang Monastery",
      category: "cultural",
      coords: [91.8660, 27.5866],
      description: "India's largest Buddhist monastery and the second-largest in the world.",
      rating: 4.9
    },
    {
      id: "ar2",
      name: "Namdapha National Park",
      category: "natural",
      coords: [96.3960, 27.5150],
      description: "One of India's richest biodiversity hotspots with rare wildlife.",
      rating: 4.8
    },
    {
      id: "ar3",
      name: "Sela Pass",
      category: "natural",
      coords: [92.4675, 27.5010],
      description: "High-altitude mountain pass known for its snow-covered landscapes and Sela Lake.",
      rating: 4.9
    },
    {
      id: "ar4",
      name: "Ziro Valley",
      category: "natural",
      coords: [93.8280, 27.6338],
      description: "UNESCO tentative site famous for Apatani tribal culture and scenic beauty.",
      rating: 4.8
    },
    {
      id: "ar5",
      name: "Ita Fort",
      category: "historical",
      coords: [93.6150, 27.0844],
      description: "Ancient 14th-century fort built using thousands of brick stones.",
      rating: 4.5
    }
  ],

  weather: makeWeather(20, 19, "Cloudy"),

  economy: {
    gdp: "$5 B",
    perCapita: "$2,700",
    sectors: [
      { name: "Services", value: 44, color: "#3b82f6" },
      { name: "Agriculture", value: 36, color: "#22c55e" },
      { name: "Industry", value: 20, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "1.7 M" },
      { label: "Literacy", value: "66%" },
      { label: "Districts", value: "28" },
      { label: "Capital", value: "Itanagar" }
    ]
  }
},
"Assam": {
  name: "Assam",
  subtitle: "Gateway to Northeast India",
  avgTemp: 29,
  attractions: [
    {
      id: "as1",
      name: "Kaziranga National Park",
      category: "natural",
      coords: [93.3639, 26.5775],
      description: "UNESCO World Heritage Site famous for the one-horned rhinoceros.",
      rating: 5.0
    },
    {
      id: "as2",
      name: "Kamakhya Temple",
      category: "cultural",
      coords: [91.7055, 26.1665],
      description: "Ancient Shakti Peetha atop Nilachal Hill in Guwahati.",
      rating: 4.9
    },
    {
      id: "as3",
      name: "Majuli Island",
      category: "natural",
      coords: [94.2243, 26.9528],
      description: "The world's largest inhabited river island, known for Vaishnavite monasteries.",
      rating: 4.8
    },
    {
      id: "as4",
      name: "Rang Ghar",
      category: "historical",
      coords: [94.6356, 26.9934],
      description: "An 18th-century Ahom amphitheatre, one of Asia's oldest.",
      rating: 4.6
    },
    {
      id: "as5",
      name: "Manas National Park",
      category: "natural",
      coords: [91.0123, 26.7255],
      description: "UNESCO World Heritage Site renowned for its biodiversity and tiger reserve.",
      rating: 4.8
    }
  ],

  weather: makeWeather(29, 33, "Rainy"),

  economy: {
    gdp: "$68 B",
    perCapita: "$1,550",
    sectors: [
      { name: "Services", value: 46, color: "#3b82f6" },
      { name: "Agriculture", value: 34, color: "#22c55e" },
      { name: "Industry", value: 20, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "36 M" },
      { label: "Literacy", value: "73%" },
      { label: "Districts", value: "35" },
      { label: "Capital", value: "Dispur" }
    ]
  }
},
"Bihar": {
  name: "Bihar",
  subtitle: "Land of Ancient Empires",
  avgTemp: 34,
  attractions: [
    {
      id: "br1",
      name: "Mahabodhi Temple",
      category: "cultural",
      coords: [84.9913, 24.6951],
      description: "UNESCO World Heritage Site where Gautama Buddha attained enlightenment.",
      rating: 5.0
    },
    {
      id: "br2",
      name: "Nalanda University Ruins",
      category: "historical",
      coords: [85.4439, 25.1367],
      description: "Ancient seat of learning and one of the world's oldest universities.",
      rating: 4.9
    },
    {
      id: "br3",
      name: "Vikramshila Ruins",
      category: "historical",
      coords: [87.1554, 25.2557],
      description: "Renowned Buddhist university established during the Pala dynasty.",
      rating: 4.7
    },
    {
      id: "br4",
      name: "Valmiki National Park",
      category: "natural",
      coords: [84.1505, 27.4296],
      description: "Tiger reserve along the Indo-Nepal border with rich wildlife.",
      rating: 4.7
    },
    {
      id: "br5",
      name: "Golghar",
      category: "historical",
      coords: [85.3137, 25.6206],
      description: "Iconic granary in Patna offering panoramic city views.",
      rating: 4.5
    }
  ],

  weather: makeWeather(33, 38, "Hot & Humid"),

  economy: {
    gdp: "$115 B",
    perCapita: "$850",
    sectors: [
      { name: "Services", value: 53, color: "#3b82f6" },
      { name: "Agriculture", value: 28, color: "#22c55e" },
      { name: "Industry", value: 19, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "130 M" },
      { label: "Literacy", value: "62%" },
      { label: "Districts", value: "38" },
      { label: "Capital", value: "Patna" }
    ]
  }
},
"Chhattisgarh": {
  name: "Chhattisgarh",
  subtitle: "The Rice Bowl of Central India",
  avgTemp: 32,
  attractions: [
    {
      id: "cg1",
      name: "Chitrakote Falls",
      category: "natural",
      coords: [81.6965, 19.2075],
      description: "India's widest waterfall, often called the 'Niagara Falls of India'.",
      rating: 4.9
    },
    {
      id: "cg2",
      name: "Kanger Valley National Park",
      category: "natural",
      coords: [81.9556, 18.8117],
      description: "Dense forests, limestone caves, waterfalls, and diverse wildlife.",
      rating: 4.8
    },
    {
      id: "cg3",
      name: "Bhoramdeo Temple",
      category: "historical",
      coords: [81.1006, 22.1085],
      description: "11th-century temple complex known as the 'Khajuraho of Chhattisgarh'.",
      rating: 4.7
    },
    {
      id: "cg4",
      name: "Sirpur",
      category: "historical",
      coords: [82.1834, 21.3474],
      description: "Ancient archaeological site with Buddhist monasteries and Hindu temples.",
      rating: 4.8
    },
    {
      id: "cg5",
      name: "Tirathgarh Falls",
      category: "natural",
      coords: [81.8773, 18.9205],
      description: "A picturesque multi-tiered waterfall nestled inside Kanger Valley.",
      rating: 4.8
    }
  ],

  weather: makeWeather(31, 36, "Partly Cloudy"),

  economy: {
    gdp: "$62 B",
    perCapita: "$2,150",
    sectors: [
      { name: "Industry", value: 42, color: "#f59e0b" },
      { name: "Services", value: 37, color: "#3b82f6" },
      { name: "Agriculture", value: 21, color: "#22c55e" }
    ],
    stats: [
      { label: "Population", value: "30 M" },
      { label: "Literacy", value: "71%" },
      { label: "Districts", value: "33" },
      { label: "Capital", value: "Raipur" }
    ]
  }
},
"Goa": {
  name: "Goa",
  subtitle: "Pearl of the Orient",
  avgTemp: 30,
  attractions: [
    {
      id: "ga1",
      name: "Basilica of Bom Jesus",
      category: "historical",
      coords: [73.9117, 15.5009],
      description: "UNESCO World Heritage Site housing the relics of St. Francis Xavier.",
      rating: 4.9
    },
    {
      id: "ga2",
      name: "Calangute Beach",
      category: "natural",
      coords: [73.7527, 15.5439],
      description: "Goa's largest and most popular beach, famous for water sports.",
      rating: 4.8
    },
    {
      id: "ga3",
      name: "Dudhsagar Falls",
      category: "natural",
      coords: [74.3143, 15.3144],
      description: "A spectacular four-tiered waterfall nestled in the Western Ghats.",
      rating: 4.9
    },
    {
      id: "ga4",
      name: "Fort Aguada",
      category: "historical",
      coords: [73.7681, 15.4937],
      description: "17th-century Portuguese fort overlooking the Arabian Sea.",
      rating: 4.7
    },
    {
      id: "ga5",
      name: "Shri Mangueshi Temple",
      category: "cultural",
      coords: [73.9012, 15.4393],
      description: "One of Goa's most revered Hindu temples dedicated to Lord Shiva.",
      rating: 4.8
    }
  ],

  weather: makeWeather(29, 33, "Sunny"),

  economy: {
    gdp: "$18 B",
    perCapita: "$7,800",
    sectors: [
      { name: "Services", value: 73, color: "#3b82f6" },
      { name: "Industry", value: 18, color: "#f59e0b" },
      { name: "Agriculture", value: 9, color: "#22c55e" }
    ],
    stats: [
      { label: "Population", value: "1.6 M" },
      { label: "Literacy", value: "88%" },
      { label: "Districts", value: "2" },
      { label: "Capital", value: "Panaji" }
    ]
  }
},
"Haryana": {
  name: "Haryana",
  subtitle: "Land of Green Fields",
  avgTemp: 34,
  attractions: [
    {
      id: "hr1",
      name: "Kurukshetra",
      category: "historical",
      coords: [76.8234, 29.9695],
      description: "Sacred battlefield of the Mahabharata and birthplace of the Bhagavad Gita.",
      rating: 4.9
    },
    {
      id: "hr2",
      name: "Sultanpur National Park",
      category: "natural",
      coords: [76.8916, 28.4595],
      description: "Renowned bird sanctuary attracting migratory birds from across the world.",
      rating: 4.7
    },
    {
      id: "hr3",
      name: "Pinjore Gardens",
      category: "historical",
      coords: [76.9180, 30.7982],
      description: "Beautiful Mughal-style terraced gardens built in the 17th century.",
      rating: 4.6
    },
    {
      id: "hr4",
      name: "Kingdom of Dreams",
      category: "cultural",
      coords: [77.0737, 28.4697],
      description: "India's premier live entertainment, theatre, and cultural destination.",
      rating: 4.6
    },
    {
      id: "hr5",
      name: "Morni Hills",
      category: "natural",
      coords: [77.1236, 30.7022],
      description: "The only hill station in Haryana, known for scenic trekking trails.",
      rating: 4.7
    }
  ],

  weather: makeWeather(33, 38, "Sunny"),

  economy: {
    gdp: "$145 B",
    perCapita: "$3,900",
    sectors: [
      { name: "Services", value: 52, color: "#3b82f6" },
      { name: "Industry", value: 33, color: "#f59e0b" },
      { name: "Agriculture", value: 15, color: "#22c55e" }
    ],
    stats: [
      { label: "Population", value: "30 M" },
      { label: "Literacy", value: "76%" },
      { label: "Districts", value: "22" },
      { label: "Capital", value: "Chandigarh" }
    ]
  }
},
"Himachal Pradesh": {
  name: "Himachal Pradesh",
  subtitle: "Dev Bhoomi",
  avgTemp: 21,
  attractions: [
    {
      id: "hp1",
      name: "Shimla",
      category: "historical",
      coords: [77.1734, 31.1048],
      description: "Former summer capital of British India with colonial architecture.",
      rating: 4.8
    },
    {
      id: "hp2",
      name: "Spiti Valley",
      category: "natural",
      coords: [78.0180, 32.2461],
      description: "Cold desert valley renowned for dramatic Himalayan landscapes.",
      rating: 4.9
    },
    {
      id: "hp3",
      name: "Hadimba Devi Temple",
      category: "cultural",
      coords: [77.1873, 32.2432],
      description: "Ancient wooden temple surrounded by cedar forests in Manali.",
      rating: 4.8
    },
    {
      id: "hp4",
      name: "Great Himalayan National Park",
      category: "natural",
      coords: [77.5107, 31.8134],
      description: "UNESCO World Heritage Site with pristine alpine ecosystems.",
      rating: 4.9
    },
    {
      id: "hp5",
      name: "Kangra Fort",
      category: "historical",
      coords: [76.2662, 32.0998],
      description: "One of India's oldest forts overlooking the Banganga River.",
      rating: 4.7
    }
  ],

  weather: makeWeather(20, 18, "Cool & Clear"),

  economy: {
    gdp: "$27 B",
    perCapita: "$3,100",
    sectors: [
      { name: "Services", value: 47, color: "#3b82f6" },
      { name: "Agriculture", value: 27, color: "#22c55e" },
      { name: "Industry", value: 26, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "7.5 M" },
      { label: "Literacy", value: "83%" },
      { label: "Districts", value: "12" },
      { label: "Capital", value: "Shimla" }
    ]
  }
},
"Jharkhand": {
  name: "Jharkhand",
  subtitle: "The Land of Forests",
  avgTemp: 31,
  attractions: [
    {
      id: "jh1",
      name: "Betla National Park",
      category: "natural",
      coords: [84.2028, 23.8795],
      description: "One of India's earliest tiger reserves, rich in wildlife and forests.",
      rating: 4.7
    },
    {
      id: "jh2",
      name: "Hundru Falls",
      category: "natural",
      coords: [85.5298, 23.4627],
      description: "A spectacular 98-meter waterfall formed by the Subarnarekha River.",
      rating: 4.8
    },
    {
      id: "jh3",
      name: "Baidyanath Temple",
      category: "cultural",
      coords: [86.7115, 24.4829],
      description: "One of the twelve sacred Jyotirlingas dedicated to Lord Shiva.",
      rating: 4.9
    },
    {
      id: "jh4",
      name: "Jagannath Temple",
      category: "historical",
      coords: [85.3096, 23.3076],
      description: "17th-century temple inspired by the Jagannath Temple of Puri.",
      rating: 4.6
    },
    {
      id: "jh5",
      name: "Dassam Falls",
      category: "natural",
      coords: [85.8238, 23.3963],
      description: "Scenic waterfall on the Kanchi River surrounded by lush greenery.",
      rating: 4.7
    }
  ],

  weather: makeWeather(30, 35, "Partly Cloudy"),

  economy: {
    gdp: "$55 B",
    perCapita: "$1,550",
    sectors: [
      { name: "Industry", value: 39, color: "#f59e0b" },
      { name: "Services", value: 38, color: "#3b82f6" },
      { name: "Agriculture", value: 23, color: "#22c55e" }
    ],
    stats: [
      { label: "Population", value: "40 M" },
      { label: "Literacy", value: "67%" },
      { label: "Districts", value: "24" },
      { label: "Capital", value: "Ranchi" }
    ]
  }
},
"Manipur": {
  name: "Manipur",
  subtitle: "Jewel of India",
  avgTemp: 24,
  attractions: [
    {
      id: "mn1",
      name: "Loktak Lake",
      category: "natural",
      coords: [93.8398, 24.4965],
      description: "India's largest freshwater lake, famous for its floating phumdis.",
      rating: 4.9
    },
    {
      id: "mn2",
      name: "Keibul Lamjao National Park",
      category: "natural",
      coords: [93.8266, 24.4707],
      description: "World's only floating national park and home of the Sangai deer.",
      rating: 4.9
    },
    {
      id: "mn3",
      name: "Kangla Fort",
      category: "historical",
      coords: [93.9445, 24.8062],
      description: "Ancient seat of Manipur's rulers with deep cultural significance.",
      rating: 4.7
    },
    {
      id: "mn4",
      name: "Shree Govindajee Temple",
      category: "cultural",
      coords: [93.9402, 24.8176],
      description: "Historic Vaishnavite temple in Imphal.",
      rating: 4.7
    },
    {
      id: "mn5",
      name: "Dzukou Valley",
      category: "natural",
      coords: [94.1134, 25.5744],
      description: "Picturesque valley renowned for seasonal wildflowers and trekking.",
      rating: 4.9
    }
  ],

  weather: makeWeather(23, 22, "Cloudy"),

  economy: {
    gdp: "$5 B",
    perCapita: "$1,700",
    sectors: [
      { name: "Services", value: 48, color: "#3b82f6" },
      { name: "Agriculture", value: 34, color: "#22c55e" },
      { name: "Industry", value: 18, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "3.3 M" },
      { label: "Literacy", value: "80%" },
      { label: "Districts", value: "16" },
      { label: "Capital", value: "Imphal" }
    ]
  }
},
"Meghalaya": {
  name: "Meghalaya",
  subtitle: "Abode of Clouds",
  avgTemp: 22,
  attractions: [
    {
      id: "ml1",
      name: "Living Root Bridges",
      category: "natural",
      coords: [91.7180, 25.2958],
      description: "Unique bridges handcrafted from living tree roots by the Khasi people.",
      rating: 5.0
    },
    {
      id: "ml2",
      name: "Nohkalikai Falls",
      category: "natural",
      coords: [91.6815, 25.2787],
      description: "India's tallest plunge waterfall near Cherrapunji.",
      rating: 4.9
    },
    {
      id: "ml3",
      name: "Mawsmai Cave",
      category: "natural",
      coords: [91.7290, 25.2675],
      description: "Popular limestone cave with fascinating formations.",
      rating: 4.7
    },
    {
      id: "ml4",
      name: "Shillong Peak",
      category: "natural",
      coords: [91.8557, 25.5700],
      description: "Highest point in Meghalaya offering panoramic views.",
      rating: 4.8
    },
    {
      id: "ml5",
      name: "Don Bosco Museum",
      category: "cultural",
      coords: [91.8955, 25.5822],
      description: "One of Asia's finest museums showcasing Northeast Indian culture.",
      rating: 4.7
    }
  ],

  weather: makeWeather(21, 20, "Rainy"),

  economy: {
    gdp: "$6 B",
    perCapita: "$2,300",
    sectors: [
      { name: "Services", value: 52, color: "#3b82f6" },
      { name: "Agriculture", value: 30, color: "#22c55e" },
      { name: "Industry", value: 18, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "3.6 M" },
      { label: "Literacy", value: "75%" },
      { label: "Districts", value: "12" },
      { label: "Capital", value: "Shillong" }
    ]
  }
},
"Mizoram": {
  name: "Mizoram",
  subtitle: "Land of the Highlanders",
  avgTemp: 23,
  attractions: [
    {
      id: "mz1",
      name: "Phawngpui National Park",
      category: "natural",
      coords: [93.0435, 22.6485],
      description: "Home to the Blue Mountain, Mizoram's highest peak.",
      rating: 4.8
    },
    {
      id: "mz2",
      name: "Vantawng Falls",
      category: "natural",
      coords: [92.7596, 23.6444],
      description: "Mizoram's highest waterfall surrounded by dense forests.",
      rating: 4.8
    },
    {
      id: "mz3",
      name: "Solomon's Temple",
      category: "cultural",
      coords: [92.6885, 23.7035],
      description: "Magnificent white marble church and a prominent landmark of Aizawl.",
      rating: 4.8
    },
    {
      id: "mz4",
      name: "Reiek Peak",
      category: "natural",
      coords: [92.6384, 23.7056],
      description: "Popular trekking destination with panoramic views of the hills.",
      rating: 4.7
    },
    {
      id: "mz5",
      name: "Mizoram State Museum",
      category: "historical",
      coords: [92.7176, 23.7271],
      description: "Museum preserving the state's tribal history and cultural heritage.",
      rating: 4.5
    }
  ],

  weather: makeWeather(22, 21, "Cloudy"),

  economy: {
    gdp: "$4 B",
    perCapita: "$2,800",
    sectors: [
      { name: "Services", value: 55, color: "#3b82f6" },
      { name: "Agriculture", value: 28, color: "#22c55e" },
      { name: "Industry", value: 17, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "1.3 M" },
      { label: "Literacy", value: "91%" },
      { label: "Districts", value: "11" },
      { label: "Capital", value: "Aizawl" }
    ]
  }
},
"Nagaland": {
  name: "Nagaland",
  subtitle: "Land of Festivals",
  avgTemp: 24,
  attractions: [
    {
      id: "nl1",
      name: "Hornbill Festival",
      category: "cultural",
      coords: [94.1096, 25.6751],
      description: "Nagaland's iconic cultural festival showcasing the traditions of all Naga tribes.",
      rating: 5.0
    },
    {
      id: "nl2",
      name: "Dzukou Valley",
      category: "natural",
      coords: [94.1134, 25.5744],
      description: "Picturesque valley famous for seasonal flowers and trekking.",
      rating: 4.9
    },
    {
      id: "nl3",
      name: "Kohima War Cemetery",
      category: "historical",
      coords: [94.1098, 25.6747],
      description: "WWII memorial honoring soldiers of the Battle of Kohima.",
      rating: 4.8
    },
    {
      id: "nl4",
      name: "Japfu Peak",
      category: "natural",
      coords: [94.0877, 25.5503],
      description: "Nagaland's second-highest peak with panoramic Himalayan views.",
      rating: 4.8
    },
    {
      id: "nl5",
      name: "Khonoma Village",
      category: "historical",
      coords: [94.0297, 25.6283],
      description: "India's first green village known for Angami heritage and conservation.",
      rating: 4.8
    }
  ],

  weather: makeWeather(23, 22, "Cloudy"),

  economy: {
    gdp: "$5 B",
    perCapita: "$2,400",
    sectors: [
      { name: "Services", value: 52, color: "#3b82f6" },
      { name: "Agriculture", value: 32, color: "#22c55e" },
      { name: "Industry", value: 16, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "2.3 M" },
      { label: "Literacy", value: "80%" },
      { label: "Districts", value: "17" },
      { label: "Capital", value: "Kohima" }
    ]
  }
},
"Orissa": {
  name: "Odisha",
  subtitle: "Soul of Incredible India",
  avgTemp: 32,
  attractions: [
    {
      id: "od1",
      name: "Konark Sun Temple",
      category: "historical",
      coords: [86.0945, 19.8876],
      description: "UNESCO World Heritage Site famous for its stone chariot architecture.",
      rating: 5.0
    },
    {
      id: "od2",
      name: "Jagannath Temple",
      category: "cultural",
      coords: [85.8315, 19.8049],
      description: "One of the Char Dham pilgrimage sites dedicated to Lord Jagannath.",
      rating: 5.0
    },
    {
      id: "od3",
      name: "Chilika Lake",
      category: "natural",
      coords: [85.3568, 19.7318],
      description: "Asia's largest brackish water lagoon and a paradise for migratory birds.",
      rating: 4.9
    },
    {
      id: "od4",
      name: "Simlipal National Park",
      category: "natural",
      coords: [86.3657, 21.9436],
      description: "Tiger reserve rich in waterfalls and biodiversity.",
      rating: 4.8
    },
    {
      id: "od5",
      name: "Udayagiri & Khandagiri Caves",
      category: "historical",
      coords: [85.7792, 20.2422],
      description: "Ancient Jain rock-cut caves dating back to the 2nd century BCE.",
      rating: 4.7
    }
  ],

  weather: makeWeather(31, 36, "Sunny"),

  economy: {
    gdp: "$95 B",
    perCapita: "$1,950",
    sectors: [
      { name: "Industry", value: 38, color: "#f59e0b" },
      { name: "Services", value: 40, color: "#3b82f6" },
      { name: "Agriculture", value: 22, color: "#22c55e" }
    ],
    stats: [
      { label: "Population", value: "46 M" },
      { label: "Literacy", value: "77%" },
      { label: "Districts", value: "30" },
      { label: "Capital", value: "Bhubaneswar" }
    ]
  }
},
"Punjab": {
  name: "Punjab",
  subtitle: "Land of Five Rivers",
  avgTemp: 31,
  attractions: [
    {
      id: "pb1",
      name: "Golden Temple",
      category: "cultural",
      coords: [74.8765, 31.6200],
      description: "The holiest shrine of Sikhism located in Amritsar.",
      rating: 5.0
    },
    {
      id: "pb2",
      name: "Jallianwala Bagh",
      category: "historical",
      coords: [74.8803, 31.6206],
      description: "Historic memorial commemorating the 1919 massacre.",
      rating: 4.9
    },
    {
      id: "pb3",
      name: "Wagah Border",
      category: "historical",
      coords: [74.5730, 31.6045],
      description: "Famous for the daily Beating Retreat ceremony.",
      rating: 4.8
    },
    {
      id: "pb4",
      name: "Harike Wetland",
      category: "natural",
      coords: [74.9343, 31.1645],
      description: "North India's largest wetland and a haven for migratory birds.",
      rating: 4.6
    },
    {
      id: "pb5",
      name: "Anandpur Sahib",
      category: "cultural",
      coords: [76.5083, 31.2393],
      description: "Historic Sikh pilgrimage town and birthplace of the Khalsa.",
      rating: 4.8
    }
  ],

  weather: makeWeather(30, 35, "Sunny"),

  economy: {
    gdp: "$95 B",
    perCapita: "$2,900",
    sectors: [
      { name: "Services", value: 46, color: "#3b82f6" },
      { name: "Agriculture", value: 30, color: "#22c55e" },
      { name: "Industry", value: 24, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "31 M" },
      { label: "Literacy", value: "76%" },
      { label: "Districts", value: "23" },
      { label: "Capital", value: "Chandigarh" }
    ]
  }
},
"Sikkim": {
  name: "Sikkim",
  subtitle: "Land of Mystic Splendor",
  avgTemp: 18,
  attractions: [
    {
      id: "sk1",
      name: "Tsomgo Lake",
      category: "natural",
      coords: [88.7602, 27.3746],
      description: "Glacial lake situated at over 3,700 meters above sea level.",
      rating: 4.9
    },
    {
      id: "sk2",
      name: "Rumtek Monastery",
      category: "cultural",
      coords: [88.6134, 27.3318],
      description: "One of the most significant Tibetan Buddhist monasteries.",
      rating: 4.8
    },
    {
      id: "sk3",
      name: "Nathula Pass",
      category: "historical",
      coords: [88.8303, 27.3866],
      description: "Historic Silk Route pass connecting India and China.",
      rating: 4.9
    },
    {
      id: "sk4",
      name: "Khangchendzonga National Park",
      category: "natural",
      coords: [88.3156, 27.7187],
      description: "UNESCO World Heritage Site surrounding India's highest peak.",
      rating: 5.0
    },
    {
      id: "sk5",
      name: "Pelling",
      category: "natural",
      coords: [88.2350, 27.3042],
      description: "Hill town known for breathtaking Himalayan vistas.",
      rating: 4.8
    }
  ],

  weather: makeWeather(17, 15, "Cool & Misty"),

  economy: {
    gdp: "$5 B",
    perCapita: "$6,000",
    sectors: [
      { name: "Services", value: 58, color: "#3b82f6" },
      { name: "Agriculture", value: 22, color: "#22c55e" },
      { name: "Industry", value: 20, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "0.7 M" },
      { label: "Literacy", value: "82%" },
      { label: "Districts", value: "6" },
      { label: "Capital", value: "Gangtok" }
    ]
  }
},
"Telangana": {
  name: "Telangana",
  subtitle: "Seed Capital of India",
  avgTemp: 33,
  attractions: [
    {
      id: "tg1",
      name: "Charminar",
      category: "historical",
      coords: [78.4747, 17.3616],
      description: "The iconic 16th-century monument in the heart of Hyderabad.",
      rating: 4.9
    },
    {
      id: "tg2",
      name: "Golconda Fort",
      category: "historical",
      coords: [78.4011, 17.3833],
      description: "Magnificent hill fort famous for its acoustic architecture.",
      rating: 4.9
    },
    {
      id: "tg3",
      name: "Ramappa Temple",
      category: "cultural",
      coords: [79.9436, 18.2593],
      description: "UNESCO World Heritage Site showcasing Kakatiya architecture.",
      rating: 4.9
    },
    {
      id: "tg4",
      name: "Kuntala Falls",
      category: "natural",
      coords: [78.5068, 19.0917],
      description: "Telangana's tallest waterfall nestled in lush forests.",
      rating: 4.8
    },
    {
      id: "tg5",
      name: "Hussain Sagar Lake",
      category: "natural",
      coords: [78.4738, 17.4239],
      description: "Historic artificial lake featuring the giant Buddha statue.",
      rating: 4.7
    }
  ],

  weather: makeWeather(32, 37, "Sunny"),

  economy: {
    gdp: "$190 B",
    perCapita: "$3,900",
    sectors: [
      { name: "Services", value: 62, color: "#3b82f6" },
      { name: "Industry", value: 26, color: "#f59e0b" },
      { name: "Agriculture", value: 12, color: "#22c55e" }
    ],
    stats: [
      { label: "Population", value: "39 M" },
      { label: "Literacy", value: "73%" },
      { label: "Districts", value: "33" },
      { label: "Capital", value: "Hyderabad" }
    ]
  }
},
"Tripura": {
  name: "Tripura",
  subtitle: "Land of Palaces and Hills",
  avgTemp: 28,
  attractions: [
    {
      id: "tr1",
      name: "Ujjayanta Palace",
      category: "historical",
      coords: [91.2868, 23.8315],
      description: "Magnificent royal palace now housing the Tripura State Museum.",
      rating: 4.8
    },
    {
      id: "tr2",
      name: "Neermahal",
      category: "historical",
      coords: [91.4326, 23.4744],
      description: "India's only lake palace blending Mughal and Hindu architecture.",
      rating: 4.9
    },
    {
      id: "tr3",
      name: "Unakoti Rock Carvings",
      category: "historical",
      coords: [92.0096, 24.3165],
      description: "Ancient rock-cut sculptures dedicated to Lord Shiva dating back centuries.",
      rating: 4.9
    },
    {
      id: "tr4",
      name: "Sepahijala Wildlife Sanctuary",
      category: "natural",
      coords: [91.3110, 23.6585],
      description: "Wildlife sanctuary known for clouded leopards, primates, and birdlife.",
      rating: 4.7
    },
    {
      id: "tr5",
      name: "Jampui Hills",
      category: "natural",
      coords: [92.2967, 24.1162],
      description: "Scenic hill range famous for orange orchards and panoramic sunrise views.",
      rating: 4.8
    }
  ],

  weather: makeWeather(28, 31, "Cloudy"),

  economy: {
    gdp: "$7 B",
    perCapita: "$2,000",
    sectors: [
      { name: "Services", value: 50, color: "#3b82f6" },
      { name: "Agriculture", value: 31, color: "#22c55e" },
      { name: "Industry", value: 19, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "4.3 M" },
      { label: "Literacy", value: "87%" },
      { label: "Districts", value: "8" },
      { label: "Capital", value: "Agartala" }
    ]
  }
},
"Uttaranchal": {
  name: "Uttarakhand",
  subtitle: "Dev Bhoomi",
  avgTemp: 23,
  attractions: [
    {
      id: "uk1",
      name: "Kedarnath Temple",
      category: "cultural",
      coords: [79.0669, 30.7352],
      description: "One of the twelve Jyotirlingas nestled in the Himalayas.",
      rating: 5.0
    },
    {
      id: "uk2",
      name: "Valley of Flowers National Park",
      category: "natural",
      coords: [79.6428, 30.7280],
      description: "UNESCO World Heritage Site renowned for its alpine meadows and rare flora.",
      rating: 5.0
    },
    {
      id: "uk3",
      name: "Nainital Lake",
      category: "natural",
      coords: [79.4636, 29.3919],
      description: "Picturesque Himalayan lake surrounded by lush green hills.",
      rating: 4.8
    },
    {
      id: "uk4",
      name: "Jim Corbett National Park",
      category: "natural",
      coords: [78.7747, 29.5300],
      description: "India's oldest national park and a premier destination for tiger safaris.",
      rating: 4.9
    },
    {
      id: "uk5",
      name: "Badrinath Temple",
      category: "cultural",
      coords: [79.4938, 30.7433],
      description: "One of the Char Dham pilgrimage sites dedicated to Lord Vishnu.",
      rating: 5.0
    }
  ],

  weather: makeWeather(22, 20, "Cool & Clear"),

  economy: {
    gdp: "$42 B",
    perCapita: "$3,200",
    sectors: [
      { name: "Services", value: 53, color: "#3b82f6" },
      { name: "Industry", value: 25, color: "#f59e0b" },
      { name: "Agriculture", value: 22, color: "#22c55e" }
    ],
    stats: [
      { label: "Population", value: "11.5 M" },
      { label: "Literacy", value: "79%" },
      { label: "Districts", value: "13" },
      { label: "Capital", value: "Dehradun" }
    ]
  }
},
"Andaman and Nicobar": {
  name: "Andaman and Nicobar Islands",
  subtitle: "Emerald Isles of India",
  avgTemp: 29,
  attractions: [
    {
      id: "an1",
      name: "Cellular Jail",
      category: "historical",
      coords: [92.7466, 11.6755],
      description: "Historic colonial prison known as Kala Pani and a symbol of India's freedom struggle.",
      rating: 4.9
    },
    {
      id: "an2",
      name: "Radhanagar Beach",
      category: "natural",
      coords: [92.9850, 11.9842],
      description: "Award-winning white sand beach on Havelock (Swaraj Dweep).",
      rating: 5.0
    },
    {
      id: "an3",
      name: "Ross Island",
      category: "historical",
      coords: [92.7626, 11.6777],
      description: "Former British administrative headquarters with colonial ruins.",
      rating: 4.8
    },
    {
      id: "an4",
      name: "Baratang Limestone Caves",
      category: "natural",
      coords: [92.7563, 12.1174],
      description: "Spectacular limestone cave formations accessible through mangrove creeks.",
      rating: 4.7
    },
    {
      id: "an5",
      name: "North Bay Island",
      category: "natural",
      coords: [92.7706, 11.7163],
      description: "Popular destination for snorkeling, scuba diving, and coral reefs.",
      rating: 4.8
    }
  ],

  weather: makeWeather(29, 33, "Sunny"),

  economy: {
    gdp: "$1.5 B",
    perCapita: "$4,700",
    sectors: [
      { name: "Services", value: 67, color: "#3b82f6" },
      { name: "Agriculture", value: 18, color: "#22c55e" },
      { name: "Industry", value: 15, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "0.4 M" },
      { label: "Literacy", value: "86%" },
      { label: "Districts", value: "3" },
      { label: "Capital", value: "Port Blair" }
    ]
  }
},

"Chandigarh": {
  name: "Chandigarh",
  subtitle: "The City Beautiful",
  avgTemp: 31,
  attractions: [
    {
      id: "ch1",
      name: "Rock Garden",
      category: "cultural",
      coords: [76.8085, 30.7525],
      description: "Unique sculpture garden built entirely from industrial and household waste.",
      rating: 4.8
    },
    {
      id: "ch2",
      name: "Sukhna Lake",
      category: "natural",
      coords: [76.8193, 30.7421],
      description: "Man-made lake popular for boating and evening walks.",
      rating: 4.8
    },
    {
      id: "ch3",
      name: "Capitol Complex",
      category: "historical",
      coords: [76.8090, 30.7580],
      description: "UNESCO World Heritage Site designed by Le Corbusier.",
      rating: 4.8
    },
    {
      id: "ch4",
      name: "Rose Garden",
      category: "natural",
      coords: [76.7842, 30.7445],
      description: "Asia's largest rose garden with over 1,600 varieties.",
      rating: 4.7
    },
    {
      id: "ch5",
      name: "Government Museum",
      category: "historical",
      coords: [76.7828, 30.7428],
      description: "Museum featuring Gandhara sculptures and modern Indian art.",
      rating: 4.6
    }
  ],

  weather: makeWeather(31, 36, "Sunny"),

  economy: {
    gdp: "$7 B",
    perCapita: "$5,800",
    sectors: [
      { name: "Services", value: 79, color: "#3b82f6" },
      { name: "Industry", value: 14, color: "#f59e0b" },
      { name: "Agriculture", value: 7, color: "#22c55e" }
    ],
    stats: [
      { label: "Population", value: "1.2 M" },
      { label: "Literacy", value: "87%" },
      { label: "Districts", value: "1" },
      { label: "Capital", value: "Chandigarh" }
    ]
  }
},

"Dadra and Nagar Haveli and Daman and Diu": {
  name: "Dadra and Nagar Haveli and Daman and Diu",
  subtitle: "Coast Meets Heritage",
  avgTemp: 31,
  attractions: [
    {
      id: "dd1",
      name: "Diu Fort",
      category: "historical",
      coords: [70.9855, 20.7145],
      description: "Massive Portuguese sea fort overlooking the Arabian Sea.",
      rating: 4.8
    },
    {
      id: "dd2",
      name: "Devka Beach",
      category: "natural",
      coords: [72.8422, 20.4326],
      description: "Popular beach destination in Daman.",
      rating: 4.6
    },
    {
      id: "dd3",
      name: "Jampore Beach",
      category: "natural",
      coords: [72.8122, 20.3895],
      description: "Peaceful beach known for its black sand and sunset views.",
      rating: 4.7
    },
    {
      id: "dd4",
      name: "Silvassa Tribal Museum",
      category: "cultural",
      coords: [73.0169, 20.2734],
      description: "Museum preserving tribal heritage and traditions.",
      rating: 4.6
    },
    {
      id: "dd5",
      name: "Naida Caves",
      category: "natural",
      coords: [70.9818, 20.7148],
      description: "Intriguing cave formations created from old quarry excavations.",
      rating: 4.7
    }
  ],

  weather: makeWeather(30, 34, "Sunny"),

  economy: {
    gdp: "$5 B",
    perCapita: "$7,200",
    sectors: [
      { name: "Industry", value: 45, color: "#f59e0b" },
      { name: "Services", value: 43, color: "#3b82f6" },
      { name: "Agriculture", value: 12, color: "#22c55e" }
    ],
    stats: [
      { label: "Population", value: "0.9 M" },
      { label: "Literacy", value: "78%" },
      { label: "Districts", value: "3" },
      { label: "Capital", value: "Daman" }
    ]
  }
},

"Delhi": {
  name: "Delhi",
  subtitle: "Heart of India",
  avgTemp: 33,
  attractions: [
    {
      id: "dl1",
      name: "Red Fort",
      category: "historical",
      coords: [77.2410, 28.6562],
      description: "UNESCO World Heritage Site built by Mughal emperor Shah Jahan.",
      rating: 4.9
    },
    {
      id: "dl2",
      name: "India Gate",
      category: "historical",
      coords: [77.2295, 28.6129],
      description: "Iconic war memorial honoring Indian soldiers.",
      rating: 4.8
    },
    {
      id: "dl3",
      name: "Qutub Minar",
      category: "historical",
      coords: [77.1855, 28.5245],
      description: "World's tallest brick minaret and UNESCO World Heritage Site.",
      rating: 4.9
    },
    {
      id: "dl4",
      name: "Lotus Temple",
      category: "cultural",
      coords: [77.2588, 28.5535],
      description: "Baháʼí House of Worship known for its lotus-shaped architecture.",
      rating: 4.8
    },
    {
      id: "dl5",
      name: "Akshardham Temple",
      category: "cultural",
      coords: [77.2773, 28.6127],
      description: "Grand Hindu temple complex showcasing Indian art and culture.",
      rating: 4.9
    }
  ],

  weather: makeWeather(34, 40, "Hot"),

  economy: {
    gdp: "$167 B",
    perCapita: "$6,000",
    sectors: [
      { name: "Services", value: 84, color: "#3b82f6" },
      { name: "Industry", value: 15, color: "#f59e0b" },
      { name: "Agriculture", value: 1, color: "#22c55e" }
    ],
    stats: [
      { label: "Population", value: "20 M" },
      { label: "Literacy", value: "87%" },
      { label: "Districts", value: "11" },
      { label: "Capital", value: "New Delhi" }
    ]
  }
},
"Jammu and Kashmir": {
  name: "Jammu and Kashmir",
  subtitle: "Paradise on Earth",
  avgTemp: 19,
  attractions: [
    {
      id: "jk1",
      name: "Dal Lake",
      category: "natural",
      coords: [74.8560, 34.1220],
      description: "Iconic Himalayan lake famous for its houseboats and shikara rides.",
      rating: 5.0
    },
    {
      id: "jk2",
      name: "Gulmarg",
      category: "natural",
      coords: [74.3805, 34.0484],
      description: "World-renowned ski resort and home to one of the highest cable cars.",
      rating: 5.0
    },
    {
      id: "jk3",
      name: "Vaishno Devi Temple",
      category: "cultural",
      coords: [74.9494, 33.0308],
      description: "One of India's most visited Hindu pilgrimage sites.",
      rating: 5.0
    },
    {
      id: "jk4",
      name: "Amarnath Cave",
      category: "cultural",
      coords: [75.5016, 34.2146],
      description: "Sacred Himalayan cave shrine dedicated to Lord Shiva.",
      rating: 4.9
    },
    {
      id: "jk5",
      name: "Mughal Gardens",
      category: "historical",
      coords: [74.8319, 34.1318],
      description: "Beautiful Persian-style gardens including Shalimar and Nishat Bagh.",
      rating: 4.8
    }
  ],

  weather: makeWeather(18, 16, "Cool & Clear"),

  economy: {
    gdp: "$25 B",
    perCapita: "$1,850",
    sectors: [
      { name: "Services", value: 56, color: "#3b82f6" },
      { name: "Agriculture", value: 24, color: "#22c55e" },
      { name: "Industry", value: 20, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "13.6 M" },
      { label: "Literacy", value: "68%" },
      { label: "Districts", value: "20" },
      { label: "Capital", value: "Srinagar (Summer), Jammu (Winter)" }
    ]
  }
},
"Lakshadweep": {
  name: "Lakshadweep",
  subtitle: "Coral Paradise of India",
  avgTemp: 29,
  attractions: [
    {
      id: "ld1",
      name: "Agatti Island",
      category: "natural",
      coords: [72.1850, 10.8487],
      description: "Gateway to Lakshadweep, known for turquoise lagoons and pristine coral reefs.",
      rating: 4.9
    },
    {
      id: "ld2",
      name: "Bangaram Island",
      category: "natural",
      coords: [72.2878, 10.9406],
      description: "Uninhabited island famous for scuba diving, snorkeling, and white-sand beaches.",
      rating: 5.0
    },
    {
      id: "ld3",
      name: "Kavaratti",
      category: "cultural",
      coords: [72.6358, 10.5669],
      description: "Capital island featuring beautiful mosques, marine life, and crystal-clear lagoons.",
      rating: 4.8
    },
    {
      id: "ld4",
      name: "Marine Aquarium & Museum",
      category: "cultural",
      coords: [72.6352, 10.5678],
      description: "Museum showcasing the rich coral reef ecosystem and marine biodiversity.",
      rating: 4.6
    },
    {
      id: "ld5",
      name: "Minicoy Island",
      category: "historical",
      coords: [73.0468, 8.2955],
      description: "Home to the iconic British-era lighthouse and unique Mahl culture.",
      rating: 4.9
    }
  ],

  weather: makeWeather(29, 33, "Sunny"),

  economy: {
    gdp: "$0.4 B",
    perCapita: "$4,900",
    sectors: [
      { name: "Services", value: 64, color: "#3b82f6" },
      { name: "Fishing", value: 28, color: "#22c55e" },
      { name: "Industry", value: 8, color: "#f59e0b" }
    ],
    stats: [
      { label: "Population", value: "0.07 M" },
      { label: "Literacy", value: "92%" },
      { label: "Districts", value: "1" },
      { label: "Capital", value: "Kavaratti" }
    ]
  }
},
};

export const CATEGORY_META: Record<Category, { label: string; color: string; emoji: string }> = {
  historical: { label: "Historical", color: "#f59e0b", emoji: "🏛" },
  natural:    { label: "Natural",    color: "#22c55e", emoji: "🌳" },
  cultural:   { label: "Cultural",   color: "#8b5cf6", emoji: "🎭" },
};
