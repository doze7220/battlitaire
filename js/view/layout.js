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
 * 最下段（UI）の配置。
 * @typedef {Object} HudLayout
 * @property {Rect} panel 段の背景
 * @property {Rect[]} gauges ゲージの枠（ゲージの並び順）
 * @property {Rect} actions 「行動 残り / 最大」の枠
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
 * 最上段（戦闘）の配置。サイドビューの見立てで、左に城、右に敵。
 * @typedef {Object} BattleLayout
 * @property {Rect} area 段全体
 * @property {number} groundY 地面の線の y（兵の足元の基準）
 * @property {Rect} castle 城の仮の図形の矩形
 * @property {Rect} enemy 敵の仮の図形の矩形（丸を内接させる）
 * @property {Rect} phase 「フェーズ N」の枠
 * @property {Rect} castleHp 城の HP の枠
 * @property {Rect} enemyHp 敵の HP の枠
 * @property {Rect} intent 敵の次の行動の予告の枠
 */

/**
 * 盤面の配置。
 * @typedef {Object} Layout
 * @property {{ width: number, height: number }} screen 画面の大きさ
 * @property {{ battle: Rect, solitaire: Rect, ui: Rect }} sections 3段の領域（上から戦闘・ソリティア・UI）
 * @property {{ w: number, h: number }} card カードの幅と高さ
 * @property {Rect[]} decks 山札の領域
 * @property {Rect} discard 捨て札の領域
 * @property {ColumnLayout[]} columns 列の領域
 * @property {HandLayout} hand 手札の見出しと枠
 * @property {Rect[]} releaseButtons 放つボタンの領域
 * @property {HudLayout} hud 最下段（UI）
 * @property {BattleLayout} battle 最上段（戦闘）
 * @property {function(number, number, number[]=): (Hit|null)} hitTest 座標（と列ごとのカードの枚数）から当たったものを返す
 */

/** 最上段（戦闘）の高さ。300〜480 の範囲で変えてよい。試遊で決め直す。 */
const BATTLE_H = 360;
/** 最下段（UI）の高さ（固定。中身の行がおさまる高さ） */
const UI_H = 220;
/** 左右の余白 */
const SIDE_MARGIN = 20;
/** 上の行のカードの横の間隔 */
const ROW_GAP_X = 16;
/** カードの縦横比（高さ / 幅） */
const CARD_ASPECT = 1.4;
/** ソリティアの段の上の余白 */
const SOLITAIRE_PAD_TOP = 16;
/** ソリティアの段の下の余白 */
const SOLITAIRE_PAD_BOTTOM = 12;
/** カードの下の文字の行の高さ（「残り N」・手札の見出し） */
const LABEL_LINE_H = 32;
/** 上の行の文字の行と列の上端の間隔 */
const ROW_GAP_Y = 12;
/** 放つボタンの高さ */
const RELEASE_H = 80;
/** 列のカードの重ねのずらし幅の初期値 */
const COLUMN_STEP_DEFAULT = 36;
/** 列の領域の下端と放つボタンの間のすき間 */
const COLUMN_BOTTOM_GAP = 16;
/** 長い列で、重ね幅を保って残す上からの枚数 */
const COLUMN_KEEP_TOP = 3;

/** 戦闘の段の枠の高さ */
const BOX_H = 40;
/** 「フェーズ N」の枠の幅 */
const PHASE_BOX_W = 200;
/** 戦闘の段の上の余白 */
const BATTLE_TOP_PAD = 12;
/** 地面の線から段の下端までの距離 */
const GROUND_OFFSET = 100;
/** フェーズの枠と城・敵の上端の最小の間隔 */
const BODY_GAP = 16;
/** 城の左端 x */
const CASTLE_X = 40;
/** 城の幅 */
const CASTLE_W = 140;
/** 城の最大の高さ */
const CASTLE_MAX_H = 150;
/** 敵の最大の大きさ */
const ENEMY_MAX_SIZE = 120;
/** 敵の右の余白 */
const ENEMY_RIGHT = 40;
/** HP・予告の枠の幅 */
const INFO_W = 240;
/** 地面の線と HP の枠の間隔 */
const INFO_GAP = 8;
/** HP の枠と予告の枠の間隔 */
const INFO_GAP_Y = 4;

/** 最下段のゲージの枠の上の余白 */
const UI_PAD_TOP = 16;
/** ゲージの枠の高さ */
const GAUGE_H = 64;
/** 最下段の横の間隔 */
const UI_GAP_X = 12;
/** 最下段の縦の間隔 */
const UI_GAP_Y = 12;
/** 「行動 残り / 最大」の枠の幅 */
const ACTIONS_W = 200;
/** 行動の枠と行動終了の高さ */
const ACTION_END_H = 100;

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
 * 最上段（戦闘）の配置を作る。地面の線は段の下端から GROUND_OFFSET 上、城・敵はその上に立つ。
 * @param {number} width 画面の幅
 * @returns {BattleLayout} 戦闘の段の配置
 */
function createBattleLayout(width) {
  const phase = { x: (width - PHASE_BOX_W) / 2, y: BATTLE_TOP_PAD, w: PHASE_BOX_W, h: BOX_H };
  const groundY = BATTLE_H - GROUND_OFFSET;
  const bodyTop = phase.y + phase.h + BODY_GAP;
  const castleH = Math.min(CASTLE_MAX_H, groundY - bodyTop);
  const enemySize = Math.min(ENEMY_MAX_SIZE, groundY - bodyTop);
  const infoY = groundY + INFO_GAP;
  const enemyHp = { x: width - SIDE_MARGIN - INFO_W, y: infoY, w: INFO_W, h: BOX_H };
  return {
    area: { x: 0, y: 0, w: width, h: BATTLE_H },
    groundY,
    castle: { x: CASTLE_X, y: groundY - castleH, w: CASTLE_W, h: castleH },
    enemy: { x: width - ENEMY_RIGHT - enemySize, y: groundY - enemySize, w: enemySize, h: enemySize },
    phase,
    castleHp: { x: SIDE_MARGIN, y: infoY, w: INFO_W, h: BOX_H },
    enemyHp,
    intent: { x: enemyHp.x, y: enemyHp.y + BOX_H + INFO_GAP_Y, w: INFO_W, h: BOX_H },
  };
}

/**
 * 盤面の配置を作る。
 * @param {Object} params 引数
 * @param {{ width: number, height: number }} params.screen 画面の大きさ
 * @param {number} params.deckCount 山札の数
 * @param {number} params.columnCount 列の数
 * @param {number} params.handSize 手札の枠の数
 * @param {number} params.gaugeCount ゲージの数
 * @returns {Layout} 配置
 */
export function createLayout({ screen, deckCount, columnCount, handSize, gaugeCount }) {
  const W = screen.width;
  const H = screen.height;
  const sections = {
    battle: { x: 0, y: 0, w: W, h: BATTLE_H },
    solitaire: { x: 0, y: BATTLE_H, w: W, h: H - BATTLE_H - UI_H },
    ui: { x: 0, y: H - UI_H, w: W, h: UI_H },
  };

  // カードの大きさは、上の行（山札・捨て札・手札の枠）が横幅に並ぶことから決める
  const n = deckCount + 1 + handSize;
  const cardW = Math.floor((W - SIDE_MARGIN * 2 - ROW_GAP_X * (n - 1)) / n);
  const cardH = Math.round(cardW * CARD_ASPECT);
  const rowY = sections.solitaire.y + SOLITAIRE_PAD_TOP;
  /**
   * 上の行（山札・捨て札・手札の枠）の i 番目のカードの左端 x を返す。
   * @param {number} i 上の行での左からの番号
   * @returns {number} 左端 x
   */
  const rowX = (i) => SIDE_MARGIN + (cardW + ROW_GAP_X) * i;

  const decks = [];
  for (let i = 0; i < deckCount; i++) decks.push({ x: rowX(i), y: rowY, w: cardW, h: cardH });
  const discard = { x: rowX(deckCount), y: rowY, w: cardW, h: cardH };

  const slots = [];
  for (let s = 0; s < handSize; s++) slots.push({ x: rowX(deckCount + 1 + s), y: rowY, w: cardW, h: cardH });
  const handW = cardW * handSize + ROW_GAP_X * Math.max(0, handSize - 1);
  /** @type {HandLayout} */
  const hand = {
    title: { x: rowX(deckCount + 1) + handW / 2, y: rowY + cardH + LABEL_LINE_H / 2 },
    slots,
  };

  const columnTop = rowY + cardH + LABEL_LINE_H + ROW_GAP_Y;
  const releaseY = sections.ui.y - SOLITAIRE_PAD_BOTTOM - RELEASE_H;
  const areaH = releaseY - COLUMN_BOTTOM_GAP - columnTop;
  const step = COLUMN_STEP_DEFAULT;
  const pitch = (W - SIDE_MARGIN * 2) / columnCount;

  const columns = [];
  const releaseButtons = [];
  for (let i = 0; i < columnCount; i++) {
    const x = SIDE_MARGIN + pitch * i + (pitch - cardW) / 2;
    columns.push({ x, y: columnTop, w: cardW, h: areaH, step, cardW, cardH });
    releaseButtons.push({ x, y: releaseY, w: cardW, h: RELEASE_H });
  }

  const gaugeW = (W - SIDE_MARGIN * 2 - UI_GAP_X * (gaugeCount - 1)) / gaugeCount;
  const gaugeY = sections.ui.y + UI_PAD_TOP;
  const gauges = [];
  for (let i = 0; i < gaugeCount; i++) {
    gauges.push({ x: SIDE_MARGIN + (gaugeW + UI_GAP_X) * i, y: gaugeY, w: gaugeW, h: GAUGE_H });
  }
  const actionsY = gaugeY + GAUGE_H + UI_GAP_Y;
  const actions = { x: SIDE_MARGIN, y: actionsY, w: ACTIONS_W, h: ACTION_END_H };
  const actionEndX = actions.x + actions.w + UI_GAP_X;
  /** @type {HudLayout} */
  const hud = {
    panel: sections.ui,
    gauges,
    actions,
    actionEnd: { x: actionEndX, y: actionsY, w: W - SIDE_MARGIN - actionEndX, h: ACTION_END_H },
  };

  const battle = createBattleLayout(W);

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

  return { screen, sections, card: { w: cardW, h: cardH }, decks, discard, columns, hand, releaseButtons, hud, battle, hitTest };
}
