/**
 * 責務: DEBUG タブのスクロールする領域と中の部品（焼き付けのチェックボックスを含む）の位置・大きさ、FPS の表示の隅を
 * 定数で持ち、ルールの値の並びの矩形を項目の数から求める。座標は論理座標。import は menuLayout.js の MENU_LAYOUT だけ。
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
/** 次の行動の見出しの y。 */
const INTENT_LABEL_Y = ENEMY_CHOICES_Y + CHOICES_H + GAP;
/** 次の行動の選択肢の列の y（見出しのすぐ下）。 */
const INTENT_CHOICES_Y = INTENT_LABEL_Y + LABEL_H;
/** 戦闘のターンの番号のスライダーの y（次の行動の選択肢の下）。 */
const BATTLE_TURN_Y = INTENT_CHOICES_Y + CHOICES_H + GAP;
/** 城の HP の表示の y。 */
const CASTLE_HP_Y = BATTLE_TURN_Y + SLIDER_H + GAP;
/** 城の HP のボタンの y（表示のすぐ下）。 */
const CASTLE_BUTTONS_Y = CASTLE_HP_Y + LABEL_H;
/** 敵の HP の表示の y。 */
const ENEMY_HP_Y = CASTLE_BUTTONS_Y + BUTTON_H + GAP;
/** 敵の HP のボタンの y（表示のすぐ下）。 */
const ENEMY_BUTTONS_Y = ENEMY_HP_Y + LABEL_H;
/** FPS のチェックボックスの y。 */
const FPS_CHECK_Y = ENEMY_BUTTONS_Y + BUTTON_H + GAP;
/** FPS の値の y。 */
const FPS_VALUE_Y = FPS_CHECK_Y + CHECK_H + GAP;
/** 「焼き付けで描く」のチェックボックスの y（FPS の値のすぐ下）。 */
const BAKE_CHECK_Y = FPS_VALUE_Y + LABEL_H + GAP;

/**
 * DEBUG タブの配置の定数（凍結。試遊で決め直す値）。`area` は窓の内側の原点から、
 * ほかの矩形は領域の中身の左上が原点。どれも `addSlider` などにそのまま広げて渡せる。
 * @type {Readonly<{
 *   area: Readonly<{ x: number, y: number, width: number, height: number }>,
 *   troopNote: object,
 *   troopSliders: Readonly<{ attack: object, defense: object, heal: object }>,
 *   stageLabel: object, stageButtons: ReadonlyArray<object>,
 *   enemyLabel: object, enemyChoices: object, intentLabel: object, intentChoices: object,
 *   battleTurn: object, castleHp: object, castleButtons: Readonly<{ one: object, full: object }>,
 *   enemyHp: object, enemyButtons: Readonly<{ one: object, full: object }>,
 *   fpsCheckbox: object, fpsValue: object, bakeCheckbox: object
 * }>}
 */
export const DEBUG_LAYOUT = Object.freeze({
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
  enemyChoices: rect(ENEMY_CHOICES_Y, CHOICES_H),
  intentLabel: rect(INTENT_LABEL_Y, LABEL_H),
  intentChoices: rect(INTENT_CHOICES_Y, CHOICES_H),
  battleTurn: rect(BATTLE_TURN_Y, SLIDER_H),
  castleHp: rect(CASTLE_HP_Y, LABEL_H),
  castleButtons: Object.freeze({
    one: rect(CASTLE_BUTTONS_Y, BUTTON_H, 0, HALF_W),
    full: rect(CASTLE_BUTTONS_Y, BUTTON_H, HALF_W + BUTTON_GAP, HALF_W),
  }),
  enemyHp: rect(ENEMY_HP_Y, LABEL_H),
  enemyButtons: Object.freeze({
    one: rect(ENEMY_BUTTONS_Y, BUTTON_H, 0, HALF_W),
    full: rect(ENEMY_BUTTONS_Y, BUTTON_H, HALF_W + BUTTON_GAP, HALF_W),
  }),
  fpsCheckbox: rect(FPS_CHECK_Y, CHECK_H),
  fpsValue: rect(FPS_VALUE_Y, LABEL_H),
  bakeCheckbox: rect(BAKE_CHECK_Y, CHECK_H),
});

/**
 * ルールの値の並び（元に戻すボタン・組の見出し・スライダー）の矩形を、組ごとの項目の数から求める。
 * 焼き付けのチェックボックスの下から積む。大きさの定数は試遊で決め直す値の定数から計算する。
 * 今の値（[1, 6, 9, 11]）では、ボタン y=1856、城の見出し 1960・スライダー 2032、
 * ゴブリンの見出し 2180・スライダー 2252 から 148 おき、…、ドラゴンの最後のスライダー 6096。
 * @param {number[]} groupSizes 組ごとの項目の数
 * @returns {Readonly<{
 *   resetButton: object,
 *   groups: ReadonlyArray<Readonly<{ heading: object, sliders: ReadonlyArray<object> }>>
 * }>} 矩形は領域の中身の左上が原点
 */
export function debugRuleLayout(groupSizes) {
  const resetButton = rect(BAKE_CHECK_Y + CHECK_H + GAP, BUTTON_H);
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
