/**
 * 責務: 盤面全体の描画の取りまとめ（背景を塗り、戦闘の段（battleStageView.js）・ゲージ・山札・捨て札・列・手札・放つボタン・最下段（UI）の部品を配置に従って順に呼び、最後に動いているカードを手前に描く）。
 * ゲームの状態は読むだけで変えず、ルールの判定は行わない。動きの見た目の値（anim）は各部品へ渡すだけ。
 */

import { drawCardFace } from './cardView.js';
import { drawDeck, drawDiscard } from './deckView.js';
import { drawColumn, drawReleaseButton } from './columnView.js';
import { drawHand } from './handView.js';
import { drawHud } from './hudView.js';
import { drawGauges } from './gaugeView.js';
import { drawBattleStage } from './battleStageView.js';

/** 盤面全体の背景の色。 */
const BACKGROUND_COLOR = '#1f3a2e';

/**
 * 盤面の描画に使う表示用の値。シーンが draw のたびにルール層の問い合わせから作る。
 * @typedef {Object} BoardUi
 * @property {number|null} selectedDeck 選択中の山札の番号（なければ null）
 * @property {boolean} discardMode 選択中の山札を「捨てる」状態で表示するか
 * @property {number[]} placeableColumns 目印を付ける列（置ける列・移せる列）の番号
 * @property {number[]} holdSlots 山札のカードを入れられる手札の枠の番号
 * @property {number|null} selectedHandSlot 選択中の手札の枠の番号（なければ null）
 * @property {{ column: number, from: number }|null} selectedRun 選択中の束（なければ null）
 * @property {boolean[]} releasable 列ごとの「放つ」が押せるか
 * @property {boolean} outOfActions 行動を使い切ったか
 * @property {boolean} battleReady 「行動終了」を押して攻防へ進めるか
 */

/**
 * 盤面全体を描く（背景 → 戦闘の段 → ソリティアの段 → 最下段 → 動いているカードの順）。game は読むだけで、何も書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Layout} layout 画面の配置
 * @param {import('../rules/Game.js').Game} game ゲームの状態（読み取り専用）
 * @param {BoardUi} ui 表示用の値
 * @param {import('../anim/boardAnimator.js').BoardAnimView} anim 動きの見た目の値（読むだけ）
 * @returns {void}
 */
export function drawBoard(ctx, layout, game, ui, anim) {
  ctx.save();
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, layout.screen.width, layout.screen.height);
  ctx.restore();

  drawBattleStage(ctx, layout.battle, { phase: game.phase, castle: game.castle, enemy: game.enemy });

  drawGauges(ctx, layout.gauges, game.gauges, anim.gaugeValues);

  for (let d = 0; d < layout.decks.length; d++) {
    drawDeck(ctx, layout.decks[d], game.visibleCards(d), game.hiddenCount(d), {
      selected: ui.selectedDeck === d,
      discardMode: ui.discardMode && ui.selectedDeck === d,
      flip: anim.deckFlips.get(d) ?? null,
    });
  }
  drawDiscard(ctx, layout.discard, game.discard.length, anim.discardPending);

  for (let c = 0; c < layout.columns.length; c++) {
    const runFrom = ui.selectedRun !== null && ui.selectedRun.column === c ? ui.selectedRun.from : null;
    drawColumn(ctx, layout.columns[c], game.columns[c], ui.placeableColumns.includes(c), runFrom, anim.hiddenCardIds);
    drawReleaseButton(ctx, layout.releaseButtons[c], ui.releasable[c]);
  }
  drawHand(ctx, layout.hand, game.hand, { selectedSlot: ui.selectedHandSlot, holdSlots: ui.holdSlots,
    hiddenIds: anim.hiddenCardIds });

  drawHud(ctx, layout.hud, game.actionsLeft, game.actionsMax, ui.outOfActions, ui.battleReady);

  for (const f of anim.flying) {
    drawCardFace(ctx, f.x, f.y, f.w, f.h, f.card);
  }
}
