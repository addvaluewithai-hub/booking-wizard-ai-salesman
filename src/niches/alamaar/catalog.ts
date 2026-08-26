export type AlamaarProduct = {
  id: string;
  name: string;
  code: string;
  image: string;
  url: string;
  family: 'wood' | 'solid' | 'stone' | 'decorative';
  tone: 'light' | 'neutral' | 'wood' | 'dark';
};

type WooStoreProduct = {
  id?: number;
  name?: string;
  sku?: string;
  permalink?: string;
  images?: Array<{ src?: string }>;
  categories?: Array<{ name?: string; slug?: string }>;
};

const PUBLIC_STORE_ENDPOINT = 'https://alamaarhpl.com/wp-json/wc/store/v1/products?per_page=50';

export const ALAMAAR_FALLBACK_PRODUCTS: AlamaarProduct[] = [
  {
    id: '1543-A-152',
    name: 'Acacia Wood',
    code: '1543-A-152',
    image: 'https://alamaarhpl.com/wp-content/uploads/2026/08/material_display-2-wpak.webp?wpakv=1787436376',
    url: 'https://alamaarhpl.com/shop/',
    family: 'wood',
    tone: 'wood',
  },
  {
    id: '1543-SF',
    name: 'Acacia Wood',
    code: '1543-SF',
    image: 'https://alamaarhpl.com/wp-content/uploads/2026/08/material_display-3-wpak.webp?wpakv=1787436378',
    url: 'https://alamaarhpl.com/shop/',
    family: 'wood',
    tone: 'light',
  },
  {
    id: '5225-SF',
    name: 'Alaska Wood',
    code: '5225-SF',
    image: 'https://alamaarhpl.com/wp-content/uploads/2026/07/alamaar-product-1783940772099-card-wpak.webp?wpakv=1787436183',
    url: 'https://alamaarhpl.com/shop/',
    family: 'wood',
    tone: 'light',
  },
  {
    id: '5255-A-192',
    name: 'American Fresco',
    code: '5255-A-192',
    image: 'https://alamaarhpl.com/wp-content/uploads/2026/08/material_display-9-wpak.webp?wpakv=1787436388',
    url: 'https://alamaarhpl.com/shop/',
    family: 'wood',
    tone: 'wood',
  },
  {
    id: '4139-A-155',
    name: 'Ash Grey',
    code: '4139-A-155',
    image: 'https://alamaarhpl.com/wp-content/uploads/2026/07/alamaar-product-1783940882367-card-wpak.webp?wpakv=1787436186',
    url: 'https://alamaarhpl.com/shop/',
    family: 'solid',
    tone: 'neutral',
  },
  {
    id: '5242-SF',
    name: 'Branto Dark',
    code: '5242-SF',
    image: 'https://alamaarhpl.com/wp-content/uploads/2026/07/alamaar-product-1783941349086-card-wpak.webp?wpakv=1787436195',
    url: 'https://alamaarhpl.com/shop/',
    family: 'wood',
    tone: 'dark',
  },
];

function classifyTone(name: string): AlamaarProduct['tone'] {
  const text = name.toLowerCase();
  if (/dark|black|coffee|brown|walnut|smoked/.test(text)) return 'dark';
  if (/white|ivory|beige|alaska|light|cream/.test(text)) return 'light';
  if (/grey|gray|ash|stone|slate|metal/.test(text)) return 'neutral';
  return 'wood';
}

function classifyFamily(product: WooStoreProduct): AlamaarProduct['family'] {
  const text = `${product.name ?? ''} ${(product.categories ?? []).map((category) => `${category.name ?? ''} ${category.slug ?? ''}`).join(' ')}`.toLowerCase();
  if (/stone|marble|slate|pebble/.test(text)) return 'stone';
  if (/solid|plain|black|white|grey|gray|beige|ivory/.test(text)) return 'solid';
  if (/ruby|textile|floral|jute|metallic|cane/.test(text)) return 'decorative';
  return 'wood';
}

function normalizeStoreProduct(product: WooStoreProduct): AlamaarProduct | null {
  const name = product.name?.trim();
  const image = product.images?.[0]?.src?.trim();
  if (!name || !image) return null;

  const code = product.sku?.trim() || name.match(/[A-Z0-9]+(?:[- ][A-Z0-9+]+){1,4}$/i)?.[0] || `AL-${product.id ?? name}`;
  return {
    id: String(product.id ?? code),
    name,
    code,
    image,
    url: product.permalink || 'https://alamaarhpl.com/shop/',
    family: classifyFamily(product),
    tone: classifyTone(name),
  };
}

export async function fetchAlamaarProducts(signal?: AbortSignal): Promise<{ products: AlamaarProduct[]; source: 'live' | 'fallback' }> {
  try {
    const response = await fetch(PUBLIC_STORE_ENDPOINT, { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Catalog request failed with ${response.status}`);
    const raw = await response.json() as WooStoreProduct[];
    const products = raw.map(normalizeStoreProduct).filter((product): product is AlamaarProduct => Boolean(product));
    if (products.length >= 3) return { products, source: 'live' };
  } catch {
    // The public WordPress/WooCommerce endpoint can be unavailable or blocked by CORS.
    // The prototype stays functional with catalog records captured from the public website.
  }

  return { products: ALAMAAR_FALLBACK_PRODUCTS, source: 'fallback' };
}
