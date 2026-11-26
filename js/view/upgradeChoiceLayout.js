/**
 * 3択の画面の配置（暗幕・見出し・次の敵の板・候補と修理の札の矩形・札の中の文字の位置・スライドの距離）と、タップの当たりを求める。
 * 論理座標（720×1280）の定数で決め、何も import せず、状態は変えない。
 */

/** 見出しの中心の x。 */
const HEADING_X = 360;
/** 見出しの中心の y。 */
const HEADING_Y = 84;
/** 次の敵の板の矩形（x・y・幅・高さ）。 */
const ENEMY_PANEL = Object.freeze({ x: 60, y: 124, w: 600, h: 300 });
/** 「次の敵」の文字の y。 */
const ENEMY_LABEL_Y = 164;
/** 次の敵の絵の矩形（下端が足元）。 */
const ENEMY_FIGURE = Object.freeze({ x: 210, y: 184, w: 300, h: 160 });
/** 次の敵の名前と Lv の文字の y。 */
const ENEMY_NAME_Y = 392;
/** 札の左端の x。 */
const CARD_X = 60;
/** 札の幅。 */
const CARD_W = 600;
/** 候補の札の高さ。 */
const CARD_H = 150;
/** 修理の札の高さ。 */
const REPAIR_H = 130;
/** 1つ目の札の上端の y。 */
const CARD_TOP = 452;
/** 札の間の隙間。 */
const CARD_GAP = 20;
/** 候補の札の中の文字の位置（札の左上からの距離）。 */
const CARD_TEXT = Object.freeze({ slotX: 24, slotY: 32, titleY: 76, detailY: 120 });
/** 修理の札の中の文字の位置（札の左上からの距離）。 */
const REPAIR_TEXT = Object.freeze({ slotX: 24, slotY: 0, titleY: 62, detailY: 104 });
/** 札が画面の右の外から入るときの横の距離。 */
const SLIDE_DISTANCE = 720;

/**
 * 矩形。
 * @typedef {{ x: number, y: number, w: number, h: number }} Rect
 */

/**
 * 札の中の文字の位置（札の左上からの距離）。
 * @typedef {Object} CardTextSpots
 * @property {number} slotX 枠の名前・文字の左端の x
 * @property {number} slotY 枠の名前の y
 * @property {number} titleY 見出しの文字の y
 * @property {number} detailY 説明の文字の y
 */

/**
 * 3択の画面の配置。
 * @typedef {Object} UpgradeChoiceLayout
 * @property {Rect} curtain 暗幕（画面全体）
 * @property {{ x: number, y: number }} heading 見出しの中心
 * @property {{ panel: Rect, labelY: number, figure: Rect, nameY: number }} enemy 次の敵の板（板・「次の敵」の y・絵の矩形・名前と Lv の y）
 * @property {Rect[]} cards 候補の札の矩形（上から）
 * @property {Rect} repair 修理の札の矩形（候補の下）
 * @property {CardTextSpots} cardText 候補の札の中の文字の位置
 * @property {CardTextSpots} repairText 修理の札の中の文字の位置
 * @property {number} slideDistance 札が入るときの右への最初のずれ
 */

/**
 * 3択の画面の配置を作る。
 * @param {{ width: number, height: number }} screen 画面の大きさ
 * @param {number} choiceCount 候補の数（0 以上）
 * @returns {Readonly<UpgradeChoiceLayout>} 配置
 */
export function createUpgradeChoiceLayout(screen, choiceCount) {
  const cards = [];
  let y = CARD_TOP;
  for (let i = 0; i < choiceCount; i++) {
    cards.push({ x: CARD_X, y, w: CARD_W, h: CARD_H });
    y += CARD_H + CARD_GAP;
  }
  return {
    curtain: { x: 0, y: 0, w: screen.width, h: screen.height },
    heading: { x: HEADING_X, y: HEADING_Y },
    enemy: { panel: { ...ENEMY_PANEL }, labelY: ENEMY_LABEL_Y, figure: { ...ENEMY_FIGURE }, nameY: ENEMY_NAME_Y },
    cards,
    repair: { x: CARD_X, y, w: CARD_W, h: REPAIR_H },
    cardText: { ...CARD_TEXT },
    repairText: { ...REPAIR_TEXT },
    slideDistance: SLIDE_DISTANCE,
  };
}

/**
 * 点が矩形の中か。
 * @param {Rect} r 矩形
 * @param {number} x 点の x
 * @param {number} y 点の y
 * @returns {boolean} 中なら true
 */
function inRect(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/**
 * 点が当たった札の番号を返す（スライドのずれは見ない。入りきるまでは押せないため）。
 * @param {UpgradeChoiceLayout} layout 配置
 * @param {number} x 点の x
 * @param {number} y 点の y
 * @returns {number|null} 札の番号（候補は 0〜、修理は候補の数）。どれにも当たらなければ null
 */
export function upgradeChoiceHitTest(layout, x, y) {
  for (let i = 0; i < layout.cards.length; i++) {
    if (inRect(layout.cards[i], x, y)) return i;
  }
  return inRect(layout.repair, x, y) ? layout.cards.length : null;
}
