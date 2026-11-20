/**
 * 演出の時間の設定（カードの移動・めくれ・めくれの待ち・長い列の詰め直し・放つときの玉（玉に変わる・
 * 上る・合体・式・飛ぶ・弾ける）と金貨の数字が増える時間）を1か所に凍結して持つ。演出の時間の数値は、ほかのファイルに書かない。
 */

/**
 * 演出の時間の設定。単位はすべてミリ秒。
 * @typedef {Object} AnimTiming
 * @property {number} cardMoveMs カード1枚が動く時間（ms）。試遊で決め直す。
 * @property {number} deckFlipMs 山札のめくれの時間（ms）。試遊で決め直す。
 * @property {number} deckFlipDelayMs 山札からカードが抜けてから、下のカードがめくれ始めるまでの待ち（ms。抜けたカードが半分ほど離れた頃が目安）。試遊で決め直す。
 * @property {number} columnSettleMs 長い列の詰め直しで、もとからあったカードが新しい位置へ動く時間（ms）。試遊で決め直す。
 * @property {number} orbStartDelayMs 放ってから1枚目の札が玉に変わるまでの間（ms）。試遊で決め直す。
 * @property {number} orbConvertStaggerMs 札が下から順に玉に変わるずらしの間隔の上限（ms）。試遊で決め直す。
 * @property {number} orbConvertMaxMs 玉に変わるずらしの広がり全体の上限（ms）。試遊で決め直す。
 * @property {number} orbRiseMs 玉が合体する位置まで上る時間（ms）。試遊で決め直す。
 * @property {number} orbMergeMs 集まった玉が大きい玉に育つ時間（ms）。試遊で決め直す。
 * @property {number} orbFormulaMs 合体した後、式を出したまま待つ時間（ms）。試遊で決め直す。
 * @property {number} orbFlyMs 大きい玉が飛ぶ先まで飛ぶ時間（ms）。試遊で決め直す。
 * @property {number} orbBurstMs 着いた玉が広がって消える時間（ms）。試遊で決め直す。
 * @property {number} coinCountMs 金貨の玉が着いてから数字が増え終わるまでの時間（ms。0 なら着いた瞬間）。試遊で決め直す。
 */

/**
 * 演出の時間の設定（凍結）。値は試遊で決め直す。
 * @type {Readonly<AnimTiming>}
 */
export const ANIM_TIMING = Object.freeze({
  cardMoveMs: 250,
  deckFlipMs: 200,
  deckFlipDelayMs: 120,
  columnSettleMs: 200,
  orbStartDelayMs: 120,
  orbConvertStaggerMs: 70,
  orbConvertMaxMs: 700,
  orbRiseMs: 300,
  orbMergeMs: 200,
  orbFormulaMs: 600,
  orbFlyMs: 500,
  orbBurstMs: 200,
  coinCountMs: 300,
});
