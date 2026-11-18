/**
 * 時間割が記録したきっかけの時刻（cueTimes・敵の攻撃の最初の段の start・HP の変化の記録）を、音を合わせるきっかけの並びと「HP が 0 になる時刻」にするだけの純粋関数。
 * 時刻の式は持たない（式は時間割 `battleTimeline.js` の1か所）。音の名前も持たず、`Sound` を import せず、描画も状態の変更もしない。
 */

import { hpChangeEnd } from './hpTrack.js';

/**
 * 音を合わせるきっかけ。
 * @typedef {Object} BattleCue
 * @property {number} time きっかけの時刻（演出の時計の ms）
 * @property {string} type 段の種類（'block'・'enemyBlock'・'armorBlock'・'castleHit'・'enemyHit'・'heal'・'enemyHeal'・'burn'・'strikeBlock'・'strikeCastle'）、または敵の攻撃の始まり（'enemyAttackStart'）
 */

/**
 * 敵の攻撃の段の種類（`BattleStep` の `heavy` の説明と同じ5つ）。この最初の段の start が 'enemyAttackStart' のきっかけの時刻になる。
 * @type {ReadonlySet<string>}
 */
export const ENEMY_ATTACK_STEP_TYPES = Object.freeze(
  new Set(['enemyMarch', 'block', 'castleHit', 'strikeBlock', 'strikeCastle']),
);

/**
 * 時間割の段が持つ cueTimes から、きっかけの並びを作る（cueTimes が空の段はきっかけを作らない）。
 * さらに、敵の攻撃の段（`ENEMY_ATTACK_STEP_TYPES`）のうち最初の段の start に、種類 'enemyAttackStart' のきっかけを1つ足す（なければ足さない）。
 * @param {import('./battleTimeline.js').TimedStep[]} timedSteps 時刻つきの段
 * @returns {BattleCue[]} 時刻の昇順のきっかけ
 */
export function buildBattleCues(timedSteps) {
  /** @type {BattleCue[]} */
  const cues = [];
  let attackStartAdded = false;
  for (const step of timedSteps) {
    for (const time of step.cueTimes) cues.push({ time, type: step.type });
    if (!attackStartAdded && ENEMY_ATTACK_STEP_TYPES.has(step.type)) {
      attackStartAdded = true;
      cues.push({ time: step.start, type: 'enemyAttackStart' });
    }
  }
  cues.sort((a, b) => a.time - b.time);
  return cues;
}

/**
 * HP が 0 になる時刻を、時間割の HP の変化の記録から読む（時刻の式は持たない）。
 * 城の変化の並びから `to <= 0` の最初の変化を探し、あればその終わり（`hpChangeEnd`）。なければ敵の変化の並びで同じく探す。
 * @param {import('./hpTrack.js').HpChange[]} castleHpChanges 城の HP の変化（時刻の順）
 * @param {import('./hpTrack.js').HpChange[]} enemyHpChanges 敵の HP の変化（時刻の順）
 * @returns {number|null} HP が 0 になる時刻（演出の時計の ms）。決着も敵の撃破もない攻防は null
 */
export function knockoutTime(castleHpChanges, enemyHpChanges) {
  const castle = castleHpChanges.find((change) => change.to <= 0);
  if (castle !== undefined) return hpChangeEnd(castle);
  const enemy = enemyHpChanges.find((change) => change.to <= 0);
  if (enemy !== undefined) return hpChangeEnd(enemy);
  return null;
}
