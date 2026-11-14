/**
 * 時間割の段から、音を合わせるきっかけ（相殺・当たり・修理・敵の回復）の時刻の並びを組み立てる純粋関数。
 * 音の名前は持たず、「いつ・何の段が起きたか」だけを答える。描画も状態の変更もしない。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';

/**
 * 音を合わせるきっかけ。
 * @typedef {Object} BattleCue
 * @property {number} time きっかけの時刻（演出の時計の ms）
 * @property {string} type 段の種類（'block'・'enemyBlock'・'armorBlock'・'castleHit'・'enemyHit'・'heal'・'enemyHeal'）
 */

/**
 * 段の種類 → 段の開始 `start` からきっかけまでの時間（ms）の、凍結した対応表（値は関数ではなく数値）。
 * 当たり・修理の式は `battleTimeline.js` の `addHit`（`start + hitMoveMs`）・`addHeal`（`start + formMs`）と同じ。
 * 敵の回復の式は `addEnemyHeal`（`start + formMs`）と同じ。
 * 常時防御力の相殺の式は `addArmorBlock` の当たりの時刻（`start + hitMoveMs`）と同じ。
 * 注意: `battleTimeline.js` の `addHit`・`addHeal`・`addEnemyHeal`・`addArmorBlock` の時刻を変えるときは、ここも合わせて直すこと。
 * @type {Readonly<Record<string, number>>}
 */
const CUE_OFFSET_MS = Object.freeze({
  block: 0,
  enemyBlock: 0,
  armorBlock: BATTLE_ANIM.hitMoveMs,
  castleHit: BATTLE_ANIM.hitMoveMs,
  enemyHit: BATTLE_ANIM.hitMoveMs,
  heal: BATTLE_ANIM.formMs,
  enemyHeal: BATTLE_ANIM.formMs,
});

/**
 * 時間割の段から、きっかけの並びを作る（対象外の段の種類はきっかけを作らない）。
 * @param {import('./battleTimeline.js').TimedStep[]} timedSteps 時刻つきの段
 * @returns {BattleCue[]} 時刻の昇順のきっかけ
 */
export function buildBattleCues(timedSteps) {
  /** @type {BattleCue[]} */
  const cues = [];
  for (const step of timedSteps) {
    if (!Object.prototype.hasOwnProperty.call(CUE_OFFSET_MS, step.type)) continue;
    cues.push({ time: step.start + CUE_OFFSET_MS[step.type], type: step.type });
  }
  cues.sort((a, b) => a.time - b.time);
  return cues;
}
