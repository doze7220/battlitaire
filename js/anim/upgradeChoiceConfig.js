/**
 * 3択の画面の動きの長さ・ずれ・反応の値を1か所に凍結して持つ。
 * 動きの数値はほかのファイルに書かない。値は試遊で決め直す。
 */

/**
 * 3択の画面の動きの設定。時間はミリ秒、倍率・濃さは 0〜1 の値。演出の速さの設定には合わせない（誤タップを防ぐ一定の長さ）。
 * @typedef {Object} UpgradeChoiceAnim
 * @property {number} backdropMs 暗幕が濃くなりきるまでの長さ
 * @property {number} slideMs 札1枚が右から入りきるまでの長さ
 * @property {number} slideStaggerMs 札の入り始めの1枚ごとのずれ
 * @property {number} reactMs 選んでから反応が終わるまでの長さ
 * @property {number} pressScale 選んだ札が押し込まれたときの倍率
 * @property {number} flashAlpha 選んだ札の白い光の最初の濃さ
 * @property {number} dimAlpha 選ばなかった札が下がりきったときの濃さ
 */

/**
 * 3択の画面の動きの設定（凍結）。すべて試遊で決め直す値。
 * @type {Readonly<UpgradeChoiceAnim>}
 */
export const UPGRADE_CHOICE_ANIM = Object.freeze({
  backdropMs: 150,
  slideMs: 300,
  slideStaggerMs: 100,
  reactMs: 300,
  pressScale: 0.94,
  flashAlpha: 0.5,
  dimAlpha: 0.45,
});
