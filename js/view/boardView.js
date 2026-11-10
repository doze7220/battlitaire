/**
 * 責務: 盤面全体の描画の取りまとめ（背景を塗り、山札・捨て札・列・放つボタン・HUD・状況の帯の部品を配置に従って順に呼ぶ）。
 * ゲームの状態は読むだけで変えず、ルールの判定は行わない。
 */

import { drawDeck, drawDiscard } from './deckView.js';
import { drawColumn, drawReleaseButton } from './columnView.js';
import { drawHud } from './hudView.js';
import { drawStatus } from './statusView.js';

const BACKGROUND_COLOR = '#1f3a2e';

/**
 * 盤面の描画に使う表示用の値。シーンが draw のたびにルール層の問い合わせから作る。
 * @typedef {Object} BoardUi
 * @property {number|null} selectedDeck 選択中の山札の番号（なければ null）
 * @property {boolean} discardMode 選択中の山札を「捨てる」状態で表示するか
 * @property {number[]} placeableColumns 強調する（置ける）列の番号
 * @property {boolean[]} releasable 列ごとの「放つ」が押せるか
 * @property {boolean} outOfActions 行動を使い切ったか
 * @property {boolean} battleReady 「行動終了」を押して攻防へ進めるか
 */

/**
 * 盤面全体を描く。game は読むだけで、何も書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Layout} layout 画面の配置
 * @param {import('../rules/Game.js').Game} game ゲームの状態（読み取り専用）
 * @param {BoardUi} ui 表示用の値
 * @returns {void}
 */
export function drawBoard(ctx, layout, game, ui) {
  ctx.save();
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, layout.screen.width, layout.screen.height);
  ctx.restore();

  for (let d = 0; d < layout.decks.length; d++) {
    drawDeck(ctx, layout.decks[d], game.visibleCards(d), game.hiddenCount(d), {
      selected: ui.selectedDeck === d,
      discardMode: ui.discardMode && ui.selectedDeck === d,
    });
  }
  drawDiscard(ctx, layout.discard, game.discard.length);

  for (let c = 0; c < layout.columns.length; c++) {
    drawColumn(ctx, layout.columns[c], game.columns[c], ui.placeableColumns.includes(c));
    drawReleaseButton(ctx, layout.releaseButtons[c], ui.releasable[c]);
  }

  drawHud(ctx, layout.hud, game.gauges, game.actionsLeft, game.actionsMax, ui.outOfActions, ui.battleReady);
  drawStatus(ctx, layout.status, { phase: game.phase, castle: game.castle, enemy: game.enemy });
}
