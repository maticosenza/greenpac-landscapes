// Approximate coordinates for Argentine provinces and major cities
export const PROVINCE_COORDS: Record<string, [number, number]> = {
  "Buenos Aires": [-36.6769, -60.5588],
  "CABA": [-34.6037, -58.3816],
  "Catamarca": [-28.4696, -65.7852],
  "Chaco": [-26.3864, -60.7658],
  "Chubut": [-43.3002, -65.1023],
  "Córdoba": [-31.4201, -64.1888],
  "Corrientes": [-27.4692, -58.8306],
  "Entre Ríos": [-31.7413, -60.5115],
  "Formosa": [-26.1775, -58.1781],
  "Jujuy": [-24.1858, -65.2995],
  "La Pampa": [-36.6167, -64.2833],
  "La Rioja": [-29.4131, -66.8559],
  "Mendoza": [-32.8895, -68.8458],
  "Misiones": [-27.3671, -54.4316],
  "Neuquén": [-38.9516, -68.0591],
  "Río Negro": [-40.8135, -63.0000],
  "Salta": [-24.7829, -65.4122],
  "San Juan": [-31.5375, -68.5364],
  "San Luis": [-33.3017, -66.3378],
  "Santa Cruz": [-51.6230, -69.2168],
  "Santa Fe": [-31.6107, -60.6973],
  "Santiago del Estero": [-27.7834, -64.2642],
  "Tierra del Fuego": [-54.8019, -68.3030],
  "Tucumán": [-26.8083, -65.2176],
};

export const CITY_COORDS: Record<string, [number, number]> = {
  // Buenos Aires province cities
  "La Plata": [-34.9215, -57.9545],
  "Mar del Plata": [-38.0055, -57.5426],
  "Bahía Blanca": [-38.7196, -62.2724],
  "Tandil": [-37.3217, -59.1332],
  "Olavarría": [-36.8927, -60.3222],
  "Junín": [-34.5935, -60.9540],
  "Pergamino": [-33.8988, -60.5735],
  "San Nicolás": [-33.3380, -60.2263],
  "Zárate": [-34.0980, -59.0285],
  "Campana": [-34.1531, -58.9568],
  "Pilar": [-34.4588, -58.9143],
  "Luján": [-34.5703, -59.1050],
  "Mercedes": [-34.6519, -59.4308],
  "Lobos": [-35.1849, -59.0946],
  "Chascomús": [-35.5760, -58.0130],
  "Dolores": [-36.3143, -57.6829],
  "Azul": [-36.7828, -59.8583],
  "Necochea": [-38.5545, -58.7396],
  "Tres Arroyos": [-38.3767, -60.2755],
  "Coronel Suárez": [-37.4602, -61.9325],
  "Trenque Lauquen": [-35.9729, -62.7305],
  "Pehuajó": [-35.8116, -61.8998],
  "9 de Julio": [-35.4469, -60.8828],
  "Chivilcoy": [-34.8957, -60.0157],
  "Bragado": [-35.1167, -60.4833],
  "Quilmes": [-34.7203, -58.2635],
  "Lanús": [-34.7002, -58.3924],
  "Lomas de Zamora": [-34.7611, -58.3964],
  "Avellaneda": [-34.6625, -58.3651],
  "San Isidro": [-34.4720, -58.5291],
  "Tigre": [-34.4263, -58.5796],
  "Vicente López": [-34.5260, -58.4716],
  "Morón": [-34.6517, -58.6199],
  "Moreno": [-34.6343, -58.7910],
  "San Fernando": [-34.4432, -58.5596],
  "San Martín": [-34.5757, -58.5350],
  "Tres de Febrero": [-34.6049, -58.5683],
  "La Matanza": [-34.7592, -58.6236],
  "Florencio Varela": [-34.8115, -58.2753],
  "Berazategui": [-34.7635, -58.2105],
  "Escobar": [-34.3480, -58.7955],
  // CABA
  "Buenos Aires": [-34.6037, -58.3816],
  "Capital Federal": [-34.6037, -58.3816],
  // Córdoba
  "Córdoba": [-31.4201, -64.1888],
  "Villa Carlos Paz": [-31.4247, -64.4978],
  "Río Cuarto": [-33.1306, -64.3497],
  "Villa María": [-32.4074, -63.2422],
  "San Francisco": [-31.4269, -62.0828],
  "Jesús María": [-30.9815, -64.0951],
  "Alta Gracia": [-31.6645, -64.4343],
  "Bell Ville": [-32.6253, -62.6875],
  "Marcos Juárez": [-32.6925, -62.1049],
  // Santa Fe
  "Rosario": [-32.9442, -60.6505],
  "Santa Fe": [-31.6107, -60.6973],
  "Rafaela": [-31.2530, -61.4867],
  "Venado Tuerto": [-33.7469, -61.9693],
  "Reconquista": [-29.1439, -59.6509],
  "Villa Constitución": [-33.2275, -60.3296],
  "Casilda": [-33.0445, -61.1690],
  "Esperanza": [-31.4488, -60.9313],
  // Mendoza
  "Mendoza": [-32.8895, -68.8458],
  "San Rafael": [-34.6176, -68.3302],
  "Godoy Cruz": [-32.9280, -68.8376],
  "Las Heras": [-32.8524, -68.8129],
  "Guaymallén": [-32.8827, -68.5179],
  "Luján de Cuyo": [-33.0379, -68.8795],
  "Maipú": [-32.9436, -68.7484],
  // Tucumán
  "San Miguel de Tucumán": [-26.8083, -65.2176],
  "Tucumán": [-26.8083, -65.2176],
  "Tafí Viejo": [-26.7326, -65.2572],
  "Concepción": [-27.3402, -65.5921],
  "Banda del Río Salí": [-26.7744, -65.1696],
  // Salta
  "Salta": [-24.7829, -65.4122],
  "San Ramón de la Nueva Orán": [-23.1360, -64.3250],
  "Tartagal": [-22.5153, -63.8012],
  "Cafayate": [-26.0735, -65.9764],
  // Jujuy
  "San Salvador de Jujuy": [-24.1858, -65.2995],
  "Palpalá": [-24.2567, -65.2109],
  "San Pedro de Jujuy": [-24.2310, -64.8680],
  // Chaco
  "Resistencia": [-27.4514, -58.9867],
  "Presidencia Roque Sáenz Peña": [-26.7853, -60.4389],
  "Villa Ángela": [-27.5736, -60.7146],
  // Corrientes
  "Corrientes": [-27.4692, -58.8306],
  "Goya": [-29.1410, -59.2630],
  "Paso de los Libres": [-29.7111, -57.0855],
  // Misiones
  "Posadas": [-27.3671, -55.8962],
  "Oberá": [-27.4856, -55.1217],
  "Eldorado": [-26.4060, -54.6321],
  "Puerto Iguazú": [-25.5972, -54.5786],
  // Entre Ríos
  "Paraná": [-31.7413, -60.5115],
  "Concordia": [-31.3930, -58.0206],
  "Gualeguaychú": [-33.0094, -58.5172],
  "Victoria": [-32.6189, -60.1548],
  "Colón": [-32.2236, -58.1410],
  "Concepción del Uruguay": [-32.4847, -58.2381],
  // Neuquén
  "Neuquén": [-38.9516, -68.0591],
  "San Martín de los Andes": [-40.1569, -71.3522],
  "Villa La Angostura": [-40.7614, -71.6473],
  "Zapala": [-38.8997, -70.0714],
  // Río Negro
  "Viedma": [-40.8135, -63.0000],
  "San Carlos de Bariloche": [-41.1335, -71.3103],
  "General Roca": [-39.0333, -67.0833],
  "Cipolletti": [-38.9341, -67.9926],
  "Allen": [-38.9833, -67.8333],
  "Choele Choel": [-39.2833, -65.6833],
  // Chubut
  "Rawson": [-43.3002, -65.1023],
  "Comodoro Rivadavia": [-45.8656, -67.4823],
  "Trelew": [-43.2489, -65.3050],
  "Puerto Madryn": [-42.7692, -65.0385],
  "Esquel": [-42.9114, -71.3193],
  // Santa Cruz
  "Río Gallegos": [-51.6230, -69.2168],
  "Caleta Olivia": [-46.4422, -67.5283],
  "El Calafate": [-50.3377, -72.2649],
  // Tierra del Fuego
  "Ushuaia": [-54.8019, -68.3030],
  "Río Grande": [-53.7878, -67.7091],
  // La Pampa
  "Santa Rosa": [-36.6167, -64.2833],
  "General Pico": [-35.6566, -63.7568],
  // San Luis
  "San Luis": [-33.3017, -66.3378],
  "Villa Mercedes": [-33.6756, -65.4617],
  "Merlo": [-32.3434, -65.0132],
  // San Juan
  "San Juan": [-31.5375, -68.5364],
  // La Rioja
  "La Rioja": [-29.4131, -66.8559],
  "Chilecito": [-29.1627, -67.4964],
  // Catamarca
  "San Fernando del Valle de Catamarca": [-28.4696, -65.7852],
  "Catamarca": [-28.4696, -65.7852],
  // Santiago del Estero
  "Santiago del Estero": [-27.7834, -64.2642],
  "La Banda": [-27.7349, -64.2413],
  "Termas de Río Hondo": [-27.4944, -64.8585],
  // Formosa
  "Formosa": [-26.1775, -58.1781],
  "Clorinda": [-25.2840, -57.7184],
};

/**
 * Returns approximate [lat, lng] for a client based on city and province.
 * Falls back to province center, then Argentina center.
 */
export function getClientCoordinates(
  city: string | null,
  province: string | null
): [number, number] | null {
  if (city && CITY_COORDS[city]) return CITY_COORDS[city];
  // Try case-insensitive match
  if (city) {
    const cityLower = city.toLowerCase().trim();
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (key.toLowerCase() === cityLower) return coords;
    }
  }
  if (province && PROVINCE_COORDS[province]) return PROVINCE_COORDS[province];
  if (province) {
    const provLower = province.toLowerCase().trim();
    for (const [key, coords] of Object.entries(PROVINCE_COORDS)) {
      if (key.toLowerCase() === provLower) return coords;
    }
  }
  return null;
}
