/**
 * 合図（準備終了・BATTLE!・フェーズ／ステージの始まり）の演出の長さと見え方の値を1か所に凍結して持つ。
 * 演出の長さの数値はほかのファイルに書かない。値は試遊で決め直す。
 */

/**
 * 合図の演出の設定。すべて試遊で決め直す値。時間はミリ秒で正の値。
 * 長さどうしの条件: `battlePopMs + battleFadeMs <= battleMs`、
 * `introFadeInMs + introFadeOutMs <= phaseMs`（`stageMs` 以下でもある）、`enemyEnterMs <= stageMs`。
 * @typedef {Object} BannerAnim
 * @property {number} readyPopMs 準備終了のロゴが拡大しながら出きるまで
 * @property {number} battleMs BATTLE! を出している長さ（この後に攻防の演出が始まる）
 * @property {number} battlePopMs BATTLE! が拡大しながら出る長さ（`battleMs` の頭）
 * @property {number} battleFadeMs BATTLE! が消える長さ（`battleMs` の終わり）
 * @property {number} battleFadeScale BATTLE! が消え終わるときの倍率
 * @property {number} phaseMs フェーズの始まりの長さ
 * @property {number} stageMs ステージの始まりの長さ
 * @property {number} introFadeInMs 始まりのロゴ・文字が現れる長さ
 * @property {number} introFadeOutMs 始まりのロゴ・文字が消える長さ
 * @property {number} introScaleFrom 始まりのロゴ・数字が現れ始めるときの倍率
 * @property {number} enemyEnterMs ステージの始まりで敵が入ってくる長さ
 */

/**
 * 合図の演出の設定（凍結）。
 * @type {Readonly<BannerAnim>}
 */
export const BANNER_ANIM = Object.freeze({
  readyPopMs: 300,
  battleMs: 700,
  battlePopMs: 200,
  battleFadeMs: 150,
  battleFadeScale: 1.3,
  phaseMs: 1000,
  stageMs: 1500,
  introFadeInMs: 150,
  introFadeOutMs: 200,
  introScaleFrom: 0.8,
  enemyEnterMs: 900,
});
