/**
 * 責務: 3択の画面（暗幕・見出し・次の敵の絵と名前と Lv・候補と修理の札）を描く。ゲームを読んで描く文字の組み立て（model）も持つ。
 * 状態は変えず、ルール層・anim は実行時に import しない（型の参照だけ）。
 */

import { roundRectPath } from './cardView.js';
import { drawSpriteFit, drawTroopFigure } from './spriteView.js';
import { hordeSkinOf } from './hordeSkins.js';
import {
  UPGRADE_HEADING_TEXT,
  UPGRADE_NEXT_ENEMY_TEXT,
  UPGRADE_SLOT_TEXT,
  upgradeTextOf,
  repairChoiceText,
  nextEnemyText,
} from './upgradeText.js';

/** 暗幕の色（濃さは backdrop を掛ける）。 */
const BACKDROP_FILL = 'rgba(0, 0, 0, 0.72)';
/** 板・札の塗りの色。 */
const PANEL_FILL = 'rgba(16, 20, 28, 0.94)';
/** 板・札の縁の色。 */
const PANEL_STROKE = '#8a94a6';
/** 板・札の縁の太さ。 */
const PANEL_LINE_WIDTH = 4;
/** 板・札の角の丸み。 */
const PANEL_RADIUS = 20;
/** 見出しのフォント。 */
const HEADING_FONT = 'bold 44px sans-serif';
/** 名前・札の見出しのフォント。 */
const TITLE_FONT = 'bold 34px sans-serif';
/** 説明のフォント。 */
const DETAIL_FONT = '28px sans-serif';
/** 枠の名前・「次の敵」のフォント。 */
const SMALL_FONT = '24px sans-serif';
/** 文字の色。 */
const TEXT_COLOR = '#f0f0f0';
/** 枠の名前・説明の文字の色。 */
const SUB_COLOR = '#c8ccd4';
/** 光の色（flash の濃さを掛ける）。 */
const FLASH_COLOR = '255, 255, 255';
/** 群れの敵の兵の大きさ（体の直径）。 */
const HORDE_SIZE = 96;
/** 群れの敵の3体の足元の x のずれ（奥の左・奥の右・手前）。 */
const HORDE_DX = Object.freeze([-64, 64, 0]);
/** 群れの敵の3体の足元の y のずれ（奥の左・奥の右・手前。絵の矩形の下端から）。 */
const HORDE_DY = Object.freeze([-30, -30, 0]);

/**
 * 3択の画面の描く内容（文字だけ。ゲームを読んで作る）。
 * @typedef {Object} UpgradeChoiceModel
 * @property {{ typeId: string, name: string, stageNumber: number }} enemy 次の敵
 * @property {Array<{ slot: string, title: string, detail: string }>} cards 候補の札（slot は枠の名前の文字）
 * @property {{ title: string, detail: string }} repair 修理の札
 */

/**
 * ゲームを読んで 3択の画面の描く内容を作る（状態は変えない。前後の値は game の preview を並べるだけ）。
 * @param {{
 *   config: { upgrades: Object<string, { slot: string }> },
 *   upgradeOffer: { choices: Array<{ id: string, value: number }> },
 *   upgradePreview: (id: string, value: number) => import('./upgradeText.js').UpgradePreviewLike,
 *   repairPreview: () => { amount: number, before: number, after: number },
 *   nextStageEnemy: () => { stageNumber: number, typeId: string, name: string },
 * }} game ゲーム
 * @returns {UpgradeChoiceModel} 描く内容
 */
export function upgradeChoiceModel(game) {
  const next = game.nextStageEnemy();
  const cards = game.upgradeOffer.choices.map((c) => {
    const text = upgradeTextOf(c.id).choice(c.value, game.upgradePreview(c.id, c.value));
    const slot = game.config.upgrades[c.id].slot;
    return { slot: UPGRADE_SLOT_TEXT[slot] ?? slot, title: text.title, detail: text.detail };
  });
  return {
    enemy: { typeId: next.typeId, name: next.name, stageNumber: next.stageNumber },
    cards,
    repair: repairChoiceText(game.repairPreview()),
  };
}

/**
 * 角の丸い板を塗って縁取る。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ x: number, y: number, w: number, h: number }} r 矩形
 * @returns {void}
 */
function drawPanel(ctx, r) {
  roundRectPath(ctx, r.x, r.y, r.w, r.h, PANEL_RADIUS);
  ctx.fillStyle = PANEL_FILL;
  ctx.fill();
  ctx.lineWidth = PANEL_LINE_WIDTH;
  ctx.strokeStyle = PANEL_STROKE;
  ctx.stroke();
}

/**
 * 次の敵の絵を描く（群れの敵は体の絵3体、絵の敵はその絵。強さの数値・★は出さない）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./upgradeChoiceLayout.js').UpgradeChoiceLayout} layout 3択の配置
 * @param {import('./layout.js').BattleLayout} battleLayout 盤面の攻防の配置
 * @param {string} typeId 敵の種類の識別子
 * @returns {void}
 */
function drawNextEnemy(ctx, layout, battleLayout, typeId) {
  const f = layout.enemy.figure;
  const skin = hordeSkinOf(typeId);
  if (skin !== null) {
    const cx = f.x + f.w / 2;
    const foot = f.y + f.h;
    for (let i = 0; i < HORDE_DX.length; i++) {
      drawTroopFigure(ctx, skin.body, skin.item, cx + HORDE_DX[i], foot + HORDE_DY[i], HORDE_SIZE, 0, 0, 0, 0, 1, 1);
    }
    return;
  }
  const figure = battleLayout.enemyFigures[typeId];
  if (figure) drawSpriteFit(ctx, figure.sprite, f);
}

/**
 * 札1枚（スライドのずれ・倍率・濃さ・光つき）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ x: number, y: number, w: number, h: number }} rect 札の矩形
 * @param {import('./upgradeChoiceLayout.js').CardTextSpots} spots 札の中の文字の位置
 * @param {{ slot: string|null, title: string, detail: string }} card 文字
 * @param {{ enter: number, scale: number, flash: number, alpha: number }} item 見た目（UpgradeItemLook）
 * @param {number} slideDistance 札が入るときの右への最初のずれ
 * @returns {void}
 */
function drawCard(ctx, rect, spots, card, item, slideDistance) {
  const dx = (1 - item.enter) * slideDistance;
  ctx.save();
  ctx.globalAlpha = ctx.globalAlpha * item.alpha;
  ctx.translate(rect.x + rect.w / 2 + dx, rect.y + rect.h / 2);
  ctx.scale(item.scale, item.scale);
  ctx.translate(-rect.w / 2, -rect.h / 2);
  const local = { x: 0, y: 0, w: rect.w, h: rect.h };
  drawPanel(ctx, local);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  if (card.slot !== null) {
    ctx.font = SMALL_FONT;
    ctx.fillStyle = SUB_COLOR;
    ctx.fillText(card.slot, spots.slotX, spots.slotY, rect.w - spots.slotX * 2);
  }
  ctx.font = TITLE_FONT;
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText(card.title, spots.slotX, spots.titleY, rect.w - spots.slotX * 2);
  ctx.font = DETAIL_FONT;
  ctx.fillStyle = SUB_COLOR;
  ctx.fillText(card.detail, spots.slotX, spots.detailY, rect.w - spots.slotX * 2);
  if (item.flash > 0) {
    roundRectPath(ctx, local.x, local.y, local.w, local.h, PANEL_RADIUS);
    ctx.fillStyle = `rgba(${FLASH_COLOR}, ${item.flash})`;
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 3択の画面（暗幕・見出し・次の敵の板・候補と修理の札）を描く。状態は変えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./upgradeChoiceLayout.js').UpgradeChoiceLayout} layout 3択の配置
 * @param {import('./layout.js').BattleLayout} battleLayout 盤面の攻防の配置（enemyFigures を読む）
 * @param {UpgradeChoiceModel} model 描く内容
 * @param {{ backdrop: number, items: Array<{ enter: number, scale: number, flash: number, alpha: number }> }} look 見た目（UpgradeChoiceLook）
 * @returns {void}
 */
export function drawUpgradeChoice(ctx, layout, battleLayout, model, look) {
  ctx.save();
  ctx.globalAlpha = look.backdrop;
  ctx.fillStyle = BACKDROP_FILL;
  ctx.fillRect(layout.curtain.x, layout.curtain.y, layout.curtain.w, layout.curtain.h);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = HEADING_FONT;
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText(UPGRADE_HEADING_TEXT, layout.heading.x, layout.heading.y);

  const e = layout.enemy;
  drawPanel(ctx, e.panel);
  ctx.textAlign = 'center';
  ctx.font = SMALL_FONT;
  ctx.fillStyle = SUB_COLOR;
  ctx.fillText(UPGRADE_NEXT_ENEMY_TEXT, e.panel.x + e.panel.w / 2, e.labelY);
  drawNextEnemy(ctx, layout, battleLayout, model.enemy.typeId);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = TITLE_FONT;
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText(nextEnemyText(model.enemy.name, model.enemy.stageNumber), e.panel.x + e.panel.w / 2, e.nameY, e.panel.w - 40);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = look.backdrop;
  model.cards.forEach((card, i) => {
    drawCard(ctx, layout.cards[i], layout.cardText, card, look.items[i], layout.slideDistance);
  });
  const ri = model.cards.length;
  drawCard(
    ctx,
    layout.repair,
    layout.repairText,
    { slot: null, title: model.repair.title, detail: model.repair.detail },
    look.items[ri],
    layout.slideDistance,
  );
  ctx.restore();
}
