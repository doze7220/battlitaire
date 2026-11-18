/**
 * 責務: 盤面の画面配置（戦闘の段の兵の陣地・敵ごとの当たる位置・炎の出る位置・画面の外の x・城の打撃の範囲・人数の表示・城と敵の絵の矩形・ゴブリンの群れの並び・敵を倒したときの案内・早送りとスキップの矩形を含む）を一手に持ち、座標から「何に当たるか」を求める。
 * タイトル画面・遊び方の画面・結果の表示（決着）の配置と当たりも持つ。ルール層は import せず、数の情報は引数で受け取る。状態は変えない。絵の縦横比は spriteView.js から得る。
 */

import { SPRITE_IDS, spriteFitRect } from './spriteView.js';

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
 * @property {Rect} actionEnd 「行動終了」の領域（中に残りの行動回数も出す。左側は空けてある）
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
 * 戦闘の段での兵の配置。陣地は兵の足元の中心が入る矩形で、兵1体の大きさ・当たる位置・落ちて消える y を持つ。
 * @typedef {Object} TroopLayout
 * @property {number} size 兵の大きさ（直径）
 * @property {{ attack: Rect, defense: Rect, heal: Rect, enemy: Rect }} camps 役割ごとの陣地（敵兵・敵の守りは enemy を共用）
 * @property {number} blockStepX 相打ちの相手が前へ踏み出す距離
 * @property {number} contactGap 相打ちでぶつかる2体の間隔
 * @property {number} attackAdvanceX 相打ちの相手のいない攻撃の兵が進む距離
 * @property {number} enemyAdvanceX 相打ちにならない敵兵が左へ進む距離
 * @property {number} castleHitX 城に当たる位置の x（城の右端の少し内側）
 * @property {number} offscreenX 敵の側の兵が現れる・帰る画面の外の x（段の右端 + 兵の大きさ）
 * @property {Rect} castleHitArea 城の打撃のヒットマークを出す範囲（城の絵の矩形の内側）
 * @property {number} castleEntryX 修理の兵・帰る兵が城に入って消える位置の x（城の中心）
 * @property {number} fallOutY 落ちる兵の足元がこれより下に来たら消える y
 */

/**
 * 敵の絵（巨人・ドラゴン）1体の配置。
 * @typedef {Object} EnemyFigure
 * @property {string} sprite スプライトの識別子（SPRITE_IDS の値）
 * @property {Rect} rect 絵の矩形（足元が地面）
 * @property {Rect} shieldArea シールドマークを並べる矩形
 * @property {number} hitX 攻撃の兵が当たって止まる足元の x（`rect.x + rect.w × hit`）
 * @property {{ x: number, y: number }|null} mouth 炎が出る口の位置（口のない敵は null）
 * @property {{ x: number, y: number }} healText 敵の回復の量の文字の中心
 */

/**
 * 最上段（戦闘）の配置。クオータービュー（斜め上から見下ろした地面。地面は回さず、左に城、右に敵。
 * 兵の陣地は右から防御 → 城 → 攻撃 → 修理の並び）。
 * @typedef {Object} BattleLayout
 * @property {Rect} area 段全体
 * @property {Rect} castle 城の絵の矩形
 * @property {Rect} enemy ゴブリンの群れの矩形（絵を持たない敵のシールドマークの既定の並べ先・兵の当たる位置の基準でもある）
 * @property {Object<string, EnemyFigure>} enemyFigures 敵の種類の識別子 → 敵の絵の配置（凍結。絵を持たない敵は含まれない）
 * @property {Rect} phase 「フェーズ N」の枠
 * @property {Rect} castleHp 城の HP の枠
 * @property {Rect} enemyHp 敵の HP の枠
 * @property {Rect} intent 敵の次の行動の予告の枠
 * @property {Rect} countdown 数え下ろしの枠（段の右上）
 * @property {{ x: number, y: number }} enemyHealText 絵を持たない敵の回復の量の文字の中心（群れの矩形の上寄り）
 * @property {TroopLayout} troops 兵の配置
 * @property {{ box: Rect, iconSize: number, items: Array<{ iconX: number, iconY: number, textX: number, textY: number }> }} troopCounter 人数の表示の配置（枠・アイコンの大きさ・攻撃・防御・修理の順の各項目のアイコン中心と文字の左端・中心 y）
 * @property {{ x: number, titleY: number, nextY: number, hintY: number, maxW: number }} defeat 敵を倒したときの案内の位置（段の中央の x、「〜を倒した！」・「次は〜」・「タップで次へ」の y、文字の最大の幅）
 * @property {function(number, Rect=): Rect[]} shieldRects シールドマーク count 個の矩形（body の矩形の中の格子。body を省くと群れの矩形。最後の行は中央にそろえる）
 * @property {function(number): Array<{ x: number, footY: number, size: number, row: number }>} hordeSlots ゴブリンの兵 count 体の並び（番号の順。x は中心、footY は足元の y、size は兵の大きさ、row は行（0 が前＝地面））
 */

/**
 * 決着の表示（結果）の配置。
 * @typedef {Object} ResultLayout
 * @property {Rect} curtain 暗幕（画面全体）
 * @property {Rect} panel 結果の板（画面の中央）
 * @property {number} x 板の中央の x
 * @property {number} outcomeY 「クリア」「負け」の文字の中心 y
 * @property {number} labelX 見出しの左端 x（左寄せ）
 * @property {number} valueX 数字の右端 x（右寄せ）
 * @property {number} labelMaxW 見出しの最大の幅
 * @property {number} valueMaxW 数字の最大の幅
 * @property {function(number): number} rowY i 行目の数字の行の中心 y
 * @property {number} hintY 案内の中心 y
 * @property {number} maxW 大きな文字と案内の最大の幅
 */

/**
 * タイトル画面の配置。
 * @typedef {Object} TitleLayout
 * @property {{ width: number, height: number }} screen 画面の大きさ（背景を塗る範囲）
 * @property {{ x: number, y: number, maxW: number }} title ゲーム名の中心と最大の幅
 * @property {Rect} startButton 「はじめる」ボタンの矩形
 * @property {Rect} howToButton 「遊び方」ボタンの矩形
 * @property {number} startTextMaxW ボタン（はじめる・遊び方）の文字の最大の幅
 * @property {function(number, number): ('start'|'howTo'|null)} titleHitTest 座標から、ボタンに当たったものを返す
 */

/**
 * 遊び方の画面の配置。
 * @typedef {Object} HowToLayout
 * @property {{ width: number, height: number }} screen 画面の大きさ（背景を塗る範囲）
 * @property {{ x: number, y: number, maxW: number }} heading 見出しの左端・中心 y・最大の幅（左寄せ）
 * @property {{ x: number, y: number, maxW: number }} pageNumber ページ番号の右端・中心 y・最大の幅（右寄せ）
 * @property {{ x: number, y: number, w: number }} rule 区切り線の左端・y・長さ
 * @property {Rect} body 本文の範囲
 * @property {Rect} prevButton 「まえへ」ボタンの矩形
 * @property {Rect} backButton 「タイトルへ」ボタンの矩形
 * @property {Rect} nextButton 「つぎへ」ボタンの矩形
 * @property {number} buttonTextMaxW ボタンの文字の最大の幅
 * @property {function(number, number): ('prev'|'back'|'next'|null)} howToHitTest 座標から、ボタンに当たったものを返す（押せるかは見ない）
 */

/**
 * 盤面の配置。
 * @typedef {Object} Layout
 * @property {{ width: number, height: number }} screen 画面の大きさ
 * @property {{ battle: Rect, solitaire: Rect, ui: Rect }} sections 3段の領域（上から戦闘・ソリティア・UI）
 * @property {{ w: number, h: number }} card カードの幅と高さ
 * @property {Rect[]} decks 山札の領域
 * @property {Rect[]} gauges ゲージの枠（ソリティアの段の最上部の横1行。ゲージの並び順。押せない）
 * @property {Rect} discard 捨て札の領域
 * @property {ColumnLayout[]} columns 列の領域
 * @property {HandLayout} hand 手札の見出しと枠
 * @property {Rect[]} releaseButtons 放つボタンの領域
 * @property {HudLayout} hud 最下段（UI）
 * @property {BattleLayout} battle 最上段（戦闘）
 * @property {{ fastForward: Rect, skip: Rect }} battleControls 攻防の演出中の最下段の「早送り」「スキップ」の矩形（`hud.actionEnd` を左右に2分割）
 * @property {function(number, number): Rect[]} columnCardRects 列の番号と枚数から、下から順の各カードの矩形（長い列の詰めを含む）
 * @property {ResultLayout} result 決着の表示（結果）の配置
 * @property {function(number, number, number[]=): (Hit|null)} hitTest 座標（と列ごとのカードの枚数）から当たったものを返す
 * @property {function(number, number): ('fastForward'|'skip'|null)} battleHitTest 座標から、演出中のボタン（早送り・スキップ）に当たったものを返す
 */

/** 最上段（戦闘）の高さ。300〜480 の範囲で変えてよい。試遊で決め直す。 */
const BATTLE_H = 360;
/** 最下段（UI）の高さ（固定。行動の枠・行動終了の行がおさまる高さ） */
const UI_H = 144;
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
/** 城の絵の中心の x（段の左端から約 1/3。試遊で動かす1か所） */
const CASTLE_CX = 240;
/** 城の絵の高さ（大きさを変える1か所） */
const CASTLE_H = 190;
/** 敵の中心の x（ゴブリンの群れの矩形と、巨人・ドラゴンの絵の中心） */
const ENEMY_CX = 620;
/**
 * 敵の種類の識別子ごとの絵の設定。height は絵の高さ、shield はシールドマークを並べる矩形（絵の矩形に対する割合。
 * cx・cy は中心、w・h は幅・高さ）、hit は攻撃の兵が当たって止まる x の絵の矩形の幅に対する割合（左端から。試遊で決め直す）、
 * mouth は炎が出る位置の絵の矩形に対する割合 {x, y}（口のない敵は null。試遊で決め直す）。
 */
const ENEMY_FIGURES = Object.freeze({
  giant: Object.freeze({
    sprite: SPRITE_IDS.giant,
    height: 200,
    shield: Object.freeze({ cx: 0.41, cy: 0.39, w: 0.7, h: 0.3 }),
    hit: 0.15,
    mouth: null,
  }),
  dragon: Object.freeze({
    sprite: SPRITE_IDS.dragon,
    height: 200,
    shield: Object.freeze({ cx: 0.47, cy: 0.49, w: 0.6, h: 0.3 }),
    hit: 0.15,
    mouth: Object.freeze({ x: 0.03, y: 0.3 }),
  }),
});
/** 城の打撃のヒットマークを出す範囲の、城の絵の矩形に対する割合（x・y は左上、w・h は幅・高さ。試遊で決め直す） */
const CASTLE_HIT_AREA = Object.freeze({ x: 0.15, y: 0.3, w: 0.7, h: 0.5 });
/** 敵の回復の量の文字の中心 y の、絵（群れの矩形）の上端からの距離の、高さに対する割合 */
const ENEMY_HEAL_TEXT_RATIO = 0.15;
/** 敵の最大の大きさ */
const ENEMY_MAX_SIZE = 120;
/** 数え下ろしの枠の幅 */
const COUNTDOWN_W = 220;
/** 城の HP の枠の幅 */
const INFO_W = 240;
/** 敵の HP・予告の枠の幅（敵の名前が入るので城の枠より広い） */
const ENEMY_INFO_W = 340;
/** 地面の線と HP の枠の間隔 */
const INFO_GAP = 8;
/** HP の枠と予告の枠の間隔 */
const INFO_GAP_Y = 4;
/** 兵の大きさ（直径）。試遊で決め直す1か所 */
const TROOP_SIZE = 24;
/** 役割ごとの陣地の x と幅（段の左端からの絶対値。兵の足元の中心が入る範囲。試遊で動かす）。enemy は敵兵・敵の守りが共用する */
const TROOP_CAMPS_X = Object.freeze({
  heal: Object.freeze({ x: 20, w: 80 }),
  attack: Object.freeze({ x: 100, w: 90 }),
  defense: Object.freeze({ x: 300, w: 100 }),
  enemy: Object.freeze({ x: 470, w: 80 }),
});
/** 陣地の y の範囲の、地面の線から上へ取る長さ（試遊で決め直す） */
const CAMP_FOOT_ABOVE = 96;
/** 陣地の y の範囲の、地面の線から下へ取る長さ（試遊で決め直す） */
const CAMP_FOOT_BELOW = 2;
/** 相打ちの相手が前へ踏み出す距離（試遊で決め直す） */
const BLOCK_STEP_X = 30;
/** 相打ちでぶつかる2体の間隔（試遊で決め直す） */
const CONTACT_GAP = 20;
/** 相打ちの相手のいない攻撃の兵が進む距離（試遊で決め直す） */
const ATTACK_ADVANCE_X = 250;
/** 相打ちにならない敵兵が左へ進む距離（試遊で決め直す） */
const ENEMY_ADVANCE_X = 60;
/** 城に当たる位置の、城の右端からの内側への距離（試遊で決め直す） */
const CASTLE_HIT_INSET = 10;
/** 人数の表示の枠の幅 */
const TROOP_COUNTER_W = 230;
/** 人数の表示のアイコンの大きさ */
const TROOP_COUNTER_ICON = 24;
/** 人数の表示の枠の左右の余白 */
const TROOP_COUNTER_PAD_X = 10;
/** 人数の表示のアイコンと文字の間隔 */
const TROOP_COUNTER_TEXT_GAP = 4;
/** 人数の表示の項目の数（攻撃・防御・修理） */
const TROOP_COUNTER_ITEMS = 3;
/** 敵を倒したときの「〜を倒した！」の y の、段の高さに対する割合 */
const DEFEAT_TITLE_RATIO = 0.3;
/** 敵を倒したときの「次は〜」の y の、段の高さに対する割合 */
const DEFEAT_NEXT_RATIO = 0.5;
/** 敵を倒したときの「タップで次へ」の y の、段の高さに対する割合 */
const DEFEAT_HINT_RATIO = 0.7;
/** シールドマークの格子の1行の最大の個数 */
const SHIELD_COLS = 5;
/** シールドマークの大きさの、格子の1マスに対する割合 */
const SHIELD_FILL = 0.8;
/** ゴブリンの群れの行の数（前＝地面の行から奥へ。試遊で決め直す） */
const HORDE_ROWS = 5;
/** ゴブリンの群れの列の間隔（試遊で決め直す） */
const HORDE_COL_STEP = 14;
/** ゴブリンの群れの右端の列の足元の中心の x（試遊で決め直す） */
const HORDE_RIGHT_X = 690;
/** ゴブリンの群れの奥の行ごとの足元の上がりの、兵の大きさに対する割合 */
const HORDE_ROW_RISE = 0.7;

/** 最下段の行（行動の枠・行動終了）の上の余白 */
const UI_PAD_TOP = 16;
/** ゲージの枠の高さ */
const GAUGE_H = 64;
/** ゲージの行と、その下の山札の行の間のすき間 */
const GAUGE_GAP_Y = 12;
/** 横の間隔（ゲージの枠どうし、最下段の左の空きと行動終了の間、早送りとスキップの間） */
const UI_GAP_X = 12;
/** 最下段の左側の空き（何も置かない。Phase 4 のスキル用）の幅 */
const UI_LEFT_W = 200;
/** 行動終了の高さ */
const ACTION_END_H = 100;

/** タイトル画面のゲーム名の中心 y の、画面の高さに対する割合 */
const TITLE_TEXT_RATIO = 0.36;
/** タイトル画面の「はじめる」ボタンの幅 */
const TITLE_BUTTON_W = 360;
/** タイトル画面の「はじめる」ボタンの高さ */
const TITLE_BUTTON_H = 120;
/** タイトル画面の「はじめる」ボタンの上端 y の、画面の高さに対する割合 */
const TITLE_BUTTON_RATIO = 0.58;
/** 「はじめる」ボタンの文字の左右の余白 */
const TITLE_BUTTON_PAD_X = 24;
/** タイトル画面の「はじめる」と「遊び方」の間のすき間 */
const TITLE_HOWTO_GAP = 32;
/** タイトル画面の「遊び方」ボタンの高さ */
const TITLE_HOWTO_H = 96;

/** 遊び方の画面の左右の余白（本文・見出し・ボタンの列の左右の端） */
const HOWTO_PAD_X = 40;
/** 遊び方の画面の見出し・ページ番号の中心 y */
const HOWTO_HEADING_Y = 88;
/** 遊び方の画面のページ番号の最大の幅 */
const HOWTO_PAGE_NUMBER_W = 120;
/** 遊び方の画面の見出しとページ番号の間のすき間 */
const HOWTO_HEADING_GAP_X = 16;
/** 遊び方の画面の見出しの下の区切り線の y */
const HOWTO_RULE_Y = 140;
/** 遊び方の画面の本文の上端 y */
const HOWTO_BODY_TOP = 164;
/** 遊び方の画面の本文の下端とボタンの上端の間のすき間 */
const HOWTO_BODY_GAP = 24;
/** 遊び方の画面のボタンの高さ */
const HOWTO_BUTTON_H = 100;
/** 遊び方の画面のボタンの下の余白 */
const HOWTO_BOTTOM_PAD = 40;
/** 遊び方の画面のボタン同士の横の間隔 */
const HOWTO_BUTTON_GAP_X = 16;
/** 遊び方の画面のボタンの文字の左右の余白 */
const HOWTO_BUTTON_PAD_X = 12;

/** 結果の板の幅 */
const RESULT_PANEL_W = 600;
/** 結果の板の高さ */
const RESULT_PANEL_H = 620;
/** 板の上端から「クリア」「負け」の文字の中心までの距離 */
const RESULT_OUTCOME_DY = 110;
/** 結果の板の左右の余白 */
const RESULT_PAD_X = 40;
/** 結果の数字の欄の幅（右寄せ） */
const RESULT_VALUE_W = 140;
/** 板の上端から結果の最初の行の中心までの距離 */
const RESULT_ROW_TOP_DY = 230;
/** 結果の行どうしの間隔（中心から中心） */
const RESULT_ROW_GAP = 76;
/** 板の上端から「タップでタイトルへ」の中心までの距離 */
const RESULT_HINT_DY = 540;

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
 * 最上段（戦闘）の配置を作る。地面の基準は段の下端から GROUND_OFFSET 上、城・敵の絵はその上に足元をそろえて立つ。
 * 城の絵は CASTLE_CX、敵の中心は ENEMY_CX。巨人・ドラゴンの絵は ENEMY_FIGURES の表で大きさと
 * シールドマークの並べ先を決める。
 * @param {number} width 画面の幅
 * @returns {BattleLayout} 戦闘の段の配置
 */
function createBattleLayout(width) {
  const phase = { x: (width - PHASE_BOX_W) / 2, y: BATTLE_TOP_PAD, w: PHASE_BOX_W, h: BOX_H };
  const groundY = BATTLE_H - GROUND_OFFSET;
  const bodyTop = phase.y + phase.h + BODY_GAP;
  const enemySize = Math.min(ENEMY_MAX_SIZE, groundY - bodyTop);
  const infoY = groundY + INFO_GAP;
  const enemyHp = { x: width - SIDE_MARGIN - ENEMY_INFO_W, y: infoY, w: ENEMY_INFO_W, h: BOX_H };
  const area = { x: 0, y: 0, w: width, h: BATTLE_H };
  const castle = spriteFitRect(SPRITE_IDS.castle, CASTLE_CX, groundY, Math.min(CASTLE_H, groundY - bodyTop));
  const enemy = { x: ENEMY_CX - enemySize / 2, y: groundY - enemySize, w: enemySize, h: enemySize };
  const countdown = { x: width - SIDE_MARGIN - COUNTDOWN_W, y: BATTLE_TOP_PAD, w: COUNTDOWN_W, h: BOX_H };
  /** @type {Object<string, EnemyFigure>} */
  const enemyFigures = {};
  for (const [typeId, def] of Object.entries(ENEMY_FIGURES)) {
    const rect = spriteFitRect(
      def.sprite,
      ENEMY_CX,
      groundY,
      Math.min(def.height, groundY - (countdown.y + countdown.h)),
    );
    const sw = rect.w * def.shield.w;
    const sh = rect.h * def.shield.h;
    enemyFigures[typeId] = Object.freeze({
      sprite: def.sprite,
      rect,
      shieldArea: {
        x: rect.x + rect.w * def.shield.cx - sw / 2,
        y: rect.y + rect.h * def.shield.cy - sh / 2,
        w: sw,
        h: sh,
      },
      healText: { x: rect.x + rect.w / 2, y: rect.y + rect.h * ENEMY_HEAL_TEXT_RATIO },
      hitX: rect.x + rect.w * def.hit,
      mouth: def.mouth === null ? null : { x: rect.x + rect.w * def.mouth.x, y: rect.y + rect.h * def.mouth.y },
    });
  }
  Object.freeze(enemyFigures);
  const enemyHealText = { x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h * ENEMY_HEAL_TEXT_RATIO };

  const campTop = groundY - CAMP_FOOT_ABOVE;
  const campH = CAMP_FOOT_ABOVE + CAMP_FOOT_BELOW;
  /**
   * 役割の陣地の矩形を作る。
   * @param {{ x: number, w: number }} def TROOP_CAMPS_X の項目
   * @returns {Rect} 陣地の矩形
   */
  const campRect = (def) => ({ x: def.x, y: campTop, w: def.w, h: campH });
  /** @type {TroopLayout} */
  const troops = {
    size: TROOP_SIZE,
    camps: {
      attack: campRect(TROOP_CAMPS_X.attack),
      defense: campRect(TROOP_CAMPS_X.defense),
      heal: campRect(TROOP_CAMPS_X.heal),
      enemy: campRect(TROOP_CAMPS_X.enemy),
    },
    blockStepX: BLOCK_STEP_X,
    contactGap: CONTACT_GAP,
    attackAdvanceX: ATTACK_ADVANCE_X,
    enemyAdvanceX: ENEMY_ADVANCE_X,
    castleHitX: castle.x + castle.w - CASTLE_HIT_INSET,
    offscreenX: area.x + area.w + TROOP_SIZE,
    castleHitArea: {
      x: castle.x + castle.w * CASTLE_HIT_AREA.x,
      y: castle.y + castle.h * CASTLE_HIT_AREA.y,
      w: castle.w * CASTLE_HIT_AREA.w,
      h: castle.h * CASTLE_HIT_AREA.h,
    },
    castleEntryX: castle.x + castle.w / 2,
    fallOutY: BATTLE_H + TROOP_SIZE,
  };

  const counterBox = { x: SIDE_MARGIN, y: BATTLE_TOP_PAD, w: TROOP_COUNTER_W, h: BOX_H };
  const counterItemW = (counterBox.w - TROOP_COUNTER_PAD_X * 2) / TROOP_COUNTER_ITEMS;
  const counterItems = [];
  for (let i = 0; i < TROOP_COUNTER_ITEMS; i++) {
    const iconX = counterBox.x + TROOP_COUNTER_PAD_X + counterItemW * i + TROOP_COUNTER_ICON / 2;
    const centerY = counterBox.y + counterBox.h / 2;
    counterItems.push({
      iconX,
      iconY: centerY,
      textX: iconX + TROOP_COUNTER_ICON / 2 + TROOP_COUNTER_TEXT_GAP,
      textY: centerY,
    });
  }
  const troopCounter = { box: counterBox, iconSize: TROOP_COUNTER_ICON, items: counterItems };

  /**
   * シールドマーク count 個の矩形を求める。body の矩形の中に SHIELD_COLS 個ずつの格子で並べ、
   * 格子全体を body の矩形の中心にそろえる（最後の行が埋まらないときはその行を中央にそろえる）。
   * @param {number} count シールドマークの数（常時防御力）
   * @param {Rect} [body] 並べる先の矩形（省くと群れの矩形）
   * @returns {Rect[]} 各マークの矩形（左上の行から順。count が 0 以下なら空）
   */
  function shieldRects(count, body = enemy) {
    if (count <= 0) return [];
    const rows = Math.ceil(count / SHIELD_COLS);
    const cell = Math.min(body.w / SHIELD_COLS, body.h / rows);
    const size = cell * SHIELD_FILL;
    const top = body.y + (body.h - cell * rows) / 2;
    const rects = [];
    for (let r = 0; r < rows; r++) {
      const n = Math.min(SHIELD_COLS, count - r * SHIELD_COLS);
      const left = body.x + (body.w - cell * n) / 2;
      for (let i = 0; i < n; i++) {
        rects.push({ x: left + cell * i + (cell - size) / 2, y: top + cell * r + (cell - size) / 2, w: size, h: size });
      }
    }
    return rects;
  }

  /**
   * ゴブリンの兵の群れの並びを求める。i 番目の位置は i だけで決まり、数 count によらない
   * （番号の大きい方から減らせば、残りの位置は動かない）。HORDE_ROWS 行ずつ右端の列から左へ並べ、
   * 前の行（row 0）の足元が地面、奥の行ほど HORDE_ROW_RISE ずつ上げ、奇数の行は半列ずらす。
   * @param {number} count 兵の数
   * @returns {Array<{ x: number, footY: number, size: number, row: number }>} 番号の順の各兵（x は中心、footY は足元の y、size は兵の大きさ、row は行（0 が前＝地面）。count が 0 以下なら空）
   */
  function hordeSlots(count) {
    if (count <= 0) return [];
    const slots = [];
    for (let i = 0; i < count; i++) {
      const col = Math.floor(i / HORDE_ROWS);
      const row = i % HORDE_ROWS;
      slots.push({
        x: HORDE_RIGHT_X - col * HORDE_COL_STEP - (row % 2) * HORDE_COL_STEP / 2,
        footY: groundY - TROOP_SIZE * HORDE_ROW_RISE * row,
        size: TROOP_SIZE,
        row,
      });
    }
    return slots;
  }

  return {
    area,
    castle,
    enemy,
    phase,
    castleHp: { x: SIDE_MARGIN, y: infoY, w: INFO_W, h: BOX_H },
    enemyHp,
    intent: { x: enemyHp.x, y: enemyHp.y + BOX_H + INFO_GAP_Y, w: ENEMY_INFO_W, h: BOX_H },
    countdown,
    enemyFigures,
    enemyHealText,
    troops,
    troopCounter,
    defeat: {
      x: area.x + area.w / 2,
      titleY: area.y + area.h * DEFEAT_TITLE_RATIO,
      nextY: area.y + area.h * DEFEAT_NEXT_RATIO,
      hintY: area.y + area.h * DEFEAT_HINT_RATIO,
      maxW: area.w - SIDE_MARGIN * 2,
    },
    shieldRects,
    hordeSlots,
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
  const gaugeW = (W - SIDE_MARGIN * 2 - UI_GAP_X * (gaugeCount - 1)) / gaugeCount;
  const gaugeY = sections.solitaire.y + SOLITAIRE_PAD_TOP;
  const gauges = [];
  for (let i = 0; i < gaugeCount; i++) {
    gauges.push({ x: SIDE_MARGIN + (gaugeW + UI_GAP_X) * i, y: gaugeY, w: gaugeW, h: GAUGE_H });
  }
  const rowY = gaugeY + GAUGE_H + GAUGE_GAP_Y;
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

  const actionsY = sections.ui.y + UI_PAD_TOP;
  const actionEndX = SIDE_MARGIN + UI_LEFT_W + UI_GAP_X;
  /** @type {HudLayout} */
  const hud = {
    panel: sections.ui,
    actionEnd: { x: actionEndX, y: actionsY, w: W - SIDE_MARGIN - actionEndX, h: ACTION_END_H },
  };

  const battle = createBattleLayout(W);

  const controlW = (hud.actionEnd.w - UI_GAP_X) / 2;
  const battleControls = {
    fastForward: { x: hud.actionEnd.x, y: hud.actionEnd.y, w: controlW, h: hud.actionEnd.h },
    skip: { x: hud.actionEnd.x + controlW + UI_GAP_X, y: hud.actionEnd.y, w: controlW, h: hud.actionEnd.h },
  };

  /**
   * 座標から、演出中のボタン（早送り・スキップ）に当たったものを返す。
   * @param {number} x x 座標
   * @param {number} y y 座標
   * @returns {'fastForward'|'skip'|null} 当たったもの。なければ null
   */
  function battleHitTest(x, y) {
    if (inRect(battleControls.fastForward, x, y)) return 'fastForward';
    if (inRect(battleControls.skip, x, y)) return 'skip';
    return null;
  }

  /**
   * 列のカードの矩形を下から順に求める（`columnCardYs` を使うので長い列の詰めを含む）。
   * @param {number} c 列の番号
   * @param {number} count 列のカードの枚数
   * @returns {Rect[]} 下から数えた各カードの矩形（長さ count）
   */
  function columnCardRects(c, count) {
    const col = columns[c];
    return columnCardYs(col, count).map((y) => ({ x: col.x, y, w: col.cardW, h: col.cardH }));
  }

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

  const result = createResultLayout(screen);

  return { screen, sections, card: { w: cardW, h: cardH }, gauges, decks, discard, columns, hand, releaseButtons, hud, battle, battleControls, result, columnCardRects, hitTest, battleHitTest };
}

/**
 * 決着の表示（結果）の配置を作る。
 * @param {{ width: number, height: number }} screen 画面の大きさ
 * @returns {ResultLayout} 結果の表示の配置
 */
function createResultLayout(screen) {
  const W = screen.width;
  const H = screen.height;
  const panel = {
    x: (W - RESULT_PANEL_W) / 2,
    y: (H - RESULT_PANEL_H) / 2,
    w: RESULT_PANEL_W,
    h: RESULT_PANEL_H,
  };
  return {
    curtain: { x: 0, y: 0, w: W, h: H },
    panel,
    x: panel.x + panel.w / 2,
    outcomeY: panel.y + RESULT_OUTCOME_DY,
    labelX: panel.x + RESULT_PAD_X,
    valueX: panel.x + panel.w - RESULT_PAD_X,
    labelMaxW: panel.w - RESULT_PAD_X * 2 - RESULT_VALUE_W,
    valueMaxW: RESULT_VALUE_W,
    rowY: (i) => panel.y + RESULT_ROW_TOP_DY + RESULT_ROW_GAP * i,
    hintY: panel.y + RESULT_HINT_DY,
    maxW: panel.w - RESULT_PAD_X * 2,
  };
}

/**
 * タイトル画面の配置を作る。
 * @param {{ width: number, height: number }} screen 画面の大きさ
 * @returns {TitleLayout} タイトル画面の配置
 */
export function createTitleLayout(screen) {
  const W = screen.width;
  const H = screen.height;
  const startButton = {
    x: (W - TITLE_BUTTON_W) / 2,
    y: H * TITLE_BUTTON_RATIO,
    w: TITLE_BUTTON_W,
    h: TITLE_BUTTON_H,
  };

  const howToButton = {
    x: startButton.x,
    y: startButton.y + startButton.h + TITLE_HOWTO_GAP,
    w: TITLE_BUTTON_W,
    h: TITLE_HOWTO_H,
  };

  /**
   * 座標から、タイトル画面のボタンに当たったものを返す。
   * @param {number} x x 座標
   * @param {number} y y 座標
   * @returns {'start'|'howTo'|null} 当たったもの。なければ null
   */
  function titleHitTest(x, y) {
    if (inRect(startButton, x, y)) return 'start';
    return inRect(howToButton, x, y) ? 'howTo' : null;
  }

  return {
    screen,
    title: { x: W / 2, y: H * TITLE_TEXT_RATIO, maxW: W - SIDE_MARGIN * 2 },
    startButton,
    howToButton,
    startTextMaxW: TITLE_BUTTON_W - TITLE_BUTTON_PAD_X * 2,
    titleHitTest,
  };
}

/**
 * 遊び方の画面の配置を作る。
 * @param {{ width: number, height: number }} screen 画面の大きさ
 * @returns {HowToLayout} 遊び方の画面の配置
 */
export function createHowToLayout(screen) {
  const W = screen.width;
  const H = screen.height;
  const innerW = W - HOWTO_PAD_X * 2;
  const buttonW = (innerW - HOWTO_BUTTON_GAP_X * 2) / 3;
  const buttonY = H - HOWTO_BOTTOM_PAD - HOWTO_BUTTON_H;
  const button = (i) => ({
    x: HOWTO_PAD_X + (buttonW + HOWTO_BUTTON_GAP_X) * i,
    y: buttonY,
    w: buttonW,
    h: HOWTO_BUTTON_H,
  });
  const prevButton = button(0);
  const backButton = button(1);
  const nextButton = button(2);

  /**
   * 座標から、遊び方の画面のボタンに当たったものを返す（押せるかどうかは見ない）。
   * @param {number} x x 座標
   * @param {number} y y 座標
   * @returns {'prev'|'back'|'next'|null} 当たったもの。なければ null
   */
  function howToHitTest(x, y) {
    if (inRect(prevButton, x, y)) return 'prev';
    if (inRect(backButton, x, y)) return 'back';
    return inRect(nextButton, x, y) ? 'next' : null;
  }

  return {
    screen,
    heading: {
      x: HOWTO_PAD_X,
      y: HOWTO_HEADING_Y,
      maxW: innerW - HOWTO_PAGE_NUMBER_W - HOWTO_HEADING_GAP_X,
    },
    pageNumber: { x: W - HOWTO_PAD_X, y: HOWTO_HEADING_Y, maxW: HOWTO_PAGE_NUMBER_W },
    rule: { x: HOWTO_PAD_X, y: HOWTO_RULE_Y, w: innerW },
    body: {
      x: HOWTO_PAD_X,
      y: HOWTO_BODY_TOP,
      w: innerW,
      h: buttonY - HOWTO_BODY_GAP - HOWTO_BODY_TOP,
    },
    prevButton,
    backButton,
    nextButton,
    buttonTextMaxW: buttonW - HOWTO_BUTTON_PAD_X * 2,
    howToHitTest,
  };
}
