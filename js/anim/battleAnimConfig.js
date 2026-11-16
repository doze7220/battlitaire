/**
 * 攻防の演出の設定（段ごとの時間・段の間・兵の動き（弾む・揺れる・跳ねて落ちる・ずらし・城へ入る／帰る）・早送りの倍率・
 * 終わりの後の間・燃える札の時間と明滅の回数）を1か所に凍結して持つ。これらの数値は、ほかのファイルに書かない。
 */

/**
 * 攻防の演出の設定。時間の単位はミリ秒。
 * @typedef {Object} BattleAnimConfig
 * @property {number} formMs 自軍の兵（攻撃・防御・修理）と敵の守りが陣地で現れる（濃くなる）時間（ms）。試遊で決め直す。
 * @property {number} marchMs 敵兵・攻撃の兵が、相打ちの相手の前（相手のいない兵は進む先）まで1体ずつ進む時間（ms。前から出る遅れは別）。試遊で決め直す。
 * @property {number} clashMs 相打ちの段で、最後の組が跳ねて落ち始めてから段が終わるまでの間（ms）。試遊で決め直す。
 * @property {number} hitMoveMs 残った兵が城・敵に当たる位置まで1体ずつ移動する時間（ms。着いた兵から跳ねて落ちる）。試遊で決め直す。
 * @property {number} hpMs HP の表示が変わる時間の下限（ms。兵が当たる・城に入る間が長ければそちらに合わせる）。試遊で決め直す。
 * @property {number} fadeMs 敵の回復の量の浮き出し・敵の側の余った兵が薄れて消える時間（ms）。試遊で決め直す。
 * @property {number} stepGapMs 段と段の間（ms）。試遊で決め直す。
 * @property {number} endDelayMs 演出が終わってから次のフェーズへ進むまでの間（ms。決着していないとき）。試遊で決め直す。
 * @property {number} fastScale 早送りの倍率（`Engine.timeScale` の値）。試遊で決め直す。
 * @property {number} burnFlashMs 燃える札1枚が明滅する時間（ms）。試遊で決め直す。
 * @property {number} burnFlyMs 燃える札が捨て札へ飛ぶ時間（ms）。試遊で決め直す。
 * @property {number} burnBlinks 燃える札1枚の明滅の回数（回）。試遊で決め直す。
 * @property {'hop'|'sway'} moveStyle 兵の移動の見せ方（'hop'＝弾む／'sway'＝揺れる）。未知の値は使う側で Error。
 * @property {number} hopHeight 弾む移動の持ち上がりの高さ（px）。試遊で決め直す。
 * @property {number} hopPeriodMs 弾む移動の1回の長さ（ms。脚の長さから回数を決める）。試遊で決め直す。
 * @property {number} swayAngle 揺れる移動の最大の傾き（rad）。試遊で決め直す。
 * @property {number} swayPeriodMs 揺れる移動の1回の長さ（ms。脚の長さから回数を決める）。試遊で決め直す。
 * @property {number} moveStaggerMs 兵が前から順に出るときの、1体ごとの遅れ（ms）。試遊で決め直す。
 * @property {number} moveStaggerMaxMs 前から順に出るときの、遅れの広がり全体の上限（ms）。試遊で決め直す。
 * @property {number} popHeight 跳ねて落ちるときの、跳ねる高さ（px）。試遊で決め直す。
 * @property {number} popMs 跳ねて落ちるときに、頂点へ着くまでの時間（ms）。試遊で決め直す。
 * @property {number} fallAccel 跳ねた後に落ちる加速（px/ms²）。試遊で決め直す。
 * @property {number} fallStaggerMs 前から順に跳ねて落ちるときの、1組ごとの遅れ（ms）。試遊で決め直す。
 * @property {number} fallStaggerMaxMs 前から順に跳ねて落ちるときの、遅れの広がり全体の上限（ms）。試遊で決め直す。
 * @property {number} healMoveMs 修理の兵が城へ入るまで移動する時間（ms）。試遊で決め直す。
 * @property {number} returnMs 使われなかった兵が城へ帰るまで移動する時間（ms）。試遊で決め直す。
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
  fastScale: 3,
  burnFlashMs: 400,
  burnFlyMs: 250,
  burnBlinks: 2,
  moveStyle: 'hop',
  hopHeight: 6,
  hopPeriodMs: 200,
  swayAngle: 0.2,
  swayPeriodMs: 300,
  moveStaggerMs: 12,
  moveStaggerMaxMs: 300,
  popHeight: 16,
  popMs: 150,
  fallAccel: 0.003,
  fallStaggerMs: 15,
  fallStaggerMaxMs: 250,
  healMoveMs: 600,
  returnMs: 450,
});
