/**
 * 演出の時間の設定（カードの移動・めくれ・放つときのずらしと全体の上限）を1か所に凍結して持つ。
 * 演出の時間の数値は、ほかのファイルに書かない。
 */

/**
 * 演出の時間の設定。単位はすべてミリ秒。
 * @typedef {Object} AnimTiming
 * @property {number} cardMoveMs カード1枚が動く時間（ms）。試遊で決め直す。
 * @property {number} deckFlipMs 山札のめくれの時間（ms）。試遊で決め直す。
 * @property {number} releaseStaggerMs 放つときのカードごとのずらしの間隔の上限（ms）。試遊で決め直す。
 * @property {number} releaseTotalMaxMs 放つ束の全体の時間の上限（ms）。試遊で決め直す。
 */

/**
 * 演出の時間の設定（凍結）。値は試遊で決め直す。
 * @type {Readonly<AnimTiming>}
 */
export const ANIM_TIMING = Object.freeze({
  cardMoveMs: 250,
  deckFlipMs: 200,
  releaseStaggerMs: 80,
  releaseTotalMaxMs: 1000,
});
