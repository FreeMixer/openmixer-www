// SPDX-License-Identifier: GPL-3.0-or-later
import cardsData from '~/data/feature-cards.json';

export type Surface = 'console' | 'zynthian' | 'libraries';
export type SurfaceState = 'released' | 'merged' | 'coming' | 'to-confirm' | 'none';

interface Text { title: string; line: string; text: string }
interface Proof { kind: string; with: string; rate?: string; figure?: boolean; en: string; ca: string }
export interface FeatureCard {
  id: string;
  row: boolean;
  surfaces: Record<Surface, { state: SurfaceState; version?: string }>;
  detail: string;
  card: { en: Text; ca: Text };
  proof: Proof[];
}

/**
 * The sold features, from the records (scripts/gen-features.mjs). Nothing here is written by hand: a page picks
 * the cards of one surface and the language, and shows what the record says.
 */
export function useFeatureCards() {
  const { locale } = useI18n();
  const lang = computed(() => (locale.value === 'ca' ? 'ca' : 'en'));
  const all = cardsData.cards as unknown as FeatureCard[];
  const text = (c: FeatureCard) => c.card[lang.value];
  const proofText = (p: Proof) => p[lang.value];
  /** The cards that apply to a surface; `group` splits released from merged, coming and to-confirm. */
  const forSurface = (surface: Surface, group: 'released' | 'coming' | 'all' = 'all') =>
    all.filter((c) => {
      const s = c.surfaces[surface].state;
      if (s === 'none') return false;
      if (group === 'released') return s === 'released';
      if (group === 'coming') return s !== 'released';
      return true;
    });
  /** The headline figures, from the proof that is marked as one. */
  const figures = computed(() =>
    all.flatMap((c) => c.proof.filter((p) => p.figure).map((p) => ({ id: c.id, text: proofText(p), with: p.with, rate: p.rate }))),
  );
  return { all, text, proofText, forSurface, figures };
}
