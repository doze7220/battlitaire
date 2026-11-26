/**
 * 責務: 結果の画面の配置（暗幕・板・見える範囲・ボタン）、中身の部品の並べ方（縦の位置と高さ）、押したところの当たりを求める。
 * 何も import せず、状態は変えない。
 */

/** 板の幅。 */
const PANEL_W = 600;
/** 板の高さの、画面の高さに対する割合。 */
const PANEL_H_RATIO = 0.8;
/** 中身の左右の余白。 */
const SIDE_PAD = 32;
/** 中身の右端の、位置の表示の帯のために空ける幅（見える範囲は中身の幅にこの分を足した幅）。 */
const BAR_GAP = 12;
/** ボタンの高さ。 */
const BUTTON_H = 96;
/** 板の下端からボタンの下端までの間。 */
const BUTTON_BOTTOM_PAD = 24;
/** 2つのボタンの間。 */
const BUTTON_GAP = 24;
/** ボタンの文字の左右の余白（文字の最大幅はボタンの幅からこれを2回引く）。 */
const BUTTON_TEXT_PAD = 12;
/** 板の上端から見える範囲の上端までの間。 */
const VIEWPORT_TOP_PAD = 24;
/** 見える範囲の下端とボタンの上端との間。 */
const VIEWPORT_BOTTOM_GAP = 20;
/** 中身の下の余白。 */
const CONTENT_BOTTOM_PAD = 16;

/** 「負け」の部品の高さ。 */
const OUTCOME_H = 60;
/** 倒した数とスコアの部品の高さ。 */
const HEADLINE_H = 140;
/** 区切りの見出しの高さ。 */
const HEADING_H = 56;
/** 項目名と値の行の高さ。 */
const ROW_H = 48;
/** 1行の文字の高さ。 */
const LINE_H = 40;
/** 倒した敵の絵1つの大きさ（正方形）。 */
const PORTRAIT_SIZE = 64;
/** 倒した敵の絵の間。 */
const PORTRAIT_GAP = 8;
/** 負けた敵の部品の高さ。 */
const LOST_H = 120;
/** 負けた敵の絵の幅。 */
const LOST_FIGURE_W = 120;
/** 負けた敵の絵の高さ。 */
const LOST_FIGURE_H = 100;
/** 負けた敵の絵と名前の間。 */
const LOST_TEXT_GAP = 16;

/**
 * 倒した敵の絵の群れの並び（体の大きさと、矩形の下端の中央からのずれ）。
 * @type {Readonly<{ size: number, dx: readonly number[], dy: readonly number[] }>}
 */
export const PORTRAIT_HORDE = Object.freeze({
  size: 30,
  dx: Object.freeze([-16, 16, 0]),
  dy: Object.freeze([-8, -8, 0]),
});

/**
 * 負けた敵の絵の群れの並び。
 * @type {Readonly<{ size: number, dx: readonly number[], dy: readonly number[] }>}
 */
export const LOST_HORDE = Object.freeze({
  size: 48,
  dx: Object.freeze([-30, 30, 0]),
  dy: Object.freeze([-14, -14, 0]),
});

/**
 * 矩形。
 * @typedef {{ x: number, y: number, w: number, h: number }} Rect
 */

/**
 * 結果の画面の配置。
 * @typedef {Object} ResultLayout
 * @property {Rect} curtain 画面全体の暗幕
 * @property {Rect} panel 結果の板
 * @property {Rect} viewport 中身の見える範囲（ここで切り抜く）
 * @property {{ x: number, w: number }} content 中身を置く横の範囲（`x`・`w`）
 * @property {{ retry: Rect, title: Rect }} buttons 「もう一度」「タイトルへ」のボタン
 * @property {number} buttonTextMaxW ボタンの文字の最大幅
 */

/**
 * 中身の部品。`y` は中身の上端からの位置、`x`・`w` は画面の座標。種類ごとに足りる値だけを持つ。
 * @typedef {Object} ResultPiece
 * @property {'outcome'|'headline'|'heading'|'row'|'portraits'|'lost'|'line'} type 部品の種類
 * @property {number} x 左端（画面の x）
 * @property {number} y 上端（中身の上端から）
 * @property {number} w 幅
 * @property {number} h 高さ
 * @property {string} [text] 文字（`outcome`・`line`。`lost` は名前と Lv）
 * @property {string} [key] 文字の表を引く名前（`heading`・`line` で `text` を持たないとき）
 * @property {string} [label] 項目名（`row`）
 * @property {string} [value] 値（`row`）
 * @property {boolean} [isNew] 項目名の右に NEW を出すか（`row`）
 * @property {Array<{ key: string, value: string, x: number, w: number }>} [cells] 区画（`headline`。左から順）
 * @property {Array<{ typeId: string, rect: Rect }>} [items] 絵の並び（`portraits`。`rect.y` は中身の上端から）
 * @property {string} [typeId] 敵の種類（`lost`）
 * @property {Rect} [rect] 絵の矩形（`lost`。`y` は中身の上端から）
 * @property {number} [textX] 名前の左端（`lost`）
 * @property {number} [textW] 名前の最大幅（`lost`）
 */

/**
 * 結果の画面の配置を作る。
 * @param {{ width: number, height: number }} screen 画面の大きさ
 * @returns {ResultLayout} 配置
 */
export function createResultLayout(screen) {
  const panelH = Math.round(screen.height * PANEL_H_RATIO);
  const panel = { x: (screen.width - PANEL_W) / 2, y: (screen.height - panelH) / 2, w: PANEL_W, h: panelH };
  const buttonW = (PANEL_W - SIDE_PAD * 2 - BUTTON_GAP) / 2;
  const buttonY = panel.y + panel.h - BUTTON_BOTTOM_PAD - BUTTON_H;
  const retry = { x: panel.x + SIDE_PAD, y: buttonY, w: buttonW, h: BUTTON_H };
  const title = { x: retry.x + buttonW + BUTTON_GAP, y: buttonY, w: buttonW, h: BUTTON_H };
  const contentW = PANEL_W - SIDE_PAD * 2;
  const viewportY = panel.y + VIEWPORT_TOP_PAD;
  return {
    curtain: { x: 0, y: 0, w: screen.width, h: screen.height },
    panel,
    viewport: { x: panel.x + SIDE_PAD, y: viewportY, w: contentW + BAR_GAP, h: buttonY - VIEWPORT_BOTTOM_GAP - viewportY },
    content: { x: panel.x + SIDE_PAD, w: contentW },
    buttons: { retry, title },
    buttonTextMaxW: buttonW - BUTTON_TEXT_PAD * 2,
  };
}

/**
 * 点が矩形の中か。
 * @param {Rect} r 矩形
 * @param {number} x x
 * @param {number} y y
 * @returns {boolean} 中なら true
 */
function inside(r, x, y) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

/**
 * 押したところが何に当たるか。
 * @param {ResultLayout} layout 配置
 * @param {number} x x
 * @param {number} y y
 * @returns {'retry'|'title'|'content'|null} ボタンの名前・見える範囲（`'content'`）・板の外や板の余白（null）
 */
export function resultHitTest(layout, x, y) {
  if (inside(layout.buttons.retry, x, y)) return 'retry';
  if (inside(layout.buttons.title, x, y)) return 'title';
  if (inside(layout.viewport, x, y)) return 'content';
  return null;
}

/**
 * 結果の画面の中身の部品を上から順に並べる。
 * @param {import('./resultText.js').ResultModel} model 描く内容
 * @param {ResultLayout} layout 配置
 * @returns {{ pieces: ResultPiece[], height: number }} 部品の並びと中身の高さ（部品の下端の最大 + 下の余白）
 */
export function placeResultPieces(model, layout) {
  const { x, w } = layout.content;
  const pieces = [];
  let y = 0;
  /**
   * 部品を足して縦の位置を進める。
   * @param {Omit<ResultPiece, 'x'|'y'|'w'> & Partial<ResultPiece>} piece 部品（`x`・`w` は省略すると中身の範囲）
   * @returns {void}
   */
  const add = (piece) => {
    pieces.push({ x, w, ...piece, y });
    y += piece.h;
  };
  /**
   * 区切りの見出しの部品を足す。
   * @param {string} key 見出しの種類（RESULT_TEXT.headings のキー）
   * @returns {void}
   */
  const heading = (key) => add({ type: 'heading', key, h: HEADING_H });
  /**
   * 項目名と値の行の部品を足す。
   * @param {string} label 項目名
   * @param {string} value 値
   * @param {boolean} isNew 更新したか（NEW を付けるか）
   * @returns {void}
   */
  const row = (label, value, isNew) => add({ type: 'row', label, value, isNew, h: ROW_H });

  add({ type: 'outcome', text: model.outcome, h: OUTCOME_H });
  const cellW = w / 2;
  add({
    type: 'headline',
    h: HEADLINE_H,
    cells: [
      { key: 'defeated', value: model.defeated, x, w: cellW },
      { key: 'score', value: model.score, x: x + cellW, w: cellW },
    ],
  });

  heading('breakdown');
  for (const r of model.scoreRows) row(r.label, r.value, false);
  row(model.turnsRow.label, model.turnsRow.value, false);

  heading('defeated');
  if (model.defeatedTypeIds.length === 0) {
    add({ type: 'line', key: 'none', h: LINE_H });
  } else {
    const perRow = Math.max(1, Math.floor((w + PORTRAIT_GAP) / (PORTRAIT_SIZE + PORTRAIT_GAP)));
    const rows = Math.ceil(model.defeatedTypeIds.length / perRow);
    const items = model.defeatedTypeIds.map((typeId, i) => ({
      typeId,
      rect: {
        x: x + (i % perRow) * (PORTRAIT_SIZE + PORTRAIT_GAP),
        y: y + Math.floor(i / perRow) * (PORTRAIT_SIZE + PORTRAIT_GAP),
        w: PORTRAIT_SIZE,
        h: PORTRAIT_SIZE,
      },
    }));
    add({ type: 'portraits', items, h: rows * PORTRAIT_SIZE + (rows - 1) * PORTRAIT_GAP });
  }

  heading('lost');
  const textX = x + LOST_FIGURE_W + LOST_TEXT_GAP;
  add({
    type: 'lost',
    typeId: model.lost.typeId,
    text: model.lost.text,
    rect: { x, y: y + (LOST_H - LOST_FIGURE_H) / 2, w: LOST_FIGURE_W, h: LOST_FIGURE_H },
    textX,
    textW: x + w - textX,
    h: LOST_H,
  });

  heading('upgrades');
  for (const text of model.upgradeLines) add({ type: 'line', text, h: LINE_H });

  heading('records');
  for (const r of model.records) row(r.label, r.value, false);

  heading('bests');
  if (model.bests === null) {
    add({ type: 'line', key: 'debug', h: LINE_H });
  } else {
    for (const b of model.bests) row(b.label, b.value, b.isNew);
  }

  let bottom = 0;
  for (const p of pieces) bottom = Math.max(bottom, p.y + p.h);
  return { pieces, height: bottom + CONTENT_BOTTOM_PAD };
}
