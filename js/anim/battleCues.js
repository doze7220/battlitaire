/**
 * 時間割の各段が記録したきっかけの時刻（cueTimes）を、音を合わせるきっかけの並びにするだけの純粋関数。
 * 時刻の式は持たない（式は時間割 `battleTimeline.js` の1か所）。音の名前も持たず、描画も状態の変更もしない。
 */

/**
 * 音を合わせるきっかけ。
 * @typedef {Object} BattleCue
 * @property {number} time きっかけの時刻（演出の時計の ms）
 * @property {string} type 段の種類（'block'・'enemyBlock'・'armorBlock'・'castleHit'・'enemyHit'・'heal'・'enemyHeal'・'burn'）
 */

/**
 * 時間割の段が持つ cueTimes から、きっかけの並びを作る（cueTimes が空の段はきっかけを作らない）。
 * @param {import('./battleTimeline.js').TimedStep[]} timedSteps 時刻つきの段
 * @returns {BattleCue[]} 時刻の昇順のきっかけ
 */
export function buildBattleCues(timedSteps) {
  /** @type {BattleCue[]} */
  const cues = [];
  for (const step of timedSteps) {
    for (const time of step.cueTimes) cues.push({ time, type: step.type });
  }
  cues.sort((a, b) => a.time - b.time);
  return cues;
}
