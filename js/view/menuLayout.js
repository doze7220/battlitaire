/**
 * 責務: メニューの窓の大きさと、窓の内側（タイトルバーの下）の原点からの部品の位置・大きさを定数で持つ。
 * 状態は持たず、何も import しない。座標はすべて論理座標（720x1280）。
 */

/** エンジンの窓のタイトルバーの既定の高さ（26章）に合わせた値。窓に titleBarHeight を渡さないので、これだけを変えてはならない。 @type {number} */
const TITLE_BAR_H = 88;
/** 窓の幅（内側の幅も同じ）。試遊で決め直す値。 @type {number} */
const INNER_W = 640;
/** 窓の内側の高さ。試遊で決め直す値。 @type {number} */
const INNER_H = 608;
/** 左右の余白。試遊で決め直す値。 @type {number} */
const MARGIN = 24;
/** 部品の間。試遊で決め直す値。 @type {number} */
const GAP = 16;
/** 部品の幅（内側の幅から左右の余白を引いた値）。 @type {number} */
const ITEM_W = INNER_W - MARGIN * 2;
/** タブの列の高さ。試遊で決め直す値。 @type {number} */
const TAB_H = 88;
/** タブの列の y。試遊で決め直す値。 @type {number} */
const TAB_Y = 16;
/** タブの列と中身の間。試遊で決め直す値。 @type {number} */
const TAB_BODY_GAP = 24;
/** 内側の下の余白。試遊で決め直す値。 @type {number} */
const BOTTOM_MARGIN = 24;
/** 中身の始まりの y（タブの列の下端 + タブと中身の間）。 @type {number} */
const BODY_Y = TAB_Y + TAB_H + TAB_BODY_GAP;
/** スライダーの高さ。試遊で決め直す値。 @type {number} */
const SLIDER_H = 132;
/** 文字の表示（項目名・クレジットの行）の高さ。試遊で決め直す値。 @type {number} */
const LABEL_H = 72;
/** 選択肢の列の高さ。試遊で決め直す値。 @type {number} */
const CHOICES_H = 88;
/** クレジットの領域の高さ（内側の高さ - 中身の始まり - 下の余白）。 @type {number} */
const CREDIT_AREA_H = INNER_H - BODY_Y - BOTTOM_MARGIN;
/** クレジットの1行の幅（右端 12 を位置の表示に空ける）。試遊で決め直す値。 @type {number} */
const CREDIT_LINE_W = ITEM_W - 12;
/** クレジットの行の間隔（行 i の y = pitch x i）。試遊で決め直す値。 @type {number} */
const CREDIT_PITCH = 80;

/**
 * 部品の矩形（窓の内側の原点からの位置と大きさ）。`addSlider` などにそのまま広げて渡せる。
 * @typedef {{ x: number, y: number, width: number, height: number }} MenuRect
 */

/**
 * メニューの窓の配置の定数（凍結）。試遊で決め直す値。
 * @type {Readonly<{
 *   window: Readonly<{ width: number, height: number }>,
 *   tabs: MenuRect,
 *   bgmSlider: MenuRect,
 *   seSlider: MenuRect,
 *   speedLabel: MenuRect,
 *   speedChoices: MenuRect,
 *   creditArea: MenuRect,
 *   creditLine: Readonly<{ width: number, height: number, pitch: number }>,
 *   upgradeArea: MenuRect,
 *   upgradeLine: Readonly<{ width: number, height: number, pitch: number }>
 * }>}
 */
export const MENU_LAYOUT = Object.freeze({
  window: Object.freeze({ width: INNER_W, height: TITLE_BAR_H + INNER_H }),
  tabs: Object.freeze({ x: MARGIN, y: TAB_Y, width: ITEM_W, height: TAB_H }),
  bgmSlider: Object.freeze({ x: MARGIN, y: BODY_Y, width: ITEM_W, height: SLIDER_H }),
  seSlider: Object.freeze({ x: MARGIN, y: BODY_Y + SLIDER_H + GAP, width: ITEM_W, height: SLIDER_H }),
  speedLabel: Object.freeze({ x: MARGIN, y: BODY_Y + (SLIDER_H + GAP) * 2, width: ITEM_W, height: LABEL_H }),
  speedChoices: Object.freeze({
    x: MARGIN,
    y: BODY_Y + (SLIDER_H + GAP) * 2 + LABEL_H,
    width: ITEM_W,
    height: CHOICES_H,
  }),
  creditArea: Object.freeze({ x: MARGIN, y: BODY_Y, width: ITEM_W, height: CREDIT_AREA_H }),
  creditLine: Object.freeze({ width: CREDIT_LINE_W, height: LABEL_H, pitch: CREDIT_PITCH }),
  // 「強化」タブはクレジットと同じ領域・同じ行の幅・高さ・間隔
  upgradeArea: Object.freeze({ x: MARGIN, y: BODY_Y, width: ITEM_W, height: CREDIT_AREA_H }),
  upgradeLine: Object.freeze({ width: CREDIT_LINE_W, height: LABEL_H, pitch: CREDIT_PITCH }),
});
