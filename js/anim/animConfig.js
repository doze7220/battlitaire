/**
 * 演出の時間の設定（カードの移動・めくれ・めくれの待ち・長い列の詰め直し・放つときの玉（玉に変わる・
 * 上る・合体・式・飛ぶ・弾ける）・4スートそろいの文字と玉・金貨の数字が増える時間・「混乱！」の文字の時間と出始めの倍率）を1か所に凍結して持つ。演出の時間の数値は、ほかのファイルに書かない。
 */

/**
 * 演出の時間の設定。時間の単位はミリ秒（`markCallPopScale` だけは倍率）。
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
 * @property {number} allSuitsAppearMs 4スートそろいの文字と玉が現れる（倍率・直径が 0 から育つ）時間（ms）。試遊で決め直す。
 * @property {number} allSuitsHoldMs 4スートそろいの玉が現れてから、1つ目が飛び始めるまでの待ち（ms）。試遊で決め直す。
 * @property {number} allSuitsFlyStaggerMs 4スートそろいの玉が飛び始めるずらしの間隔（ms）。試遊で決め直す。
 * @property {number} allSuitsLabelMs 4スートそろいの文字を出している全体の時間（ms）。試遊で決め直す。
 * @property {number} allSuitsFadeMs 4スートそろいの文字が消える（濃さ 1→0）時間（ms。出している時間の終わりの部分）。試遊で決め直す。
 * @property {number} markCallMs 「混乱！」の文字を出している全体の時間（ms）。試遊で決め直す。
 * @property {number} markCallPopMs 「混乱！」の文字が出始めの倍率から 1 へ縮む時間（ms）。試遊で決め直す。
 * @property {number} markCallFadeMs 「混乱！」の文字が消える（濃さ 1→0）時間（ms。出している時間の終わりの部分）。試遊で決め直す。
 * @property {number} markCallPopScale 「混乱！」の文字の出始めの倍率（時間ではなく倍率）。試遊で決め直す。
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
  orbConvertStaggerMs: 40,
  orbConvertMaxMs: 280,
  orbRiseMs: 300,
  orbMergeMs: 200,
  orbFormulaMs: 600,
  orbFlyMs: 500,
  orbBurstMs: 200,
  coinCountMs: 300,
  allSuitsAppearMs: 150,
  allSuitsHoldMs: 300,
  allSuitsFlyStaggerMs: 80,
  allSuitsLabelMs: 900,
  allSuitsFadeMs: 200,
  markCallMs: 900,
  markCallPopMs: 150,
  markCallFadeMs: 250,
  markCallPopScale: 1.4,
});
