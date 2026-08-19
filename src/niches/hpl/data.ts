import type { ExperienceEntity } from '../../salesman/experience/types';

export type HplFamily = 'wood' | 'stone' | 'solid' | 'textile';
export type HplDepth = 'light' | 'medium' | 'dark';
export type HplWarmth = 'warm' | 'neutral' | 'cool';

export type HplProduct = {
  id: string;
  name: string;
  family: HplFamily;
  depth: HplDepth;
  warmth: HplWarmth;
  finish: 'matte' | 'soft-touch' | 'fine-grain' | 'textured';
  applications: Array<'kitchen' | 'wardrobe' | 'office' | 'retail' | 'hospitality'>;
  cleaning: 'easy-wipe' | 'standard';
  visualCharacter: string;
  sampleEligible: boolean;
  quoteEligible: boolean;
  swatch: string;
};

// Entire catalog is fictional demo data. It intentionally avoids real-brand SKUs or unsupported technical certifications/specs.
export const HPL_PRODUCTS: HplProduct[] = [
  { id: 'AV-101', name: 'Quiet Ash', family: 'wood', depth: 'light', warmth: 'neutral', finish: 'fine-grain', applications: ['kitchen','wardrobe','office'], cleaning: 'easy-wipe', visualCharacter: 'calm linear grain', sampleEligible: true, quoteEligible: true, swatch: 'linear-gradient(100deg,#d9d0c2 0 18%,#bfb4a3 19% 21%,#ded5c8 22% 43%,#c7bba9 44% 47%,#e0d8cb 48% 70%,#b9ad9c 71% 73%,#d7cec0 74%)' },
  { id: 'AV-108', name: 'Nordic Elm', family: 'wood', depth: 'light', warmth: 'warm', finish: 'matte', applications: ['kitchen','wardrobe','office','retail'], cleaning: 'easy-wipe', visualCharacter: 'soft warm grain', sampleEligible: true, quoteEligible: true, swatch: 'linear-gradient(96deg,#d9c3a2,#c9ad87 24%,#e3cda9 26%,#b99a72 49%,#dec5a0 52%,#c3a57d 76%,#e1caa7)' },
  { id: 'AV-117', name: 'Honey Oak', family: 'wood', depth: 'medium', warmth: 'warm', finish: 'fine-grain', applications: ['kitchen','wardrobe','hospitality'], cleaning: 'easy-wipe', visualCharacter: 'visible honey-toned grain', sampleEligible: true, quoteEligible: true, swatch: 'linear-gradient(100deg,#a97745,#c1925c 12%,#8b5d33 15%,#c89a60 35%,#9d6b3c 39%,#bf8d55 66%,#7c4f2d 70%,#bb8650)' },
  { id: 'AV-124', name: 'Smoked Oak', family: 'wood', depth: 'dark', warmth: 'warm', finish: 'textured', applications: ['kitchen','wardrobe','retail','hospitality'], cleaning: 'standard', visualCharacter: 'deep grain with warm undertone', sampleEligible: true, quoteEligible: true, swatch: 'linear-gradient(96deg,#5a4638,#3f312a 18%,#6b5240 22%,#352923 47%,#604a3a 52%,#2f2521 76%,#5b4436)' },
  { id: 'AV-131', name: 'Espresso Walnut', family: 'wood', depth: 'dark', warmth: 'warm', finish: 'soft-touch', applications: ['kitchen','wardrobe','hospitality'], cleaning: 'easy-wipe', visualCharacter: 'dark fluid walnut figure', sampleEligible: true, quoteEligible: true, swatch: 'linear-gradient(104deg,#3d2922,#634333 18%,#2e201c 23%,#6f4b37 43%,#35231e 48%,#593a2d 70%,#271b18 75%,#5f4031)' },
  { id: 'AV-139', name: 'Charred Chestnut', family: 'wood', depth: 'dark', warmth: 'neutral', finish: 'textured', applications: ['retail','hospitality','office'], cleaning: 'standard', visualCharacter: 'charred linear texture', sampleEligible: true, quoteEligible: true, swatch: 'repeating-linear-gradient(94deg,#2f2b28 0 5px,#413a35 6px 9px,#292624 10px 15px,#51463f 16px 18px)' },
  { id: 'AV-202', name: 'Limestone Veil', family: 'stone', depth: 'light', warmth: 'warm', finish: 'matte', applications: ['kitchen','office','retail','hospitality'], cleaning: 'easy-wipe', visualCharacter: 'quiet mineral clouding', sampleEligible: true, quoteEligible: true, swatch: 'radial-gradient(circle at 22% 36%,#c5baaa 0 2%,transparent 3%),linear-gradient(145deg,#e1d8ca,#cfc3b3 45%,#e9e1d6 70%,#c7bbab)' },
  { id: 'AV-209', name: 'Chalk Travertine', family: 'stone', depth: 'light', warmth: 'neutral', finish: 'textured', applications: ['kitchen','retail','hospitality'], cleaning: 'standard', visualCharacter: 'horizontal porous rhythm', sampleEligible: true, quoteEligible: true, swatch: 'repeating-linear-gradient(4deg,#d8d3c8 0 7px,#bfb8aa 8px 9px,#e3ded4 10px 19px,#c9c2b5 20px 21px)' },
  { id: 'AV-216', name: 'Silver Concrete', family: 'stone', depth: 'medium', warmth: 'cool', finish: 'matte', applications: ['office','retail','hospitality'], cleaning: 'easy-wipe', visualCharacter: 'fine concrete cloud', sampleEligible: true, quoteEligible: true, swatch: 'radial-gradient(circle at 70% 30%,#aaaeb0 0 4%,transparent 5%),radial-gradient(circle at 30% 70%,#8f9497 0 3%,transparent 4%),linear-gradient(135deg,#b7bbbd,#878d90)' },
  { id: 'AV-223', name: 'Basalt Mist', family: 'stone', depth: 'dark', warmth: 'cool', finish: 'matte', applications: ['kitchen','office','retail'], cleaning: 'easy-wipe', visualCharacter: 'soft dark mineral field', sampleEligible: true, quoteEligible: true, swatch: 'radial-gradient(circle at 24% 35%,#565b5d 0 2%,transparent 3%),linear-gradient(140deg,#464b4e,#282d30 52%,#53585a)' },
  { id: 'AV-231', name: 'Noir Terrazzo', family: 'stone', depth: 'dark', warmth: 'neutral', finish: 'textured', applications: ['retail','hospitality','office'], cleaning: 'standard', visualCharacter: 'small aggregate fleck', sampleEligible: true, quoteEligible: true, swatch: 'radial-gradient(circle at 20% 25%,#a38f78 0 2%,transparent 3%),radial-gradient(circle at 66% 72%,#777d7c 0 2%,transparent 3%),radial-gradient(circle at 78% 18%,#c0b09c 0 1.5%,transparent 2.5%),#292827' },
  { id: 'AV-302', name: 'Porcelain White', family: 'solid', depth: 'light', warmth: 'neutral', finish: 'soft-touch', applications: ['kitchen','wardrobe','office','retail'], cleaning: 'easy-wipe', visualCharacter: 'clean soft white', sampleEligible: true, quoteEligible: true, swatch: 'linear-gradient(145deg,#f3f1eb,#deddd8)' },
  { id: 'AV-308', name: 'Sandstone Beige', family: 'solid', depth: 'light', warmth: 'warm', finish: 'matte', applications: ['kitchen','wardrobe','office','hospitality'], cleaning: 'easy-wipe', visualCharacter: 'warm architectural beige', sampleEligible: true, quoteEligible: true, swatch: 'linear-gradient(145deg,#d9c5aa,#c7ad8b)' },
  { id: 'AV-315', name: 'Clay Blush', family: 'solid', depth: 'medium', warmth: 'warm', finish: 'matte', applications: ['wardrobe','retail','hospitality'], cleaning: 'easy-wipe', visualCharacter: 'muted clay rose', sampleEligible: true, quoteEligible: true, swatch: 'linear-gradient(145deg,#b98876,#9f6f61)' },
  { id: 'AV-322', name: 'Sage Grey', family: 'solid', depth: 'medium', warmth: 'neutral', finish: 'soft-touch', applications: ['kitchen','office','retail'], cleaning: 'easy-wipe', visualCharacter: 'grey with restrained green cast', sampleEligible: true, quoteEligible: true, swatch: 'linear-gradient(145deg,#82887c,#696f67)' },
  { id: 'AV-329', name: 'Ink Blue', family: 'solid', depth: 'dark', warmth: 'cool', finish: 'soft-touch', applications: ['kitchen','office','retail','hospitality'], cleaning: 'easy-wipe', visualCharacter: 'deep blue-black field', sampleEligible: true, quoteEligible: true, swatch: 'linear-gradient(145deg,#263746,#172430)' },
  { id: 'AV-336', name: 'Graphite', family: 'solid', depth: 'dark', warmth: 'neutral', finish: 'matte', applications: ['kitchen','wardrobe','office','retail'], cleaning: 'easy-wipe', visualCharacter: 'charcoal neutral', sampleEligible: true, quoteEligible: true, swatch: 'linear-gradient(145deg,#414344,#242627)' },
  { id: 'AV-402', name: 'Linen Natural', family: 'textile', depth: 'light', warmth: 'warm', finish: 'textured', applications: ['wardrobe','office','hospitality'], cleaning: 'standard', visualCharacter: 'subtle woven crosshatch', sampleEligible: true, quoteEligible: true, swatch: 'repeating-linear-gradient(0deg,transparent 0 3px,rgba(91,72,51,.14) 4px 5px),repeating-linear-gradient(90deg,#d8c9b4 0 4px,#cdbba3 5px 6px)' },
  { id: 'AV-409', name: 'Flax Grey', family: 'textile', depth: 'medium', warmth: 'neutral', finish: 'textured', applications: ['wardrobe','office','retail'], cleaning: 'standard', visualCharacter: 'woven cool-neutral texture', sampleEligible: true, quoteEligible: true, swatch: 'repeating-linear-gradient(0deg,transparent 0 3px,rgba(30,34,34,.13) 4px 5px),repeating-linear-gradient(90deg,#9b9b94 0 4px,#858780 5px 6px)' },
  { id: 'AV-416', name: 'Night Canvas', family: 'textile', depth: 'dark', warmth: 'cool', finish: 'textured', applications: ['wardrobe','office','hospitality'], cleaning: 'standard', visualCharacter: 'deep woven blue-grey', sampleEligible: true, quoteEligible: true, swatch: 'repeating-linear-gradient(0deg,transparent 0 3px,rgba(255,255,255,.045) 4px 5px),repeating-linear-gradient(90deg,#343c43 0 4px,#273039 5px 6px)' },
];

export function hplToExperienceEntities(products: HplProduct[] = HPL_PRODUCTS): ExperienceEntity[] {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    subtitle: `${product.family} · ${product.finish}`,
    swatch: product.swatch,
    attributes: {
      family: product.family,
      depth: product.depth,
      warmth: product.warmth,
      finish: product.finish,
      applications: product.applications,
      cleaning: product.cleaning,
      visual_character: product.visualCharacter,
      sample_eligible: product.sampleEligible,
    },
  }));
}

export const HPL_EXPERIENCE_ENTITIES = hplToExperienceEntities();
