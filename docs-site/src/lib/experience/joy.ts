import type { MomentId } from './momentTheme';
import type { SceneId } from './types';

/**
 * The recipient's optional "joy" game: stars for playing along, a sticker for
 * finishing. Persuasive-design rules this module is built around:
 *  - Stars and stickers are cosmetic. Nothing is locked behind them.
 *  - No loss framing, timers, or fake scarcity. You cannot "lose" stars.
 *  - Every scene can be skipped; skipping never shames.
 *  - Awards are idempotent per action, so replaying cannot farm rewards.
 */
export type StarTier = 'bronze' | 'silver' | 'gold';
export type Rarity = 'common' | 'uncommon' | 'rare';

export type Sticker = {
  id: string;
  emoji: string;
  name: string;
  rarity: Rarity;
  moment: MomentId;
};

/** Stars available per scene. Bonus ("lucky") stars are extra and not counted here. */
export function starCapacity(
  scenes: readonly SceneId[],
  opts: { reasons: number; photos: number },
): number {
  let total = 0;
  for (const scene of scenes) {
    switch (scene) {
      case 'gate':
        total += 1;
        break;
      case 'lamp':
        total += 1;
        break;
      case 'balloons':
        total += 4;
        break;
      case 'candle':
        total += 4;
        break;
      case 'gift':
        total += 4;
        break;
      case 'contract':
        total += 1;
        break;
      case 'hub': {
        const photos = Math.min(opts.photos, 5);
        const reasons = Math.min(opts.reasons, 5);
        // One star per room opened, one per photo and reason, plus the envelope and the letter.
        const rooms = 1 + (photos > 0 ? 1 : 0) + (reasons > 0 ? 1 : 0);
        total += rooms + photos + reasons + 2;
        break;
      }
      default:
        break;
    }
  }
  return Math.max(total, 1);
}

export function tierFor(stars: number, max: number): StarTier {
  const ratio = max > 0 ? stars / max : 0;
  if (ratio >= 0.85) return 'gold';
  if (ratio >= 0.55) return 'silver';
  return 'bronze';
}

export const STICKERS: Sticker[] = [
  { id: 'b-hat', emoji: '🥳', name: 'Party Hat', rarity: 'common', moment: 'birthday' },
  { id: 'b-cupcake', emoji: '🧁', name: 'Cupcake', rarity: 'common', moment: 'birthday' },
  { id: 'b-balloon', emoji: '🎈', name: 'Big Balloon', rarity: 'common', moment: 'birthday' },
  { id: 'b-cannon', emoji: '🎉', name: 'Confetti Cannon', rarity: 'uncommon', moment: 'birthday' },
  { id: 'b-cake', emoji: '🎂', name: 'Golden Cake', rarity: 'rare', moment: 'birthday' },

  { id: 'a-letter', emoji: '💌', name: 'Love Letter', rarity: 'common', moment: 'anniversary' },
  { id: 'a-rose', emoji: '🌹', name: 'Red Rose', rarity: 'common', moment: 'anniversary' },
  { id: 'a-candle', emoji: '🕯️', name: 'Candlelight', rarity: 'common', moment: 'anniversary' },
  { id: 'a-hearts', emoji: '💞', name: 'Two Hearts', rarity: 'uncommon', moment: 'anniversary' },
  { id: 'a-ring', emoji: '💍', name: 'Forever Ring', rarity: 'rare', moment: 'anniversary' },

  { id: 't-sun', emoji: '🌻', name: 'Sunflower', rarity: 'common', moment: 'thank_you' },
  { id: 't-tea', emoji: '🍵', name: 'Warm Tea', rarity: 'common', moment: 'thank_you' },
  { id: 't-hug', emoji: '🤗', name: 'Big Hug', rarity: 'common', moment: 'thank_you' },
  { id: 't-rainbow', emoji: '🌈', name: 'Rainbow', rarity: 'uncommon', moment: 'thank_you' },
  { id: 't-heart', emoji: '💛', name: 'Heart of Gold', rarity: 'rare', moment: 'thank_you' },

  { id: 'c-trophy', emoji: '🏆', name: 'Trophy', rarity: 'common', moment: 'congratulations' },
  { id: 'c-party', emoji: '🎊', name: 'Streamers', rarity: 'common', moment: 'congratulations' },
  { id: 'c-star', emoji: '🌟', name: 'Shining Star', rarity: 'common', moment: 'congratulations' },
  { id: 'c-rocket', emoji: '🚀', name: 'Rocket', rarity: 'uncommon', moment: 'congratulations' },
  { id: 'c-crown', emoji: '👑', name: 'Golden Crown', rarity: 'rare', moment: 'congratulations' },

  { id: 'j-spark', emoji: '✨', name: 'Sparkle', rarity: 'common', moment: 'just_because' },
  { id: 'j-hands', emoji: '🫶', name: 'Heart Hands', rarity: 'common', moment: 'just_because' },
  { id: 'j-clover', emoji: '🍀', name: 'Lucky Clover', rarity: 'common', moment: 'just_because' },
  { id: 'j-unicorn', emoji: '🦄', name: 'Unicorn', rarity: 'uncommon', moment: 'just_because' },
  { id: 'j-disco', emoji: '🪩', name: 'Disco Ball', rarity: 'rare', moment: 'just_because' },
];

const WEIGHTS: Record<StarTier, Record<Rarity, number>> = {
  bronze: { common: 100, uncommon: 0, rare: 0 },
  silver: { common: 70, uncommon: 30, rare: 0 },
  gold: { common: 35, uncommon: 40, rare: 25 },
};

/** Variable reward: better play makes rarer stickers likelier, never guaranteed. */
export function pickSticker(
  moment: MomentId,
  tier: StarTier,
  random: () => number = Math.random,
): Sticker {
  const pool = STICKERS.filter((s) => s.moment === moment);
  const weights = WEIGHTS[tier];
  const total = pool.reduce((sum, s) => sum + weights[s.rarity], 0);
  let roll = random() * total;
  for (const sticker of pool) {
    roll -= weights[sticker.rarity];
    if (roll < 0) return sticker;
  }
  return pool[0]!;
}

const BOOK_KEY = 'occasio.stickers';

export type StickerBook = Record<string, number>;

export function readStickerBook(): StickerBook {
  try {
    const raw = window.localStorage.getItem(BOOK_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (parsed && typeof parsed === 'object') {
      return parsed as StickerBook;
    }
  } catch {
    // unavailable or corrupt: start a fresh book
  }
  return {};
}

export function addToStickerBook(id: string): { isNew: boolean; book: StickerBook } {
  const book = readStickerBook();
  const isNew = !book[id];
  book[id] = (book[id] ?? 0) + 1;
  try {
    window.localStorage.setItem(BOOK_KEY, JSON.stringify(book));
  } catch {
    // private mode: the sticker still shows for this visit
  }
  return { isNew, book };
}

export function bookProgress(book: StickerBook): { owned: number; total: number } {
  return {
    owned: STICKERS.filter((s) => (book[s.id] ?? 0) > 0).length,
    total: STICKERS.length,
  };
}
