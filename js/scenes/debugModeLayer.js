/**
 * 「DEBUG MODE」のいちばん手前のレイヤーの名前を持ち、デバッグ（Engine.debug）のときだけそのレイヤーに描く。
 * シーンの補助（Scene を継承しない）。
 */
import { Engine } from 'oz';
import { drawDebugMode } from '../view/debugModeView.js';

/** 「DEBUG MODE」を描くレイヤーの名前（いちばん手前。Engine.start の layers に足す）。 */
export const DEBUG_MODE_LAYER = 'debugMode';

/**
 * 「DEBUG MODE」のレイヤーなら、デバッグのときだけ「DEBUG」「MODE」を描く。
 * いちばん下に積まれるシーン（Engine.changeScene で切り替わるシーン）の draw の頭で、
 * レイヤーごとに呼ぶ。上に積むシーンからは呼ばない。Engine.start の後だけ呼ばれる。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} layer 今描いているレイヤーの名前
 * @returns {void}
 */
export function drawDebugModeLayer(ctx, layer) {
  if (layer !== DEBUG_MODE_LAYER || !Engine.debug) return;
  drawDebugMode(ctx);
}
