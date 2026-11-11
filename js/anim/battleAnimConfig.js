/**
 * 攻防の演出の設定（段ごとの時間・段の間・換算の人数・早送りの倍率・終わりの後の間）を1か所に凍結して持つ。
 * これらの数値は、ほかのファイルに書かない。
 */

/**
 * 攻防の演出の設定。時間の単位はミリ秒。
 * @typedef {Object} BattleAnimConfig
 * @property {number} formMs 守り（守備兵・敵の守り）が並ぶ時間、大工が現れる時間（ms）。試遊で決め直す。
 * @property {number} marchMs 敵兵・兵士が出てからぶつかる位置まで進む時間（ms）。試遊で決め直す。
 * @property {number} clashMs ぶつかって消える段の時間（ms。中間で数が減る）。試遊で決め直す。
 * @property {number} hitMoveMs 残った兵が城・敵に当たるまで進む時間（ms）。試遊で決め直す。
 * @property {number} hpMs HP の表示が変わる時間（ms。大工が直す時間も同じ）。試遊で決め直す。
 * @property {number} fadeMs 余った兵・大工が消える時間（ms）。試遊で決め直す。
 * @property {number} stepGapMs 段と段の間（ms）。試遊で決め直す。
 * @property {number} endDelayMs 演出が終わってから次のフェーズへ進むまでの間（ms。決着していないとき）。試遊で決め直す。
 * @property {number} unitSize 大きなユニット1体にまとめる人数（人）。試遊で決め直す。
 * @property {number} fastScale 早送りの倍率（`Engine.timeScale` の値）。試遊で決め直す。
 */

/**
 * 攻防の演出の設定（凍結）。値は試遊で決め直す。
 * @type {Readonly<BattleAnimConfig>}
 */
export const BATTLE_ANIM = Object.freeze({
  formMs: 500,
  marchMs: 700,
  clashMs: 400,
  hitMoveMs: 350,
  hpMs: 300,
  fadeMs: 250,
  stepGapMs: 150,
  endDelayMs: 500,
  unitSize: 10,
  fastScale: 3,
});
