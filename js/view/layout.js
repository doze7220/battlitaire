/**
 * 責務: 盤面の画面配置（座標・大きさ）を一手に持ち、座標から「何に当たるか」を求める。
 * ルール層は import せず、数の情報は引数で受け取る。状態は変えない。
 */

/**
 * 矩形。
 * @typedef {Object} Rect
 * @property {number} x 左端
 * @property {number} y 上端
 * @property {number} w 幅
 * @property {number} h 高さ
 */

/**
 * 列1本の配置。
 * @typedef {Object} ColumnLayout
 * @property {number} x 左端
 * @property {number} y 領域の上端
 * @property {number} w 幅（カードの幅）
 * @property {number} h 領域の高さ
 * @property {number} step カードの重ねのずらし幅
 * @property {number} cardW カードの幅
 * @property {number} cardH カードの高さ
 */

/**
 * 右側パネル（HUD）の配置。
 * @typedef {Object} HudLayout
 * @property {Rect} panel パネル全体
 * @property {function(number): number} gaugeY ゲージ行の上端 y を返す（引数はゲージの並び順の番号）
 * @property {number} gaugeH ゲージ行1つの高さ
 * @property {Rect} actions 「行動 残り / 最大」の領域
 * @property {Rect} actionEnd 「行動終了」の領域
 */

/**
 * 手札の配置。
 * @typedef {Object} HandLayout
 * @property {{ x: number, y: number }} title 見出し「手札」の文字の中心
 * @property {Rect[]} slots 手札の枠の矩形（枠の番号順）
 */

/**
 * 当たり判定の結果。
 * `index` は山札・手札の枠・列・放つボタンの番号。`cardIndex` は列のときだけ意味を持ち、
 * 当たった列のカードの番号（下から数える。どのカードにも当たらなければ null）。
 * @typedef {{ kind: 'deck'|'hand'|'column'|'release'|'actionEnd', index: number, cardIndex?: (number|null) }} Hit
 */

/**
 * 状況の帯（フェーズ・城・敵・敵の予告）の配置。
 * @typedef {Object} StatusLayout
 * @property {Rect} phase 「フェーズ N」の枠
 * @property {Rect} castle 城の HP の枠
 * @property {Rect} enemy 敵の HP の枠
 * @property {Rect} intent 敵の次の行動の予告の枠
 */

/**
 * 盤面の配置。
 * @typedef {Object} Layout
 * @property {{ width: number, height: number }} screen 画面の大きさ
 * @property {{ w: number, h: number }} card カードの幅と高さ
 * @property {Rect[]} decks 山札の領域
 * @property {Rect} discard 捨て札の領域
 * @property {ColumnLayout[]} columns 列の領域
 * @property {HandLayout} hand 手札の見出しと枠
 * @property {Rect[]} releaseButtons 放つボタンの領域
 * @property {HudLayout} hud 右側パネル
 * @property {StatusLayout} status 状況の帯
 * @property {function(number, number, number[]=): (Hit|null)} hitTest 座標（と列ごとのカードの枚数）から当たったものを返す
 */

const CARD_W = 90;
const CARD_H = 126;
const LEFT_X = 80;
const PITCH_X = 130;
const DECK_Y = 50;
const DISCARD_X = 640;
const COLUMN_TOP = 230;
const COLUMN_STEP_DEFAULT = 36;
const RELEASE_Y = 600;
const RELEASE_H = 44;
/** 列の領域の下端と放つボタンの間のすき間 */
const COLUMN_BOTTOM_GAP = 16;
const PANEL_X = 840;
const PANEL_Y = 50;
const PANEL_W = 400;
const PANEL_H = 594;
const GAUGE_Y = 60;
const GAUGE_PITCH = 70;
const GAUGE_H = 56;
const ACTIONS_Y = 360;
const ACTIONS_H = 50;
const ACTION_END_Y = 440;
const ACTION_END_H = 100;
const STATUS_Y = 656;
const STATUS_H = 48;
const STATUS_PHASE_X = 80;
const STATUS_PHASE_W = 160;
const STATUS_CASTLE_X = 260;
const STATUS_CASTLE_W = 300;
const STATUS_ENEMY_X = 580;
const STATUS_ENEMY_W = 300;
const STATUS_INTENT_X = 900;
const STATUS_INTENT_W = 340;
const PANEL_PADDING = 20;
/** 長い列で、重ね幅を保って残す上からの枚数 */
const COLUMN_KEEP_TOP = 3;
/** 手札の領域の中心 x */
const HAND_CENTER_X = 705;
/** 手札の見出しの中心 y */
const HAND_TITLE_Y = 244;
/** 手札の最初の行の上端 y */
const HAND_TOP = 264;
/** 手札の領域の下端 y */
const HAND_BOTTOM = 584;
/** 手札の枠の横の間隔 */
const HAND_GAP_X = 30;
/** 手札の行の縦のピッチ */
const HAND_PITCH_Y = 140;
/** 手札の1行の最大の枠の数 */
const HAND_PER_ROW = 2;

/**
 * 点が矩形の中にあるか（右端・下端は含まない）。
 * @param {Rect} r 矩形
 * @param {number} x x 座標
 * @param {number} y y 座標
 * @returns {boolean} 含むなら true
 */
function inRect(r, x, y) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

/**
 * 列のカードの y 座標（上端）を下から順に求める。描画と当たり判定の両方がこれを使う。
 * 収まる長さなら一定のずらし幅、収まらなければ一番上のカードを領域の下端にそろえ、
 * 上から COLUMN_KEEP_TOP 枚は重ね幅を保ち、残りは領域の上端までを均等に詰める。
 * @param {ColumnLayout} columnLayout 列の配置
 * @param {number} count 列のカードの枚数
 * @returns {number[]} 下から数えた各カードの上端 y（長さ count）
 */
export function columnCardYs(columnLayout, count) {
  const { y, h, step, cardH } = columnLayout;
  const ys = new Array(count);
  if (count <= 1 || (count - 1) * step + cardH <= h) {
    for (let i = 0; i < count; i++) ys[i] = y + step * i;
    return ys;
  }
  if (count <= COLUMN_KEEP_TOP) {
    const s = Math.max(0, (h - cardH) / (count - 1));
    for (let i = 0; i < count; i++) ys[i] = y + s * i;
    return ys;
  }
  const topY = y + h - cardH;
  for (let j = 0; j < COLUMN_KEEP_TOP; j++) ys[count - 1 - j] = topY - step * j;
  const m = count - COLUMN_KEEP_TOP;
  const s = Math.max(0, (ys[count - COLUMN_KEEP_TOP] - y) / m);
  for (let i = 0; i < m; i++) ys[i] = y + s * i;
  return ys;
}

/**
 * 手札の見出しと枠の配置を作る（1行に最大2枠、領域の下端を超えるときは同じ比率で縮める）。
 * @param {number} handSize 手札の枠の数
 * @returns {HandLayout} 手札の配置
 */
function createHandLayout(handSize) {
  const rows = Math.ceil(handSize / HAND_PER_ROW);
  let scale = 1;
  if (rows > 0) {
    const needed = HAND_PITCH_Y * (rows - 1) + CARD_H;
    scale = Math.min(1, (HAND_BOTTOM - HAND_TOP) / needed);
  }
  const w = CARD_W * scale;
  const h = CARD_H * scale;
  const gap = HAND_GAP_X * scale;
  const pitch = HAND_PITCH_Y * scale;
  const slots = [];
  for (let s = 0; s < handSize; s++) {
    const row = Math.floor(s / HAND_PER_ROW);
    const inRow = Math.min(HAND_PER_ROW, handSize - row * HAND_PER_ROW);
    const col = s - row * HAND_PER_ROW;
    const rowW = w * inRow + gap * (inRow - 1);
    slots.push({ x: HAND_CENTER_X - rowW / 2 + (w + gap) * col, y: HAND_TOP + pitch * row, w, h });
  }
  return { title: { x: HAND_CENTER_X, y: HAND_TITLE_Y }, slots };
}

/**
 * 盤面の配置を作る。
 * @param {Object} params 引数
 * @param {{ width: number, height: number }} params.screen 画面の大きさ
 * @param {number} params.deckCount 山札の数
 * @param {number} params.columnCount 列の数
 * @param {number} params.handSize 手札の枠の数
 * @returns {Layout} 配置
 */
export function createLayout({ screen, deckCount, columnCount, handSize }) {
  const decks = [];
  for (let i = 0; i < deckCount; i++) {
    decks.push({ x: LEFT_X + PITCH_X * i, y: DECK_Y, w: CARD_W, h: CARD_H });
  }
  const discard = { x: DISCARD_X, y: DECK_Y, w: CARD_W, h: CARD_H };

  const areaH = RELEASE_Y - COLUMN_BOTTOM_GAP - COLUMN_TOP;
  const step = COLUMN_STEP_DEFAULT;

  const columns = [];
  const releaseButtons = [];
  for (let i = 0; i < columnCount; i++) {
    const x = LEFT_X + PITCH_X * i;
    columns.push({ x, y: COLUMN_TOP, w: CARD_W, h: areaH, step, cardW: CARD_W, cardH: CARD_H });
    releaseButtons.push({ x, y: RELEASE_Y, w: CARD_W, h: RELEASE_H });
  }

  const innerX = PANEL_X + PANEL_PADDING;
  const innerW = PANEL_W - PANEL_PADDING * 2;
  /** @type {HudLayout} */
  const hud = {
    panel: { x: PANEL_X, y: PANEL_Y, w: PANEL_W, h: PANEL_H },
    gaugeY: (i) => GAUGE_Y + GAUGE_PITCH * i,
    gaugeH: GAUGE_H,
    actions: { x: innerX, y: ACTIONS_Y, w: innerW, h: ACTIONS_H },
    actionEnd: { x: innerX, y: ACTION_END_Y, w: innerW, h: ACTION_END_H },
  };

  /** @type {StatusLayout} */
  const status = {
    phase: { x: STATUS_PHASE_X, y: STATUS_Y, w: STATUS_PHASE_W, h: STATUS_H },
    castle: { x: STATUS_CASTLE_X, y: STATUS_Y, w: STATUS_CASTLE_W, h: STATUS_H },
    enemy: { x: STATUS_ENEMY_X, y: STATUS_Y, w: STATUS_ENEMY_W, h: STATUS_H },
    intent: { x: STATUS_INTENT_X, y: STATUS_Y, w: STATUS_INTENT_W, h: STATUS_H },
  };

  const hand = createHandLayout(handSize);

  /**
   * 座標から当たったものを返す（行動終了 → 放つボタン → 山札 → 手札の枠 → 列 の順）。
   * @param {number} x x 座標
   * @param {number} y y 座標
   * @param {number[]} [columnLengths] 列ごとのカードの枚数（列のカードの当たりに使う）
   * @returns {Hit|null} 当たったもの。なければ null
   */
  function hitTest(x, y, columnLengths = []) {
    if (inRect(hud.actionEnd, x, y)) return { kind: 'actionEnd', index: 0 };
    for (let i = 0; i < releaseButtons.length; i++) {
      if (inRect(releaseButtons[i], x, y)) return { kind: 'release', index: i };
    }
    for (let i = 0; i < decks.length; i++) {
      if (inRect(decks[i], x, y)) return { kind: 'deck', index: i };
    }
    for (let i = 0; i < hand.slots.length; i++) {
      if (inRect(hand.slots[i], x, y)) return { kind: 'hand', index: i };
    }
    for (let i = 0; i < columns.length; i++) {
      if (!inRect(columns[i], x, y)) continue;
      const ys = columnCardYs(columns[i], columnLengths[i] ?? 0);
      let cardIndex = null;
      for (let k = ys.length - 1; k >= 0; k--) {
        if (y >= ys[k] && y < ys[k] + columns[i].cardH) {
          cardIndex = k;
          break;
        }
      }
      return { kind: 'column', index: i, cardIndex };
    }
    return null;
  }

  return { screen, card: { w: CARD_W, h: CARD_H }, decks, discard, columns, hand, releaseButtons, hud, status, hitTest };
}
