/**
 * 責務: 盤面の画面配置（戦闘の段の兵の陣地・敵の頭の上の予告の札・敵ごとの当たる位置・炎の出る位置・画面の外の x・城の打撃の範囲・人数の表示・城と敵の絵の矩形・群れの敵の群れの並び（種類ごとの大きさと範囲は hordePlaces.js の表）・敵を倒したときの案内（配置は defeatLayout.js に任せる）・最上部のゲージ・行動のゲージの帯とラベルを含む）を一手に持ち、座標から「何に当たるか」を求める。
 * 子を持つ敵の子の待つ場所（種類ごとの大きさと範囲は minionPlaces.js の表）も持つ。タイトル画面・遊び方の画面の配置と当たりも持つ。ルール層は import せず、数の情報は引数で受け取る。状態は変えない。絵の縦横比は spriteView.js から得る。絵の敵の配置の組み立ては enemyFigures.js に任せる。
 */

import { INTENT_CELL, SPRITE_IDS, spriteFitRect } from './spriteView.js';
import { campSlot } from './campSlots.js';
import { createEnemyFigures } from './enemyFigures.js';
import { createHordePlaces } from './hordePlaces.js';
import { MINION_PLACES, createMinionPlaces } from './minionPlaces.js';
import { handSlotRects } from './handLayout.js';
import { createDefeatLayout } from './defeatLayout.js';

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
 * 行動のゲージの配置（戦闘の段とソリティアの段の間の帯。押せない）。
 * @typedef {Object} ActionGaugeLayout
 * @property {Rect} band 帯（`sections.actionBar`）
 * @property {Rect[]} blocks ブロックの矩形（左から `actionBlockCount` 個。0 以下なら空）
 * @property {{x: number, y: number, size: number, statusGap: number}} label 帯の上の「ACTION POINT」のラベル（x は左端、y は中心、size は文字の大きさ px、statusGap はラベルと右の強化の表示の間 px）
 */

/**
 * 画面の最上部のゲージ（城と敵の HP・敵の名前と「疲弊」・戦闘ごとの TURN の番号・金貨）の配置。
 * @typedef {Object} TopGaugeLayout
 * @property {Rect} castleBar 城の HP ゲージ（右端が根元）
 * @property {Rect} enemyBar 敵の HP ゲージ（左端が根元）
 * @property {{ x: number, y: number }} castleValue 城の HP の数字の左端・中心 y
 * @property {{ x: number, y: number }} enemyValue 敵の HP の数字の右端・中心 y
 * @property {{ x: number, y: number, maxW: number }} enemyName 敵の名前とレベルの左端・中心 y・最大の幅（敵の HP ゲージの下）
 * @property {{ x: number, y: number }} fatigue 「疲弊」の右端・中心 y（敵の HP ゲージの下）
 * @property {{ x: number, y: number }} phaseLabel 「PHASE」の中心
 * @property {{ x: number, y: number }} phaseValue 戦闘ごとの TURN の番号の中心
 * @property {Rect} turnBox 「TURN」と番号を囲む区画の見た目の矩形（中央にそろえる）
 * @property {Rect} turnHit 「TURN」の区画の押せる範囲（`turnBox` より広い。中央にそろえる）
 * @property {Rect} coinBar 金貨のゲージ全体（城の HP ゲージの真下。右端は城の HP ゲージと同じで根元。左は「GOLD」の欄の分だけ狭い）
 * @property {{ x: number, y: number }} coinLabel 「GOLD」のラベルの右端 x・中心 y（右寄せで描く）
 * @property {Rect[]} coinBlocks 金貨のゲージのブロックの矩形（根元＝右端から順に `coinBlockCount` 個。0 以下なら空）
 * @property {function(number): Rect} coinBadge 根元から数えて i 番目の金貨のバッジの矩形（i がいくつでも返す）
 */

/**
 * 手札の配置。
 * @typedef {Object} HandLayout
 * @property {{ x: number, y: number }} title 見出し「手札」の文字の中心
 * @property {Rect} area 手札の場所（上の行の手札1枠分の矩形。1枠のときの枠の矩形）
 * @property {function(number): Rect[]} slotsFor 手札の枠の数から、各枠の矩形（枠の番号順＝奥 → 手前。1枠は `area` の写し、2枠以上は縮めて斜めに重ねる。`handLayout.js` の `handSlotRects`）
 */

/**
 * 当たり判定の結果。
 * `index` は山札・手札の枠・列・放つボタンの番号。`cardIndex` は列のときだけ意味を持ち、
 * 当たった列のカードの番号（下から数える。どのカードにも当たらなければ null）。
 * @typedef {{ kind: 'deck'|'hand'|'column'|'release', index: number, cardIndex?: (number|null) }} Hit
 */

/**
 * 戦闘の段での兵の配置。陣地は兵の足元の中心が入る矩形で、兵1体の大きさ・当たる位置・落ちて消える y を持つ。
 * @typedef {Object} TroopLayout
 * @property {number} size 兵の大きさ（直径）
 * @property {{ attack: Rect, defense: Rect, heal: Rect, enemy: Rect, enemyGuard: Rect, flame: Rect, minion?: Rect }} camps 役割ごとの陣地（enemy＝群れの敵の攻撃の兵、enemyGuard＝群れの敵の守りの兵、flame＝ブレスの炎。minion＝子の待つ場所で、子を持つ敵との攻防だけ）
 * @property {number} blockStepX 相打ちの相手が前へ踏み出す距離
 * @property {number} contactGap 相打ちでぶつかる2体の間隔（大きな体の敵は、体の大きさの差の半分だけ広げる）
 * @property {number} attackAdvanceX 相打ちの相手のいない攻撃の兵が進む距離
 * @property {number} enemyAdvanceX 相打ちにならない敵兵が左へ進む距離
 * @property {number} fieldTop 兵の足元の範囲（陣地と攻防の演出で兵が動く範囲）の上端の y
 * @property {number} fieldBottom 兵の足元の範囲の下端の y（groundY）
 * @property {number} contactTop 兵が城・敵に当たる・城に入るときの足元の y の上端（陣地での高さの割合のまま、この範囲へ縮めて当てる）
 * @property {number} contactBottom 兵が城・敵に当たる・城に入るときの足元の y の下端（陣地での高さの割合のまま、この範囲へ縮めて当てる）
 * @property {number} castleHitX 城に当たる位置の x（城の右端の少し内側）
 * @property {number} offscreenX 敵の側の兵が現れる・帰る画面の外の x（段の右端 + 兵の大きさ。大きな体の敵は、その大きさ）
 * @property {Rect} castleHitArea 城の打撃のヒットマークを出す範囲（城の絵の矩形の内側）
 * @property {number} castleEntryX 修理の兵・帰る兵が城に入って消える位置の x（城の中心）
 * @property {number} fallOutY 落ちる兵の足元がこれより下に来たら消える y（描く大きさが `size` より大きい兵は、その差だけ下へ延ばす）
 * @property {Object<string, number>} kindSizes 兵の種類 → 描く大きさ（直径。表にない種類・標準は空で、配置の兵の大きさのまま。子を持つ敵との攻防だけ minion・minionBorn）
 */

/**
 * 予告の札の大きさと、その下の数え下ろしの文字の配置。
 * @typedef {Object} IntentBadgeLayout
 * @property {number} h 札（板）の高さ
 * @property {number} padX 板の左右の余白
 * @property {number} iconW 予告の絵の幅
 * @property {number} gap 絵と量の数字の間
 * @property {number} sideGap 攻撃の側と防御の側の間
 * @property {number} edge 札と画面の右端（段の右端）の間
 * @property {number} countdownDy 札の上端から数え下ろしの文字の中心 y までの距離
 * @property {number} countdownMaxW 数え下ろしの文字の最大の幅
 */

/**
 * 最上段（戦闘）の配置。クオータービュー（斜め上から見下ろした地面。地面は回さず、左に城、右に敵。
 * 兵の陣地は右から防御 → 城 → 攻撃 → 修理の並び）。
 * @typedef {Object} BattleLayout
 * @property {Rect} area 段全体
 * @property {number} groundY 城・敵の絵の足元の y（地面の下端。兵を奥と手前に分けて描く境目）
 * @property {Rect} castle 城の絵の矩形
 * @property {Rect} enemy 標準の群れの敵（ゴブリン・骸骨）の群れの矩形（群れの兵の体が入る範囲）。いまは layout.js の中で敵の回復の文字の位置（`enemyHealText`）の基準にだけ使い、layout.js の外から読む箇所はない
 * @property {Object<string, import('./enemyFigures.js').EnemyFigure>} enemyFigures 敵の種類の識別子 → 敵の絵の配置（凍結。絵を持たない敵は含まれない）
 * @property {TopGaugeLayout} topGauges 画面の最上部のゲージ（城と敵の HP・敵の名前とレベル・戦闘ごとの TURN の番号・金貨）の配置
 * @property {{ x: number, y: number }} enemyHealText 絵を持たない敵の回復の量の文字の中心（群れの矩形の上寄り）
 * @property {import('./enemyFigures.js').IntentSpot} enemyIntent 絵を持たない敵（群れの敵）の予告の札の上端の基準（中央。右端からはみ出すときは左へ寄る。札の下端は人数の表示の枠の下端にそろう）
 * @property {IntentBadgeLayout} intentBadge 予告の札の大きさと数え下ろしの文字の配置
 * @property {TroopLayout} troops 兵の配置
 * @property {{ box: Rect, iconSize: number, items: Array<{ iconX: number, iconY: number, textX: number, textY: number }> }} troopCounter 人数の表示の配置（枠・アイコンの大きさ・攻撃・防御・修理の順の各項目のアイコン中心と文字の左端・中心 y）
 * @property {import('./defeatLayout.js').DefeatLayout} defeat 敵を倒したときの案内の配置（「〜を倒した！」・内訳の格子・合計・「タップで次へ」の位置。`defeatLayout.js` の `createDefeatLayout`）
 * @property {function(number, Rect): Rect[]} shieldRects シールドマーク count 個の矩形（body の矩形の中の格子。最後の行は中央にそろえる）
 * @property {Object<string, import('./hordePlaces.js').HordePlace>} hordePlaces 群れの敵の種類の識別子 → 体の大きさと並ぶ場所（凍結。焼き付けの大きさに troopView.js が読む）
 * @property {function(string, number): Array<{ x: number, footY: number, size: number }>} hordeSlots 群れの敵（識別子）の兵 count 体の並び（番号の順。x は中心、footY は足元の y、size はその敵の体の大きさ。その敵の群れの足元の範囲の中の R2 列。表にない識別子は Error）
 * @property {Object<string, import('./minionPlaces.js').MinionPlace>} minionPlaces 子を持つ敵の種類の識別子 → 子の大きさと待つ場所・生まれ出る位置（凍結。焼き付けの大きさに troopView.js が読む）
 * @property {function(string, number): Array<{ x: number, footY: number, size: number }>} minionSlots 子を持つ敵（識別子）の子 count 匹の並び（番号の順。x は中心、footY は足元の y、size は子の大きさ。待つ場所の中の R2 列で、番号だけで決まり数によらない。count が 0 以下なら空。表にない識別子は Error）
 * @property {function(string): TroopLayout} troopsFor その敵（識別子）との攻防で使う兵の配置（群れの配置も子の陣地も持たない敵・標準の敵は `troops` そのもの。子を持つ敵は子の陣地 `camps.minion` と大きさを足した写し）
 */

/**
 * タイトル画面の配置。
 * @typedef {Object} TitleLayout
 * @property {{ width: number, height: number }} screen 画面の大きさ（背景を塗る範囲）
 * @property {{ x: number, y: number, maxW: number }} title ゲーム名の中心と最大の幅
 * @property {Rect} startButton 「はじめる」ボタンの矩形
 * @property {Rect} howToButton 「遊び方」ボタンの矩形
 * @property {Rect} settingsButton 「設定」ボタンの矩形（「遊び方」の下）
 * @property {Rect|null} resumeButton 「再開」ボタンの矩形（「はじめる」の上。中断データがないときは null）
 * @property {number|null} resumeTextY 「再開」の文字の中心 y（ボタンがないときは null）
 * @property {number|null} resumePlaceY 「再開」の下の STAGE・TURN の文字の中心 y（ボタンがないときは null）
 * @property {number} startTextMaxW ボタン（再開・はじめる・遊び方・設定）の文字の最大の幅
 * @property {function(number, number): ('resume'|'start'|'howTo'|'settings'|null)} titleHitTest 座標から、ボタンに当たったものを返す（'resume' は「再開」ボタンがあるときだけ）
 */

/**
 * 遊び方の画面の配置。
 * @typedef {Object} HowToLayout
 * @property {{ width: number, height: number }} screen 画面の大きさ（背景を塗る範囲）
 * @property {{ x: number, y: number, maxW: number }} heading 見出しの左端・中心 y・最大の幅（左寄せ）
 * @property {{ x: number, y: number, maxW: number }} pageNumber ページ番号の右端・中心 y・最大の幅（右寄せ）
 * @property {{ x: number, y: number, w: number }} rule 区切り線の左端・y・長さ
 * @property {Rect} art 1〜3ページの絵の区画
 * @property {Rect} body 1〜3ページの本文の範囲（絵の区画の下）
 * @property {function(number): Array<{ art: Rect, text: Rect }>} enemyRows 4ページ目の敵ごとの段 count 個（上から順。art は左の絵の区画、text は右の文字の範囲。count が 0 以下なら空）
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
 * @property {{ battle: Rect, actionBar: Rect, solitaire: Rect }} sections 3つの領域（上から戦闘・行動のゲージの帯・ソリティア）
 * @property {{ w: number, h: number }} card カードの幅と高さ
 * @property {Rect[]} decks 山札の領域
 * @property {Rect} discard 捨て札の領域
 * @property {ColumnLayout[]} columns 列の領域
 * @property {HandLayout} hand 手札の見出しと枠
 * @property {Rect[]} releaseButtons 放つボタンの領域
 * @property {ActionGaugeLayout} actionGauge 行動のゲージの帯とブロックと帯の上のラベル
 * @property {BattleLayout} battle 最上段（戦闘）
 * @property {function(number, number): Rect[]} columnCardRects 列の番号と枚数から、下から順の各カードの矩形（長い列の詰めを含む）
 * @property {function(number, number, number[]=, number=): (Hit|null)} hitTest 座標（と列ごとのカードの枚数・手札の枠の数）から当たったものを返す
 * @property {function(number, number): boolean} turnHitTest 座標が最上部の「TURN」の区画の押せる範囲（`topGauges.turnHit`。右端・下端は含まない）に入るか（`hitTest` には混ぜない）
 */

/** 最上段（戦闘）の高さ。300〜480 の範囲で変えてよい。試遊で決め直す。 */
const BATTLE_H = 360;
/** 行動のゲージの帯（戦闘の段とソリティアの段の間）の高さ。試遊で決め直す。 */
const ACTION_BAR_H = 36;
/** 行動のゲージの帯の中のブロックの上下の余白。試遊で決め直す。 */
const ACTION_BLOCK_PAD_Y = 6;
/** 行動のゲージのブロックどうしの間。試遊で決め直す。 */
const ACTION_BLOCK_GAP = 8;
/** 行動のゲージの帯の上端から「ACTION POINT」のラベルの中心までの上への距離（戦闘の段に少しはみ出す）。試遊で決め直す。 */
const ACTION_LABEL_DY = 4;
/** 「ACTION POINT」のラベルの文字の大きさ（px）。試遊で決め直す。 */
const ACTION_LABEL_SIZE = 14;
/** 「ACTION POINT」のラベルと、その右の強化の表示（「+1(10%)」など）の間（px）。試遊で決め直す。 */
const ACTION_STATUS_GAP = 8;
/** 画面の上端から最上部の HP ゲージの上端までの距離。試遊で決め直す。 */
const TOP_GAUGE_Y = 8;
/** HP ゲージの太さ（変える1か所）。試遊で決め直す。 */
const HP_GAUGE_H = 20;
/** 左右の HP ゲージの間の「PHASE」の欄の幅。試遊で決め直す。 */
const TOP_GAUGE_CENTER_W = 100;
/** HP の数字の、ゲージの外側の端から内側への距離。試遊で決め直す。 */
const HP_VALUE_INSET = 8;
/** 敵の名前・「疲弊」の行の中心 y（敵の HP ゲージの下）。試遊で決め直す。 */
const ENEMY_LABEL_Y = 44;
/** 敵の名前の最大の幅。試遊で決め直す。 */
const ENEMY_NAME_MAX_W = 220;
/** 「PHASE」の文字の中心 y。試遊で決め直す。 */
const PHASE_LABEL_Y = 16;
/** フェーズの番号の中心 y。試遊で決め直す。 */
const PHASE_VALUE_Y = 42;
/** 「TURN」の区画の見た目の幅（中央にそろえる）。試遊で決め直す。 */
const TURN_BOX_W = 84;
/** 「TURN」の区画の見た目の高さ。試遊で決め直す。 */
const TURN_BOX_H = 58;
/** 「TURN」の区画の見た目の上端 y。試遊で決め直す。 */
const TURN_BOX_Y = 2;
/** 「TURN」の区画の押せる範囲の幅（中央にそろえる。見た目より広い）。試遊で決め直す。 */
const TURN_HIT_W = 120;
/** 「TURN」の区画の押せる範囲の高さ。試遊で決め直す。 */
const TURN_HIT_H = 88;
/** 「TURN」の区画の押せる範囲の上端 y。試遊で決め直す。 */
const TURN_HIT_Y = 0;
/** 城の HP ゲージと金貨のゲージの間。試遊で決め直す。 */
const COIN_GAUGE_GAP_Y = 4;
/** 金貨のゲージの太さ。試遊で決め直す。 */
const COIN_GAUGE_H = 10;
/** 金貨のゲージとバッジの間。試遊で決め直す。 */
const COIN_BADGE_GAP_Y = 4;
/** 金貨のゲージの左に取る「GOLD」のラベルの欄の幅（その分だけゲージが狭くなる）。試遊で決め直す。 */
const COIN_LABEL_W = 52;
/** 「GOLD」のラベルの右端と金貨のゲージの左端の間。試遊で決め直す。 */
const COIN_LABEL_GAP_X = 6;
/** 金貨のゲージのブロックどうしの間。試遊で決め直す。 */
const COIN_BLOCK_GAP_X = 4;
/** 金貨のバッジの直径。試遊で決め直す。 */
const COIN_BADGE_SIZE = 12;
/** 金貨のバッジどうしの間。試遊で決め直す。 */
const COIN_BADGE_GAP_X = 4;
/** 最上部のゲージの下端の y（金貨のバッジの下端）。ほかの定数から求める */
const TOP_GAUGES_BOTTOM = TOP_GAUGE_Y + HP_GAUGE_H + COIN_GAUGE_GAP_Y + COIN_GAUGE_H + COIN_BADGE_GAP_Y + COIN_BADGE_SIZE;
/** 左右の余白 */
const SIDE_MARGIN = 20;
/** 上の行のカードの横の間隔 */
const ROW_GAP_X = 16;
/** 上の行（山札・捨て札・手札の場所）の手札の場所の数。手札の枠の数によらず1枠分で、2枠以上は場所の中に縮めて重ねる。 */
const HAND_ROW_SLOTS = 1;
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

/** 城・敵の絵の大きさの上限を求める基準（今までの枠の行の高さ。絵の大きさを変えないために残す）。人数の表示の枠の高さにも使う。 */
const BOX_H = 40;
/** 城・敵の絵の大きさの上限を求める基準（今までの枠の行の上の余白。絵の大きさを変えないために残す） */
const BATTLE_TOP_PAD = 12;
/** 地面の下端（城・敵の絵の足元・兵の足元の範囲の下端。groundY）から段の下端までの距離。試遊で決め直す。 */
const GROUND_OFFSET = 25;
/** 城・敵の絵の大きさの上限を求める基準（今までの枠の行の下端と城の上端の最小の間隔。絵の大きさを変えないために残す） */
const BODY_GAP = 16;
/** 城の絵の中心の x（段の左端から約 1/3。試遊で動かす1か所） */
const CASTLE_CX = 240;
/** 城の絵の高さ（大きさを変える1か所） */
const CASTLE_H = 190;
/** 敵の中心の x（絵の敵の絵の中心） */
const ENEMY_CX = 620;
/** 城の打撃のヒットマークを出す範囲の、城の絵の矩形に対する割合（x・y は左上、w・h は幅・高さ。試遊で決め直す） */
const CASTLE_HIT_AREA = Object.freeze({ x: 0.15, y: 0.3, w: 0.7, h: 0.5 });
/** 敵の回復の量の文字の中心 y の、絵（群れの矩形）の上端からの距離の、高さに対する割合 */
const ENEMY_HEAL_TEXT_RATIO = 0.15;
/** 群れの敵の予告の札の中心の、群れの矩形の右端（足元の範囲の右端）から左への距離。試遊で決め直す。 */
const HORDE_INTENT_DX = 40;
/** 予告の札（板）の左右の余白。試遊で決め直す。 */
const INTENT_PAD_X = 6;
/** 予告の札（板）の上下の余白。試遊で決め直す。 */
const INTENT_PAD_Y = 2;
/** 予告の札の絵と量の数字の間。試遊で決め直す。 */
const INTENT_GAP_X = 4;
/** 予告の札の攻撃の側と防御の側の間。試遊で決め直す。 */
const INTENT_SIDE_GAP_X = 10;
/** 予告の札と画面の右端の間（札がはみ出さないための余白）。試遊で決め直す。 */
const INTENT_EDGE_X = 8;
/** 札の板の下端と数え下ろしの文字の行の上端の間。試遊で決め直す。 */
const INTENT_COUNTDOWN_GAP_Y = 2;
/**
 * 数え下ろしの文字の行の高さ。`intentView.js` の数え下ろしの文字の大きさ（20px）と合わせること
 * （片方だけ変えると文字の位置がずれる）。試遊で決め直す。
 */
const INTENT_COUNTDOWN_LINE_H = 20;
/** 数え下ろしの文字の最大の幅。試遊で決め直す。 */
const INTENT_COUNTDOWN_MAX_W = 200;
/** 兵の大きさ（直径）。試遊で決め直す1か所 */
const TROOP_SIZE = 24;
/**
 * 役割ごとの陣地の x と幅（段の左端からの絶対値。兵の足元の中心が入る範囲。試遊で動かす）。
 * enemy は群れの敵の攻撃の兵、enemyGuard は群れの敵の守りの兵（並んだとき重ならないよう、間を兵の大きさ以上空ける）、flame はブレスの炎。
 * ここは標準（ゴブリン・骸骨）の値で、大きさの違う群れの敵（オーガ）は hordePlaces.js の表の陣地を使う。
 */
const TROOP_CAMPS_X = Object.freeze({
  heal: Object.freeze({ x: 20, w: 80 }),
  attack: Object.freeze({ x: 100, w: 90 }),
  defense: Object.freeze({ x: 300, w: 100 }),
  enemy: Object.freeze({ x: 455, w: 45 }),
  enemyGuard: Object.freeze({ x: 525, w: 35 }),
  flame: Object.freeze({ x: 470, w: 80 }),
});
/** 兵の足元の範囲（陣地と攻防の演出で兵が動く範囲）の、groundY から上への高さ（上端は背景の地面の上端（約 y 125）より約 20px 下。試遊で決め直す） */
const FIELD_H = 190;
/** 兵が城・敵に当たる・城に入るときの足元の y の範囲の、groundY から上への長さ（下端は groundY。試遊で決め直す） */
const CONTACT_FOOT_ABOVE = 40;
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
/** 最上部のゲージの下端と人数の表示の枠の上端の間。試遊で決め直す。 */
const TROOP_COUNTER_GAP_Y = 6;
/** 人数の表示の枠の幅（数 3桁 + 精鋭の上振れ「+99」が項目に収まる幅。右端は x 298。TURN の見た目の区画（turnBox）とは重ならない。押せる範囲 turnHit（x 210〜330・y 0〜88）とは一部重なるが、人数の表示は押せない部品）。試遊で決め直す。 */
const TROOP_COUNTER_W = 278;
/** 人数の表示のアイコンの大きさ */
const TROOP_COUNTER_ICON = 24;
/** 人数の表示の枠の左右の余白。試遊で決め直す。 */
const TROOP_COUNTER_PAD_X = 6;
/** 人数の表示のアイコンと文字の間隔 */
const TROOP_COUNTER_TEXT_GAP = 4;
/** 人数の表示の項目の数（攻撃・防御・修理） */
const TROOP_COUNTER_ITEMS = 3;
/** シールドマークの格子の1行の最大の個数 */
const SHIELD_COLS = 5;
/** シールドマークの大きさの、格子の1マスに対する割合 */
const SHIELD_FILL = 0.8;
/** 群れの敵（標準の大きさ）の群れの足元の中心が入る範囲の x と幅（段の左端からの絶対値。縦は兵の足元の範囲いっぱい。試遊で決め直す） */
const HORDE_AREA_X = Object.freeze({ x: 580, w: 110 });

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
/** タイトル画面の「再開」ボタンの高さ（「再開」と、その下の STAGE・TURN の2行が入る） */
const TITLE_RESUME_H = 140;
/** 「再開」ボタンの上端から「再開」の文字の中心 y までの距離 */
const TITLE_RESUME_LABEL_DY = 50;
/** 「再開」ボタンの上端から STAGE・TURN の文字の中心 y までの距離 */
const TITLE_RESUME_PLACE_DY = 104;

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
/** 遊び方の画面の中身（1〜3ページの絵の区画・4ページの敵ごとの段の並び）の上端 y */
const HOWTO_BODY_TOP = 164;
/** 遊び方の1〜3ページの絵の区画の高さ */
const HOWTO_ART_H = 320;
/** 遊び方の1〜3ページの絵の区画の下端と本文の上端の間のすき間 */
const HOWTO_ART_GAP = 24;
/** 遊び方の4ページ目の敵ごとの段の間のすき間 */
const HOWTO_ROW_GAP_Y = 24;
/** 遊び方の4ページ目の段の左の絵の区画の幅 */
const HOWTO_ROW_ART_W = 180;
/** 遊び方の4ページ目の段の絵の区画と文字の範囲の間のすき間 */
const HOWTO_ROW_GAP_X = 16;
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
 * 画面の最上部のゲージの配置を作る。城の HP ゲージは中央の「PHASE」の欄の左（右端が根元）、
 * 敵の HP ゲージは右（左端が根元）で、長さは同じ。金貨のゲージは城の HP ゲージの真下に置き、
 * 右端（根元）は同じ位置のまま、左に「GOLD」のラベルの欄を取って狭める。ゲージは coinBlockCount 個の
 * ブロックに分け、根元から順に並べる。その下に赤い丸のバッジを根元から左へ並べる。
 * @param {number} width 画面の幅
 * @param {number} coinBlockCount 金貨のゲージのブロックの数（0 以下なら空）
 * @returns {TopGaugeLayout} 最上部のゲージの配置
 */
function createTopGaugeLayout(width, coinBlockCount) {
  const barW = width / 2 - TOP_GAUGE_CENTER_W / 2 - SIDE_MARGIN;
  const castleBar = { x: SIDE_MARGIN, y: TOP_GAUGE_Y, w: barW, h: HP_GAUGE_H };
  const enemyBar = { x: width / 2 + TOP_GAUGE_CENTER_W / 2, y: TOP_GAUGE_Y, w: barW, h: HP_GAUGE_H };
  const coinBar = {
    x: castleBar.x + COIN_LABEL_W,
    y: castleBar.y + castleBar.h + COIN_GAUGE_GAP_Y,
    w: castleBar.w - COIN_LABEL_W,
    h: COIN_GAUGE_H,
  };
  const blockN = Math.max(0, Math.floor(coinBlockCount));
  const blockW = (coinBar.w - COIN_BLOCK_GAP_X * (blockN - 1)) / blockN;
  /** @type {Rect[]} */
  const coinBlocks = [];
  for (let i = 0; i < blockN; i++) {
    coinBlocks.push({
      x: coinBar.x + coinBar.w - (i + 1) * blockW - i * COIN_BLOCK_GAP_X,
      y: coinBar.y,
      w: blockW,
      h: coinBar.h,
    });
  }
  /**
   * 根元（中央の側）から数えて i 番目の金貨のバッジの矩形を返す。
   * @param {number} i 根元からの番号（0 から）
   * @returns {Rect} バッジの矩形
   */
  const coinBadge = (i) => ({
    x: coinBar.x + coinBar.w - COIN_BADGE_SIZE - i * (COIN_BADGE_SIZE + COIN_BADGE_GAP_X),
    y: coinBar.y + coinBar.h + COIN_BADGE_GAP_Y,
    w: COIN_BADGE_SIZE,
    h: COIN_BADGE_SIZE,
  });
  return {
    castleBar,
    enemyBar,
    castleValue: { x: castleBar.x + HP_VALUE_INSET, y: castleBar.y + castleBar.h / 2 },
    enemyValue: { x: enemyBar.x + enemyBar.w - HP_VALUE_INSET, y: enemyBar.y + enemyBar.h / 2 },
    enemyName: { x: enemyBar.x, y: ENEMY_LABEL_Y, maxW: ENEMY_NAME_MAX_W },
    fatigue: { x: enemyBar.x + enemyBar.w, y: ENEMY_LABEL_Y },
    phaseLabel: { x: width / 2, y: PHASE_LABEL_Y },
    phaseValue: { x: width / 2, y: PHASE_VALUE_Y },
    turnBox: { x: (width - TURN_BOX_W) / 2, y: TURN_BOX_Y, w: TURN_BOX_W, h: TURN_BOX_H },
    turnHit: { x: (width - TURN_HIT_W) / 2, y: TURN_HIT_Y, w: TURN_HIT_W, h: TURN_HIT_H },
    coinBar,
    coinLabel: { x: coinBar.x - COIN_LABEL_GAP_X, y: coinBar.y + coinBar.h / 2 },
    coinBlocks,
    coinBadge,
  };
}

/**
 * 最上段（戦闘）の配置を作る。地面の下端（groundY）は段の下端から GROUND_OFFSET 上、城・敵の絵はその上に足元をそろえて立つ。
 * 兵の足元の範囲は groundY から FIELD_H 上まで。
 * 城の絵は CASTLE_CX、絵の敵の絵の中心は ENEMY_CX、群れの敵の群れは種類ごとの範囲（標準は HORDE_AREA_X。大きさの違う敵は hordePlaces.js の表）。絵の敵の絵の配置は enemyFigures.js の表で決める。
 * @param {number} width 画面の幅
 * @param {number} coinBlockCount 金貨のゲージのブロックの数
 * @returns {BattleLayout} 戦闘の段の配置
 */
function createBattleLayout(width, coinBlockCount) {
  const groundY = BATTLE_H - GROUND_OFFSET;
  const bodyTop = BATTLE_TOP_PAD + BOX_H + BODY_GAP;
  const area = { x: 0, y: 0, w: width, h: BATTLE_H };
  const castle = spriteFitRect(SPRITE_IDS.castle, CASTLE_CX, groundY, Math.min(CASTLE_H, groundY - bodyTop));
  /** 標準の群れの敵（ゴブリン・骸骨）の群れの足元の中心が入る範囲 */
  const hordeArea = { x: HORDE_AREA_X.x, y: groundY - FIELD_H, w: HORDE_AREA_X.w, h: FIELD_H };
  /** 標準の群れの敵（ゴブリン・骸骨）の群れの兵の体が入る矩形 */
  const enemy = {
    x: hordeArea.x - TROOP_SIZE / 2,
    y: hordeArea.y - TROOP_SIZE,
    w: hordeArea.w + TROOP_SIZE,
    h: hordeArea.h + TROOP_SIZE,
  };
  const counterBox = { x: SIDE_MARGIN, y: TOP_GAUGES_BOTTOM + TROOP_COUNTER_GAP_Y, w: TROOP_COUNTER_W, h: BOX_H };
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
  const intentBadgeH = INTENT_CELL.h + INTENT_PAD_Y * 2;
  const intentBadge = {
    h: intentBadgeH,
    padX: INTENT_PAD_X,
    iconW: INTENT_CELL.w,
    gap: INTENT_GAP_X,
    sideGap: INTENT_SIDE_GAP_X,
    edge: INTENT_EDGE_X,
    countdownDy: intentBadgeH + INTENT_COUNTDOWN_GAP_Y + INTENT_COUNTDOWN_LINE_H / 2,
    countdownMaxW: INTENT_COUNTDOWN_MAX_W,
  };
  /** 予告の札の上端の y（札の下端を人数の表示の枠の下端にそろえる。絵の敵のうち gap が null の敵（巨人・ドラゴン）と群れの敵では同じ高さ。gap を持つ背の低い絵の敵は絵の上端から決める） */
  const intentTop = counterBox.y + counterBox.h - intentBadge.h;
  const enemyFigures = createEnemyFigures({
    groundY,
    centerX: ENEMY_CX,
    maxHeight: groundY - (BATTLE_TOP_PAD + BOX_H),
    intentTop,
    badgeH: intentBadge.h,
    healTextRatio: ENEMY_HEAL_TEXT_RATIO,
  });
  const enemyHealText = { x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h * ENEMY_HEAL_TEXT_RATIO };
  const enemyIntent = { x: HORDE_AREA_X.x + HORDE_AREA_X.w - HORDE_INTENT_DX, y: intentTop };

  const campTop = groundY - FIELD_H;
  const campH = FIELD_H;
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
      enemyGuard: campRect(TROOP_CAMPS_X.enemyGuard),
      flame: campRect(TROOP_CAMPS_X.flame),
    },
    blockStepX: BLOCK_STEP_X,
    contactGap: CONTACT_GAP,
    attackAdvanceX: ATTACK_ADVANCE_X,
    enemyAdvanceX: ENEMY_ADVANCE_X,
    fieldTop: groundY - FIELD_H,
    fieldBottom: groundY,
    contactTop: groundY - CONTACT_FOOT_ABOVE,
    contactBottom: groundY,
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
    kindSizes: {},
  };

  /** 群れの敵の標準の大きさと3つの範囲（標準の行はこのオブジェクトをそのまま持つ） */
  const standardPlace = Object.freeze({
    size: TROOP_SIZE,
    area: hordeArea,
    camps: Object.freeze({ enemy: troops.camps.enemy, enemyGuard: troops.camps.enemyGuard }),
  });
  const hordePlaces = createHordePlaces({ groundY, fieldH: FIELD_H, standard: standardPlace });
  /** 敵の種類の識別子 → その敵との攻防で使う兵の配置（標準の行は `troops` そのもの。作るときに1回だけ作る） */
  const troopsByType = {};
  for (const typeId of Object.keys(hordePlaces)) {
    const place = hordePlaces[typeId];
    if (place === standardPlace) {
      troopsByType[typeId] = troops;
      continue;
    }
    troopsByType[typeId] = Object.freeze({
      ...troops,
      camps: Object.freeze({ ...troops.camps, enemy: place.camps.enemy, enemyGuard: place.camps.enemyGuard }),
      kindSizes: Object.freeze({ enemy: place.size, enemyGuard: place.size }),
      contactGap: CONTACT_GAP + (place.size - TROOP_SIZE) / 2,
      offscreenX: area.x + area.w + Math.max(TROOP_SIZE, place.size),
    });
  }

  /**
   * シールドマーク count 個の矩形を求める。body の矩形の中に SHIELD_COLS 個ずつの格子で並べ、
   * 格子全体を body の矩形の中心にそろえる（最後の行が埋まらないときはその行を中央にそろえる）。
   * @param {number} count シールドマークの数（敵の防御の量）
   * @param {Rect} body 並べる先の矩形（絵を持つ敵の `shieldArea`）
   * @returns {Rect[]} 各マークの矩形（左上の行から順。count が 0 以下なら空）
   */
  function shieldRects(count, body) {
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
   * 群れの敵の兵の群れの並びを求める。i 番目の位置は i だけで決まり、数 count によらない
   * （番号の大きい方から減らせば、残りの位置は動かない）。その敵の群れの足元の範囲の中を、
   * 味方の兵と同じ R2 列（campSlot。乱数なし）でばらけさせる。
   * @param {string} typeId 敵の種類の識別子（`HORDE_PLACES` にあるもの）
   * @param {number} count 兵の数
   * @returns {Array<{ x: number, footY: number, size: number }>} 番号の順の各兵（x は中心、footY は足元の y、size はその敵の体の大きさ。count が 0 以下なら空）
   * @throws {Error} 表にない識別子のとき
   */
  function hordeSlots(typeId, count) {
    if (!Object.prototype.hasOwnProperty.call(hordePlaces, typeId)) {
      throw new Error(`hordeSlots: 群れの配置を持たない敵 ${typeId}`);
    }
    const place = hordePlaces[typeId];
    if (count <= 0) return [];
    const slots = [];
    for (let i = 0; i < count; i++) {
      const p = campSlot(place.area, i);
      slots.push({ x: p.x, footY: p.y, size: place.size });
    }
    return slots;
  }

  /** 子を持つ敵の種類ごとの子の大きさと待つ場所・生まれ出る位置 */
  const minionPlaces = createMinionPlaces({ groundY, fieldH: FIELD_H, figures: enemyFigures });
  for (const typeId of Object.keys(MINION_PLACES)) {
    const place = minionPlaces[typeId];
    const base = Object.prototype.hasOwnProperty.call(troopsByType, typeId) ? troopsByType[typeId] : troops;
    troopsByType[typeId] = Object.freeze({
      ...base,
      camps: Object.freeze({ ...base.camps, minion: place.area }),
      kindSizes: Object.freeze({ ...base.kindSizes, minion: place.size, minionBorn: place.size }),
    });
  }

  /**
   * 子を持つ敵の子の並びを求める。i 番目の位置は i だけで決まり、数 count によらない
   * （待つ場所の中を、味方の兵と同じ R2 列（campSlot。乱数なし）でばらけさせる）。
   * @param {string} typeId 敵の種類の識別子（`MINION_PLACES` にあるもの）
   * @param {number} count 子の数
   * @returns {Array<{ x: number, footY: number, size: number }>} 番号の順の各子（count が 0 以下なら空）
   * @throws {Error} 表にない識別子のとき
   */
  function minionSlots(typeId, count) {
    if (!Object.prototype.hasOwnProperty.call(minionPlaces, typeId)) {
      throw new Error(`minionSlots: 子の配置を持たない敵 ${typeId}`);
    }
    const place = minionPlaces[typeId];
    if (count <= 0) return [];
    const slots = [];
    for (let i = 0; i < count; i++) {
      const p = campSlot(place.area, i);
      slots.push({ x: p.x, footY: p.y, size: place.size });
    }
    return slots;
  }

  /**
   * その敵との攻防で使う兵の配置を返す（群れの配置も子の陣地も持たない敵と標準の敵は `troops` そのもの。子を持つ敵は子の陣地 `camps.minion` と大きさ `kindSizes` を足した写し）。
   * @param {string} typeId 敵の種類の識別子
   * @returns {TroopLayout} 兵の配置
   */
  function troopsFor(typeId) {
    return Object.prototype.hasOwnProperty.call(troopsByType, typeId) ? troopsByType[typeId] : troops;
  }

  return {
    area,
    groundY,
    castle,
    enemy,
    topGauges: createTopGaugeLayout(width, coinBlockCount),
    enemyFigures,
    enemyHealText,
    enemyIntent,
    intentBadge,
    troops,
    troopCounter,
    defeat: createDefeatLayout(area, SIDE_MARGIN),
    shieldRects,
    hordePlaces,
    hordeSlots,
    minionPlaces,
    minionSlots,
    troopsFor,
  };
}

/**
 * 盤面の配置を作る。
 * @param {Object} params 引数
 * @param {{ width: number, height: number }} params.screen 画面の大きさ
 * @param {number} params.deckCount 山札の数
 * @param {number} params.columnCount 列の数
 * @param {number} params.actionBlockCount 行動のゲージのブロックの数（シーンがルール層の基本の行動回数を渡す）
 * @param {number} params.coinBlockCount 金貨のゲージのブロックの数（シーンがルール層の力こぶの換算の per を渡す）
 * @returns {Layout} 配置
 */
export function createLayout({ screen, deckCount, columnCount, actionBlockCount, coinBlockCount }) {
  const W = screen.width;
  const H = screen.height;
  const sections = {
    battle: { x: 0, y: 0, w: W, h: BATTLE_H },
    actionBar: { x: 0, y: BATTLE_H, w: W, h: ACTION_BAR_H },
    solitaire: { x: 0, y: BATTLE_H + ACTION_BAR_H, w: W, h: H - BATTLE_H - ACTION_BAR_H },
  };

  const blockCount = Math.max(0, actionBlockCount);
  const blockW = (W - SIDE_MARGIN * 2 - ACTION_BLOCK_GAP * (blockCount - 1)) / blockCount;
  const blocks = [];
  for (let i = 0; i < blockCount; i++) {
    blocks.push({
      x: SIDE_MARGIN + (blockW + ACTION_BLOCK_GAP) * i,
      y: sections.actionBar.y + ACTION_BLOCK_PAD_Y,
      w: blockW,
      h: sections.actionBar.h - ACTION_BLOCK_PAD_Y * 2,
    });
  }
  /** @type {ActionGaugeLayout} */
  const actionGauge = {
    band: sections.actionBar,
    blocks,
    label: { x: SIDE_MARGIN, y: sections.actionBar.y - ACTION_LABEL_DY, size: ACTION_LABEL_SIZE, statusGap: ACTION_STATUS_GAP },
  };

  // カードの大きさは、上の行（山札・捨て札・手札の場所）が横幅に並ぶことから決める（手札の枠の数によらない）
  const n = deckCount + 1 + HAND_ROW_SLOTS;
  const cardW = Math.floor((W - SIDE_MARGIN * 2 - ROW_GAP_X * (n - 1)) / n);
  const cardH = Math.round(cardW * CARD_ASPECT);
  const rowY = sections.solitaire.y + SOLITAIRE_PAD_TOP;
  /**
   * 上の行（山札・捨て札・手札の場所）の i 番目のカードの左端 x を返す。
   * @param {number} i 上の行での左からの番号
   * @returns {number} 左端 x
   */
  const rowX = (i) => SIDE_MARGIN + (cardW + ROW_GAP_X) * i;

  const decks = [];
  for (let i = 0; i < deckCount; i++) decks.push({ x: rowX(i), y: rowY, w: cardW, h: cardH });
  const discard = { x: rowX(deckCount), y: rowY, w: cardW, h: cardH };

  const handArea = { x: rowX(deckCount + 1), y: rowY, w: cardW, h: cardH };
  /** @type {HandLayout} */
  const hand = {
    title: { x: handArea.x + cardW / 2, y: rowY + cardH + LABEL_LINE_H / 2 },
    area: handArea,
    slotsFor: (count) => handSlotRects(handArea, count),
  };

  const columnTop = rowY + cardH + LABEL_LINE_H + ROW_GAP_Y;
  const releaseY = sections.solitaire.y + sections.solitaire.h - SOLITAIRE_PAD_BOTTOM - RELEASE_H;
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

  const battle = createBattleLayout(W, coinBlockCount);

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
   * 座標から当たったものを返す（放つボタン → 山札 → 手札の枠 → 列 の順）。
   * 手札の枠は後ろの番号（手前）から調べる（2枠以上で重なる所は手前の枠、奥の枠は手前に隠れていない所で当たる）。
   * @param {number} x x 座標
   * @param {number} y y 座標
   * @param {number[]} [columnLengths] 列ごとのカードの枚数（列のカードの当たりに使う）
   * @param {number} [handCount] 手札の枠の数（手札の枠の当たりに使う。既定 1）
   * @returns {Hit|null} 当たったもの。なければ null
   */
  function hitTest(x, y, columnLengths = [], handCount = 1) {
    for (let i = 0; i < releaseButtons.length; i++) {
      if (inRect(releaseButtons[i], x, y)) return { kind: 'release', index: i };
    }
    for (let i = 0; i < decks.length; i++) {
      if (inRect(decks[i], x, y)) return { kind: 'deck', index: i };
    }
    const handSlots = hand.slotsFor(handCount);
    for (let i = handSlots.length - 1; i >= 0; i--) {
      if (inRect(handSlots[i], x, y)) return { kind: 'hand', index: i };
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

  /**
   * 座標が最上部の「TURN」の区画の押せる範囲に入るかを返す（盤面の操作の `hitTest` とは別）。
   * @param {number} x x 座標
   * @param {number} y y 座標
   * @returns {boolean} 入れば true
   */
  function turnHitTest(x, y) {
    return inRect(battle.topGauges.turnHit, x, y);
  }

  return { screen, sections, card: { w: cardW, h: cardH }, decks, discard, columns, hand, releaseButtons, actionGauge, battle, columnCardRects, hitTest, turnHitTest };
}

/**
 * タイトル画面の配置を作る。
 * @param {{ width: number, height: number }} screen 画面の大きさ
 * @param {boolean} hasResume 「再開」ボタンを置くか（中断データがあるとき true）
 * @returns {TitleLayout} タイトル画面の配置
 */
export function createTitleLayout(screen, hasResume) {
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

  const settingsButton = {
    x: startButton.x,
    y: howToButton.y + howToButton.h + TITLE_HOWTO_GAP,
    w: TITLE_BUTTON_W,
    h: TITLE_HOWTO_H,
  };

  const resumeButton = hasResume
    ? {
        x: startButton.x,
        y: startButton.y - TITLE_HOWTO_GAP - TITLE_RESUME_H,
        w: TITLE_BUTTON_W,
        h: TITLE_RESUME_H,
      }
    : null;

  /**
   * 座標から、タイトル画面のボタンに当たったものを返す。
   * @param {number} x x 座標
   * @param {number} y y 座標
   * @returns {'resume'|'start'|'howTo'|'settings'|null} 当たったもの。なければ null
   */
  function titleHitTest(x, y) {
    if (resumeButton !== null && inRect(resumeButton, x, y)) return 'resume';
    if (inRect(startButton, x, y)) return 'start';
    if (inRect(howToButton, x, y)) return 'howTo';
    return inRect(settingsButton, x, y) ? 'settings' : null;
  }

  return {
    screen,
    title: { x: W / 2, y: H * TITLE_TEXT_RATIO, maxW: W - SIDE_MARGIN * 2 },
    startButton,
    howToButton,
    settingsButton,
    resumeButton,
    resumeTextY: resumeButton === null ? null : resumeButton.y + TITLE_RESUME_LABEL_DY,
    resumePlaceY: resumeButton === null ? null : resumeButton.y + TITLE_RESUME_PLACE_DY,
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
  /**
   * 遊び方の画面の i 番目（0: まえへ、1: タイトルへ、2: つぎへ）のボタンの矩形を作る。
   * @param {number} i ボタンの番号
   * @returns {Rect} ボタンの矩形
   */
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

  const contentBottom = buttonY - HOWTO_BODY_GAP;
  const bodyTop = HOWTO_BODY_TOP + HOWTO_ART_H + HOWTO_ART_GAP;

  /**
   * 遊び方の4ページ目の、敵ごとの段を count 個、中身の上端から下端まで同じ高さで上から並べる。
   * 純粋な関数で、呼ぶたびに新しい配列を返す。
   * @param {number} count 段の数
   * @returns {Array<{ art: Rect, text: Rect }>} 上から順の段（art は左の絵の区画、text は右の文字の範囲）。count が 0 以下なら空
   */
  function enemyRows(count) {
    if (!(count > 0)) return [];
    const rowH = (contentBottom - HOWTO_BODY_TOP - HOWTO_ROW_GAP_Y * (count - 1)) / count;
    const textX = HOWTO_PAD_X + HOWTO_ROW_ART_W + HOWTO_ROW_GAP_X;
    const rows = [];
    for (let i = 0; i < count; i++) {
      const y = HOWTO_BODY_TOP + (rowH + HOWTO_ROW_GAP_Y) * i;
      rows.push({
        art: { x: HOWTO_PAD_X, y, w: HOWTO_ROW_ART_W, h: rowH },
        text: { x: textX, y, w: HOWTO_PAD_X + innerW - textX, h: rowH },
      });
    }
    return rows;
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
    art: { x: HOWTO_PAD_X, y: HOWTO_BODY_TOP, w: innerW, h: HOWTO_ART_H },
    body: {
      x: HOWTO_PAD_X,
      y: bodyTop,
      w: innerW,
      h: contentBottom - bodyTop,
    },
    enemyRows,
    prevButton,
    backButton,
    nextButton,
    buttonTextMaxW: buttonW - HOWTO_BUTTON_PAD_X * 2,
    howToHitTest,
  };
}
