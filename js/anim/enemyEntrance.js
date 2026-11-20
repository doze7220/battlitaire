/**
 * 敵が右の画面の外から入ってくる動き（時計 → 横のずれ）の式を持つ。
 * 描画も状態の変更も行わない。
 */

import { BANNER_ANIM } from './bannerConfig.js';
import { clamp01, easeOutCubic } from './easing.js';

/**
 * 段取りの間の敵の絵の入りの見た目。
 * @typedef {Object} EnemyEntranceLook
 * @property {boolean} visible 偽なら敵の絵を描かない
 * @property {number} dx 右へのずれ（px）
 */

/**
 * 敵の入りの横のずれを求める。
 * @param {number} clock ステージの始まりの頭からの経過時間（ミリ秒）
 * @param {number} distance 入りの始めの右へのずれ（px）
 * @returns {number} 右へのずれ（px。時計 0 で distance、入り終わりで 0）
 */
export function enemyEntranceOffset(clock, distance) {
  const t = BANNER_ANIM.enemyEnterMs > 0 ? clamp01(clock / BANNER_ANIM.enemyEnterMs) : 1;
  return distance * (1 - easeOutCubic(t));
}
