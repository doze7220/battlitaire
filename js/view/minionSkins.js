/**
 * 責務: 子（次のターンに持ち越す攻撃のユニット）を持つ敵の種類ごとの、子の絵（体の絵・持ち物・焼き付けの識別子）の表を持ち、引くだけ。
 * 状態は変えず、import するのは spriteView.js だけ（ルール層・anim は import しない）。
 */

import { SPRITE_IDS } from './spriteView.js';

/**
 * 子の絵。
 * @typedef {Object} MinionSkin
 * @property {string} body 体の絵（SPRITE_IDS の値）
 * @property {string|null} item 持ち物の絵（なければ null）
 * @property {string} bake 焼き付けの識別子（同じ絵の種類は1枚を共有する）
 */

/**
 * 敵の種類の識別子 → 子の絵の凍結した表（子を持つ敵だけが持つ。`HORDE_SKINS` には足さない。足すと群れの敵として描かれる）。
 * @type {Readonly<Record<string, Readonly<MinionSkin>>>}
 */
export const MINION_SKINS = Object.freeze({
  slime: Object.freeze({ body: SPRITE_IDS.slimeChild, item: null, bake: 'slimeChild' }),
  necromancer: Object.freeze({ body: SPRITE_IDS.undead, item: null, bake: 'undead' }),
});

/**
 * 敵の種類の子の絵を引く。
 * @param {string|null} typeId 敵の種類の識別子（null なら表にない扱い）
 * @returns {Readonly<MinionSkin>|null} 子の絵。表にないとき null
 */
export function minionSkinOf(typeId) {
  if (typeId === null || !Object.prototype.hasOwnProperty.call(MINION_SKINS, typeId)) return null;
  return MINION_SKINS[typeId];
}
