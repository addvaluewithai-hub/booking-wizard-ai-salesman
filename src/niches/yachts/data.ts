import type { ExperienceEntity } from '../../salesman/experience/types';

export type Yacht = {
  id: string;
  name: string;
  type: 'sport' | 'flybridge' | 'catamaran' | 'classic';
  capacity: number;
  cabins: number;
  lengthM: number;
  hourlyPriceUsd: number;
  minimumHours: number;
  amenities: string[];
  occasions: string[];
  demoSlots: string[];
  accent: string;
};

// Fictional charter data. Prices and slots are demo-only and must never be presented as real-world availability.
export const YACHTS: Yacht[] = [
  { id: 'YC-38', name: 'Aster 38', type: 'sport', capacity: 6, cabins: 1, lengthM: 11.6, hourlyPriceUsd: 420, minimumHours: 2, amenities: ['sun pad','Bluetooth audio','swim platform'], occasions: ['sunset','couples','small celebration'], demoSlots: ['16:00','17:30','19:00'], accent: 'linear-gradient(145deg,#e7e4dc 0 48%,#8aa6b7 49% 52%,#172838 53%)' },
  { id: 'YC-44', name: 'Maris 44', type: 'sport', capacity: 8, cabins: 2, lengthM: 13.4, hourlyPriceUsd: 560, minimumHours: 2, amenities: ['sun pad','indoor lounge','swim platform','refreshment fridge'], occasions: ['sunset','birthday','day charter'], demoSlots: ['13:00','16:30','18:30'], accent: 'linear-gradient(145deg,#f0eee7 0 47%,#b99b6d 48% 51%,#203647 52%)' },
  { id: 'YC-52', name: 'Luma 52', type: 'flybridge', capacity: 10, cabins: 3, lengthM: 15.8, hourlyPriceUsd: 780, minimumHours: 3, amenities: ['flybridge','indoor salon','two dining zones','swim platform'], occasions: ['family day','corporate','celebration'], demoSlots: ['11:00','15:00','18:00'], accent: 'linear-gradient(145deg,#ebe9e1 0 45%,#667d8e 46% 49%,#142637 50%)' },
  { id: 'YC-58', name: 'Solenne 58', type: 'flybridge', capacity: 12, cabins: 3, lengthM: 17.7, hourlyPriceUsd: 980, minimumHours: 3, amenities: ['flybridge','full galley','three lounge zones','premium sound'], occasions: ['birthday','corporate','full-day charter'], demoSlots: ['10:00','14:00','17:30'], accent: 'linear-gradient(145deg,#f2efe8 0 45%,#c2a770 46% 48%,#1c3043 49%)' },
  { id: 'YC-46C', name: 'Tide 46', type: 'catamaran', capacity: 12, cabins: 4, lengthM: 14.0, hourlyPriceUsd: 850, minimumHours: 3, amenities: ['wide deck','four cabins','shaded dining','easy water access'], occasions: ['family day','group celebration','day charter'], demoSlots: ['09:30','13:30','17:00'], accent: 'linear-gradient(145deg,#f0ede5 0 42%,#91b2bd 43% 47%,#284459 48%)' },
  { id: 'YC-54C', name: 'Caldera 54', type: 'catamaran', capacity: 16, cabins: 5, lengthM: 16.5, hourlyPriceUsd: 1250, minimumHours: 4, amenities: ['large foredeck','five cabins','outdoor kitchen','two dining areas'], occasions: ['large celebration','corporate','full-day charter'], demoSlots: ['10:00','15:30'], accent: 'linear-gradient(145deg,#f5f2ea 0 42%,#c2ad84 43% 47%,#1f384a 48%)' },
  { id: 'YC-48K', name: 'Vela Classic', type: 'classic', capacity: 8, cabins: 2, lengthM: 14.6, hourlyPriceUsd: 640, minimumHours: 3, amenities: ['timber deck','shaded aft seating','classic salon','swim ladder'], occasions: ['anniversary','sunset','private dinner'], demoSlots: ['16:00','18:00'], accent: 'linear-gradient(145deg,#d8c6a4 0 28%,#7a5738 29% 35%,#ede8dd 36% 48%,#203849 49%)' },
  { id: 'YC-62', name: 'Nocturne 62', type: 'flybridge', capacity: 14, cabins: 4, lengthM: 18.9, hourlyPriceUsd: 1380, minimumHours: 4, amenities: ['upper lounge','four cabins','formal salon','full galley'], occasions: ['corporate','luxury celebration','full-day charter'], demoSlots: ['11:00','16:00'], accent: 'linear-gradient(145deg,#e8e5de 0 44%,#2c3441 45% 49%,#10283c 50%)' },
];

export const YACHT_EXPERIENCE_ENTITIES: ExperienceEntity[] = YACHTS.map((yacht) => ({
  id: yacht.id,
  name: yacht.name,
  subtitle: `${yacht.type} · up to ${yacht.capacity} guests`,
  swatch: yacht.accent,
  attributes: {
    type: yacht.type,
    capacity: yacht.capacity,
    cabins: yacht.cabins,
    length_m: yacht.lengthM,
    demo_hourly_price_usd: yacht.hourlyPriceUsd,
    demo_minimum_hours: yacht.minimumHours,
    amenities: yacht.amenities,
    occasions: yacht.occasions,
    demo_available_slots: yacht.demoSlots,
  },
}));
