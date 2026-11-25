/**
 * デバッグのときに画面の右下に出す2行「DEBUG」「MODE」の文字・位置・見た目を定数で持ち、描く。
 * 出すかどうかは呼ぶ側（scenes/debugModeLayer.js）が決める。状態は変えない。
 */

/**
 * 2行の文字と中心 y（論理座標）。試遊で決め直す値。
 * @type {ReadonlyArray<Readonly<{ text: string, y: number }>>}
 */
const LINES = Object.freeze([
  Object.freeze({ text: 'DEBUG', y: 1252 }),
  Object.freeze({ text: 'MODE', y: 1268 }),
]);

/** 2行の中心 x（論理座標）。試遊で決め直す値。 */
const CENTER_X = 693;

/** 文字の最大の幅（fillText・strokeText の第4引数）。試遊で決め直す値。 */
const MAX_W = 48;

/** 書体。試遊で決め直す値。 */
const FONT = 'bold 14px sans-serif';

/** 文字の色（赤）。試遊で決め直す値。 */
const TEXT_COLOR = '#ff4040';

/** 縁取りの色。試遊で決め直す値。 */
const OUTLINE_COLOR = '#000000';

/** 縁取りの太さ。試遊で決め直す値。 */
const OUTLINE_WIDTH = 2;

/**
 * 「DEBUG」「MODE」の2行を描く。ctx の状態は変えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @returns {void}
 */
export function drawDebugMode(ctx) {
  ctx.save();
  ctx.font = FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = OUTLINE_WIDTH;
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.fillStyle = TEXT_COLOR;
  for (const line of LINES) {
    ctx.strokeText(line.text, CENTER_X, line.y, MAX_W);
    ctx.fillText(line.text, CENTER_X, line.y, MAX_W);
  }
  ctx.restore();
}
