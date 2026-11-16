/**
 * 責務: スートごとの絵（スプライトの識別子）・色と、ゲージの表示名・ゲージの絵の対応表を持ち、識別子から見た目を引く。
 * ルール層は import せず、識別子の文字列をキーにする。
 */

import { SPRITE_IDS } from './spriteView.js';

/**
 * スートの見た目。
 * @typedef {Object} SuitLook
 * @property {string|null} sprite スートを表すスプライトの識別子（`SPRITE_IDS` の値。未知のスートは null）
 * @property {string} color スートの色（CSS 色文字列）
 */

/**
 * スートの識別子 → 見た目の対応表。
 * @type {Readonly<Object<string, SuitLook>>}
 */
export const SUIT_LOOKS = Object.freeze({
  sword: Object.freeze({ sprite: SPRITE_IDS.sword, color: '#d9534f' }),
  shield: Object.freeze({ sprite: SPRITE_IDS.shield, color: '#4a90d9' }),
  potion: Object.freeze({ sprite: SPRITE_IDS.hammer, color: '#4cae4c' }),
  muscle: Object.freeze({ sprite: SPRITE_IDS.gold, color: '#e0a030' }),
});

/**
 * 未知のスートに使う既定の見た目。
 * @type {Readonly<SuitLook>}
 */
export const DEFAULT_SUIT_LOOK = Object.freeze({ sprite: null, color: '#888888' });

/**
 * ゲージの識別子 → 表示名の対応表。
 * @type {Readonly<Object<string, string>>}
 */
export const GAUGE_LABELS = Object.freeze({
  attack: '攻撃',
  defense: '防御',
  heal: '修理',
  muscle: '金貨',
});

/**
 * 未知のゲージに使う既定の表示名。
 * @type {string}
 */
export const DEFAULT_GAUGE_LABEL = '？';

/**
 * ゲージの識別子 → スートの絵（スプライトの識別子）の対応表（攻撃・防御・修理のみ）。
 * @type {Readonly<Object<string, string>>}
 */
export const GAUGE_SPRITES = Object.freeze({
  attack: SPRITE_IDS.sword,
  defense: SPRITE_IDS.shield,
  heal: SPRITE_IDS.hammer,
});

/**
 * ゲージの識別子からスートの絵（スプライトの識別子）を返す。未知の識別子は null。
 * @param {string} gauge ゲージの識別子
 * @returns {string|null} スプライトの識別子
 */
export function gaugeSprite(gauge) {
  return Object.prototype.hasOwnProperty.call(GAUGE_SPRITES, gauge) ? GAUGE_SPRITES[gauge] : null;
}

/**
 * スートの識別子から見た目を返す。未知の識別子は既定の見た目を返す。
 * @param {string} suit スートの識別子
 * @returns {SuitLook} 見た目
 */
export function suitLook(suit) {
  return SUIT_LOOKS[suit] ?? DEFAULT_SUIT_LOOK;
}

/**
 * ゲージの識別子から表示名を返す。未知の識別子は既定の表示名を返す。
 * @param {string} gauge ゲージの識別子
 * @returns {string} 表示名
 */
export function gaugeLabel(gauge) {
  return GAUGE_LABELS[gauge] ?? DEFAULT_GAUGE_LABEL;
}
