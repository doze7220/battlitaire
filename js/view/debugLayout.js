/**
 * 責務: DEBUG タブのスクロールする領域と中の部品（焼き付けのチェックボックスを含む）の位置・大きさ、FPS の表示の隅を
 * 値で持ち、敵の数から配置を、ルールの値の並びの矩形を項目の数から求める。座標は論理座標。import は menuLayout.js の MENU_LAYOUT だけ。
 */
import { MENU_LAYOUT } from './menuLayout.js';

/** 部品の間（見出しどうしの区切りの前）。試遊で決め直す値。 @type {number} */
const GAP = 16;
/** 領域の右端に空ける位置の表示の帯。試遊で決め直す値。 @type {number} */
const SCROLL_BAND = 12;
/** 文字の表示（見出し・HP・FPS の値）の高さ。試遊で決め直す値。 @type {number} */
const LABEL_H = 72;
/** スライダーの高さ。試遊で決め直す値。 @type {number} */
const SLIDER_H = 132;
/** 選択肢の列の高さ。試遊で決め直す値。 @type {number} */
const CHOICES_H = 88;
/** ボタンの高さ。試遊で決め直す値。 @type {number} */
const BUTTON_H = 88;
/** チェックボックスの高さ。試遊で決め直す値。 @type {number} */
const CHECK_H = 88;
/** 横に並べるボタンの間。試遊で決め直す値。 @type {number} */
const BUTTON_GAP = 16;

/** 領域（クレジットの領域と同じ、タブの列の下から内側の下の余白まで）。 */
const AREA = Object.freeze({ ...MENU_LAYOUT.creditArea });
/** 領域の中の部品の幅（位置の表示の帯を空ける）。 @type {number} */
const ROW_W = AREA.width - SCROLL_BAND;
/** 横に2つ並べるボタンの1つの幅。 @type {number} */
const HALF_W = (ROW_W - BUTTON_GAP) / 2;
/** 横に4つ並べるボタンの1つの幅。 @type {number} */
const QUARTER_W = (ROW_W - BUTTON_GAP * 3) / 4;

/**
 * 領域の中の矩形を作って凍結する。
 * @param {number} y 領域の中身の左上からの y
 * @param {number} height 高さ
 * @param {number} [x] x（既定 0）
 * @param {number} [width] 幅（既定 ROW_W）
 * @returns {Readonly<{ x: number, y: number, width: number, height: number }>} 矩形
 */
function rect(y, height, x = 0, width = ROW_W) {
  return Object.freeze({ x, y, width, height });
}

/** 兵の数の見出しの y。 */
const TROOP_NOTE_Y = 0;
/** 攻撃の兵のスライダーの y。 */
const ATTACK_Y = TROOP_NOTE_Y + LABEL_H + GAP;
/** 防御の兵のスライダーの y。 */
const DEFENSE_Y = ATTACK_Y + SLIDER_H + GAP;
/** 修理の兵のスライダーの y。 */
const HEAL_Y = DEFENSE_Y + SLIDER_H + GAP;
/** ステージの表示の y。 */
const STAGE_LABEL_Y = HEAL_Y + SLIDER_H + GAP;
/** ステージを移るボタンの y（表示のすぐ下）。 */
const STAGE_BUTTONS_Y = STAGE_LABEL_Y + LABEL_H;
/** 敵の見出しの y。 */
const ENEMY_LABEL_Y = STAGE_BUTTONS_Y + BUTTON_H + GAP;
/** 敵の選択肢の列の y（見出しのすぐ下）。 */
const ENEMY_CHOICES_Y = ENEMY_LABEL_Y + LABEL_H;
/** 敵の選択肢の1段に並べる数。試遊で決め直す値。 @type {number} */
const ENEMY_COLS = 2;

/**
 * DEBUG タブの配置（凍結。試遊で決め直す値）。`area` は窓の内側の原点から、
 * ほかの矩形は領域の中身の左上が原点。どれも `addSlider` などにそのまま広げて渡せる。
 * `enemyRows` は敵の切り替えの段（上から順）で、`from`〜`to`（`to` は含まない）がその段に並ぶ敵の番号の範囲。
 * 最後の段が `ENEMY_COLS` に満たないときは、その数ぶんの幅にする。`ruleTop` はルールの値の並びの始まりの y。
 * @typedef {Readonly<{
 *   area: Readonly<{ x: number, y: number, width: number, height: number }>,
 *   troopNote: object,
 *   troopSliders: Readonly<{ attack: object, defense: object, heal: object }>,
 *   stageLabel: object, stageButtons: ReadonlyArray<object>,
 *   enemyLabel: object,
 *   enemyRows: ReadonlyArray<Readonly<{ rect: object, from: number, to: number }>>,
 *   intentLabel: object, intentChoices: object,
 *   battleTurn: object, castleHp: object, castleButtons: Readonly<{ one: object, full: object }>,
 *   enemyHp: object, enemyButtons: Readonly<{ one: object, full: object }>,
 *   fpsCheckbox: object, fpsValue: object, bakeCheckbox: object,
 *   ruleTop: number
 * }>} DebugLayout
 */

/**
 * 敵の数から、DEBUG タブの配置を求める（敵の切り替えの段の数で、その下の y が変わる）。
 * @param {number} enemyCount 敵の種類の数
 * @returns {DebugLayout} 配置
 */
export function createDebugLayout(enemyCount) {
  const rowCount = Math.max(1, Math.ceil(enemyCount / ENEMY_COLS));
  const enemyRows = [];
  for (let r = 0; r < rowCount; r += 1) {
    const from = r * ENEMY_COLS;
    const to = Math.min(enemyCount, from + ENEMY_COLS);
    const width = (ROW_W * (to - from)) / ENEMY_COLS;
    enemyRows.push(Object.freeze({
      rect: rect(ENEMY_CHOICES_Y + r * (CHOICES_H + GAP), CHOICES_H, 0, to - from > 0 ? width : ROW_W),
      from,
      to,
    }));
  }
  const enemyEndY = ENEMY_CHOICES_Y + rowCount * CHOICES_H + (rowCount - 1) * GAP;
  /** 次の行動の見出しの y。 */
  const intentLabelY = enemyEndY + GAP;
  /** 次の行動の選択肢の列の y（見出しのすぐ下）。 */
  const intentChoicesY = intentLabelY + LABEL_H;
  /** 戦闘のターンの番号のスライダーの y（次の行動の選択肢の下）。 */
  const battleTurnY = intentChoicesY + CHOICES_H + GAP;
  /** 城の HP の表示の y。 */
  const castleHpY = battleTurnY + SLIDER_H + GAP;
  /** 城の HP のボタンの y（表示のすぐ下）。 */
  const castleButtonsY = castleHpY + LABEL_H;
  /** 敵の HP の表示の y。 */
  const enemyHpY = castleButtonsY + BUTTON_H + GAP;
  /** 敵の HP のボタンの y（表示のすぐ下）。 */
  const enemyButtonsY = enemyHpY + LABEL_H;
  /** FPS のチェックボックスの y。 */
  const fpsCheckY = enemyButtonsY + BUTTON_H + GAP;
  /** FPS の値の y。 */
  const fpsValueY = fpsCheckY + CHECK_H + GAP;
  /** 「焼き付けで描く」のチェックボックスの y（FPS の値のすぐ下）。 */
  const bakeCheckY = fpsValueY + LABEL_H + GAP;
  return Object.freeze({
    area: AREA,
    troopNote: rect(TROOP_NOTE_Y, LABEL_H),
    troopSliders: Object.freeze({
      attack: rect(ATTACK_Y, SLIDER_H),
      defense: rect(DEFENSE_Y, SLIDER_H),
      heal: rect(HEAL_Y, SLIDER_H),
    }),
    stageLabel: rect(STAGE_LABEL_Y, LABEL_H),
    stageButtons: Object.freeze(
      [0, 1, 2, 3].map((i) => rect(STAGE_BUTTONS_Y, BUTTON_H, i * (QUARTER_W + BUTTON_GAP), QUARTER_W)),
    ),
    enemyLabel: rect(ENEMY_LABEL_Y, LABEL_H),
    enemyRows: Object.freeze(enemyRows),
    intentLabel: rect(intentLabelY, LABEL_H),
    intentChoices: rect(intentChoicesY, CHOICES_H),
    battleTurn: rect(battleTurnY, SLIDER_H),
    castleHp: rect(castleHpY, LABEL_H),
    castleButtons: Object.freeze({
      one: rect(castleButtonsY, BUTTON_H, 0, HALF_W),
      full: rect(castleButtonsY, BUTTON_H, HALF_W + BUTTON_GAP, HALF_W),
    }),
    enemyHp: rect(enemyHpY, LABEL_H),
    enemyButtons: Object.freeze({
      one: rect(enemyButtonsY, BUTTON_H, 0, HALF_W),
      full: rect(enemyButtonsY, BUTTON_H, HALF_W + BUTTON_GAP, HALF_W),
    }),
    fpsCheckbox: rect(fpsCheckY, CHECK_H),
    fpsValue: rect(fpsValueY, LABEL_H),
    bakeCheckbox: rect(bakeCheckY, CHECK_H),
    ruleTop: bakeCheckY + CHECK_H + GAP,
  });
}

/**
 * ルールの値の並び（元に戻すボタン・組の見出し・スライダー）の矩形を、組ごとの項目の数から求める。
 * `ruleTop`（`createDebugLayout` の値。焼き付けのチェックボックスの下）から積む。
 * 大きさの定数は試遊で決め直す値の定数から計算する。
 * @param {number} ruleTop 並びの始まりの y（元に戻すボタンの y）
 * @param {number[]} groupSizes 組ごとの項目の数
 * @returns {Readonly<{
 *   resetButton: object,
 *   groups: ReadonlyArray<Readonly<{ heading: object, sliders: ReadonlyArray<object> }>>
 * }>} 矩形は領域の中身の左上が原点
 */
export function debugRuleLayout(ruleTop, groupSizes) {
  const resetButton = rect(ruleTop, BUTTON_H);
  let y = resetButton.y + BUTTON_H;
  const groups = groupSizes.map((size) => {
    y += GAP;
    const heading = rect(y, LABEL_H);
    y += LABEL_H;
    const sliders = [];
    for (let i = 0; i < size; i += 1) {
      if (i > 0) y += GAP;
      sliders.push(rect(y, SLIDER_H));
      y += SLIDER_H;
    }
    return Object.freeze({ heading, sliders: Object.freeze(sliders) });
  });
  return Object.freeze({ resetButton, groups: Object.freeze(groups) });
}

/**
 * FPS の表示の隅（Engine.fpsPosition に渡す。14章）。試遊で決め直す値。
 * 上の2つの隅は最上部の HP の数字と重なるので下の隅（左）にする。
 * @type {string}
 */
export const DEBUG_FPS_POSITION = 'bottom-left';
