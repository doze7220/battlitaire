/**
 * 責務: 盤面全体の描画の取りまとめ（背景を塗り、戦闘の段（battleStageView.js。段取りの間の兵は段の中で切り抜く）・ゲージ・山札・捨て札・列・手札・放つボタン・最下段（UI）の部品を配置に従って順に呼び、玉に変わる前の札・動いているカード・玉と式を手前に描く）。
 * 札が燃える段は、渡された見た目の値で列・捨て札の枚数・明滅と札の上の炎・飛ぶ札を差し替える。状態は読むだけで変えず、ルールの判定は行わない。
 */

import { drawCardFace, drawCardTint } from './cardView.js';
import { drawDeck, drawDiscard } from './deckView.js';
import { drawColumn, drawReleaseButton } from './columnView.js';
import { drawHand } from './handView.js';
import { drawHud } from './hudView.js';
import { drawGauges } from './gaugeView.js';
import { drawBattleStage } from './battleStageView.js';
import { SPRITE_IDS, drawSpriteCentered } from './spriteView.js';
import { drawTroopSwarm } from './troopView.js';
import { drawReleaseCards, drawReleaseOrbs } from './orbView.js';

/** 盤面全体の背景の色。 */
const BACKGROUND_COLOR = '#1f3a2e';
/** 燃える札の明滅の色（赤）。 */
const BURN_FLASH_COLOR = '#ff3b1f';

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
 * @param {import('../anim/releaseShow.js').ReleaseLook} release 放つ演出の見た目の値（段取りの間の兵・ゲージの表示値・玉に変わる前の札・玉と式。読むだけ）
 * @param {import('../anim/burnTrack.js').BurnBoardLook|null} [burn] 札が燃える段の盤面の見た目（なければ null でルール層の盤面をそのまま描く）
 * @returns {void}
 */
export function drawBoard(ctx, layout, game, ui, anim, release, burn = null) {
  ctx.save();
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, layout.screen.width, layout.screen.height);
  ctx.restore();

  drawBattleStage(ctx, layout.battle, { phase: game.phase, castle: game.castle, enemy: game.enemy, countdown: game.attackCountdown() });
  ctx.save();
  ctx.beginPath();
  ctx.rect(layout.battle.area.x, layout.battle.area.y, layout.battle.area.w, layout.battle.area.h);
  ctx.clip();
  drawTroopSwarm(ctx, release.troops, layout.battle.troops.size);
  ctx.restore();

  drawGauges(ctx, layout.gauges, game.gauges, release.gaugeValues);

  for (let d = 0; d < layout.decks.length; d++) {
    drawDeck(ctx, layout.decks[d], game.visibleCards(d), game.hiddenCount(d), {
      selected: ui.selectedDeck === d,
      discardMode: ui.discardMode && ui.selectedDeck === d,
      flip: anim.deckFlips.get(d) ?? null,
    });
  }
  drawDiscard(ctx, layout.discard, game.discard.length, anim.discardPending + (burn === null ? 0 : burn.discardPending));

  for (let c = 0; c < layout.columns.length; c++) {
    const runFrom = ui.selectedRun !== null && ui.selectedRun.column === c ? ui.selectedRun.from : null;
    const cards = burn === null ? game.columns[c] : burn.columns[c];
    drawColumn(ctx, layout.columns[c], cards, ui.placeableColumns.includes(c), runFrom, anim.hiddenCardIds);
    drawReleaseButton(ctx, layout.releaseButtons[c], ui.releasable[c]);
  }
  if (burn !== null && burn.flash !== null) {
    const r = burn.flash.rect;
    drawCardTint(ctx, r.x, r.y, r.w, r.h, BURN_FLASH_COLOR, burn.flash.alpha);
    drawSpriteCentered(ctx, SPRITE_IDS.fire, r.x + r.w / 2, r.y + r.h / 2, burn.flash.fireSize);
  }
  drawReleaseCards(ctx, release.cards);
  drawHand(ctx, layout.hand, game.hand, { selectedSlot: ui.selectedHandSlot, holdSlots: ui.holdSlots,
    hiddenIds: anim.hiddenCardIds });

  drawHud(ctx, layout.hud, game.actionsLeft, game.actionsMax, ui.outOfActions, ui.battleReady);

  for (const f of anim.flying) {
    drawCardFace(ctx, f.x, f.y, f.w, f.h, f.card);
  }
  if (burn !== null) {
    for (const f of burn.flying) {
      drawCardFace(ctx, f.x, f.y, f.w, f.h, f.card);
    }
  }
  drawReleaseOrbs(ctx, release);
}
