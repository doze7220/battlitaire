/**
 * 責務: 群れ（HP の数の兵）で描く敵の種類ごとの、群れの兵の絵（体の絵・持ち物・焼き付けの識別子）の表を持ち、引くだけ。
 * 状態は変えず、import するのは spriteView.js だけ（ルール層・anim は import しない）。
 */

import { SPRITE_IDS } from './spriteView.js';

/**
 * 群れの兵の絵。
 * @typedef {Object} HordeSkin
 * @property {string} body 体の絵（SPRITE_IDS の値）
 * @property {string|null} item 持ち物の絵（なければ null）
 * @property {string} bake 焼き付けの識別子（同じ絵の種類は1枚を共有する）
 */

/**
 * 敵の種類の識別子 → 群れの兵の絵の凍結した表（群れで描く敵だけが持つ）。
 * @type {Readonly<Record<string, Readonly<HordeSkin>>>}
 */
export const HORDE_SKINS = Object.freeze({
  goblins: Object.freeze({ body: SPRITE_IDS.goblin, item: null, bake: 'goblin' }),
  skeletons: Object.freeze({ body: SPRITE_IDS.skeleton, item: null, bake: 'skeleton' }),
});

/**
 * 敵の種類の群れの兵の絵を引く。
 * @param {string|null} typeId 敵の種類の識別子（null なら表にない扱い）
 * @returns {Readonly<HordeSkin>|null} 群れの兵の絵。表にないとき null
 */
export function hordeSkinOf(typeId) {
  if (typeId === null || !Object.prototype.hasOwnProperty.call(HORDE_SKINS, typeId)) return null;
  return HORDE_SKINS[typeId];
}

/**
 * 敵の種類が群れで描かれるかを返す。
 * @param {string} typeId 敵の種類の識別子
 * @returns {boolean} 群れで描くなら true
 */
export function isHordeEnemy(typeId) {
  return hordeSkinOf(typeId) !== null;
}
