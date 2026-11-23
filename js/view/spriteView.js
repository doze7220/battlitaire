/**
 * 責務: スプライトJSの import と識別子・絵の範囲の表、ロゴ・数字の表（原点中心に倍率をかけて描く）、予告の絵の表（原点中心に倍率 1 で描く）を持ち、draw(ctx) を呼ぶ。兵1体の焼き付ける範囲も求める。
 * assets/sprites/ を import するのはこのモジュールだけ。状態は変えず、ルール層・anim は import しない。
 */

import background from 'assets/sprites/background.js';
import unitCastle from 'assets/sprites/unit_castle.js';
import unitGiant from 'assets/sprites/unit_giant.js';
import unitDragon from 'assets/sprites/unit_dragon.js';
import unitSolder from 'assets/sprites/unit_solder.js';
import unitGoblin from 'assets/sprites/unit_goblin.js';
import suitSword from 'assets/sprites/suit_sword.js';
import suitShield from 'assets/sprites/suit_shield.js';
import suitHammer from 'assets/sprites/suit_hammer.js';
import suitGold from 'assets/sprites/suit_gold.js';
import effectFire from 'assets/sprites/effect_fire.js';
import effectHit from 'assets/sprites/effect_hit.js';
import cardFrontSword from 'assets/sprites/card_front_sword.js';
import cardFrontShield from 'assets/sprites/card_front_shield.js';
import cardFrontHammer from 'assets/sprites/card_front_hammer.js';
import cardFrontGold from 'assets/sprites/card_front_gold.js';
import cardBack from 'assets/sprites/card_back.js';
import logoReady from 'assets/sprites/logo_ready.js';
import logoBattle from 'assets/sprites/logo_battle.js';
import logoTurn from 'assets/sprites/logo_turn.js';
import logoStage from 'assets/sprites/logo_stage.js';
import logoNameGoblins from 'assets/sprites/logo_name_goblins.js';
import logoNameGiant from 'assets/sprites/logo_name_giant.js';
import logoNameDragon from 'assets/sprites/logo_name_dragon.js';
import digit0 from 'assets/sprites/digit_0.js';
import digit1 from 'assets/sprites/digit_1.js';
import digit2 from 'assets/sprites/digit_2.js';
import digit3 from 'assets/sprites/digit_3.js';
import digit4 from 'assets/sprites/digit_4.js';
import digit5 from 'assets/sprites/digit_5.js';
import digit6 from 'assets/sprites/digit_6.js';
import digit7 from 'assets/sprites/digit_7.js';
import digit8 from 'assets/sprites/digit_8.js';
import digit9 from 'assets/sprites/digit_9.js';
import intentAttack from 'assets/sprites/intent_attack.js';
import intentDefend from 'assets/sprites/intent_defend.js';
import intentWindup from 'assets/sprites/intent_windup.js';
import intentClaw from 'assets/sprites/intent_claw.js';
import intentInhale from 'assets/sprites/intent_inhale.js';
import intentBreath from 'assets/sprites/intent_breath.js';

/**
 * 矩形。
 * @typedef {object} Rect
 * @property {number} x 左端
 * @property {number} y 上端
 * @property {number} w 幅
 * @property {number} h 高さ
 */

/**
 * スプライトの識別子（呼ぶ側はこの定数で絵を指す）。
 * @type {Readonly<{background: string, castle: string, giant: string, dragon: string, soldier: string, goblin: string, sword: string, shield: string, hammer: string, gold: string, fire: string, hit: string, cardFrontSword: string, cardFrontShield: string, cardFrontHammer: string, cardFrontGold: string, cardBack: string}>}
 */
export const SPRITE_IDS = Object.freeze({
  background: 'background',
  castle: 'castle',
  giant: 'giant',
  dragon: 'dragon',
  soldier: 'soldier',
  goblin: 'goblin',
  sword: 'sword',
  shield: 'shield',
  hammer: 'hammer',
  gold: 'gold',
  fire: 'fire',
  hit: 'hit',
  cardFrontSword: 'cardFrontSword',
  cardFrontShield: 'cardFrontShield',
  cardFrontHammer: 'cardFrontHammer',
  cardFrontGold: 'cardFrontGold',
  cardBack: 'cardBack',
});

/**
 * 絵の範囲（基準点 (0, 0) から見た範囲。単位 px、y は下向き）。描く位置・大きさにはスプライトの bounds を読まない。焼き付ける範囲（troopFigureBakeBounds）にだけ読む。
 * @typedef {object} SpriteEntry
 * @property {{draw: function(CanvasRenderingContext2D): void, bounds?: {minX: number, minY: number, maxX: number, maxY: number}}} sprite import したスプライト
 * @property {number} minX x の最小
 * @property {number} maxX x の最大
 * @property {number} minY y の最小
 * @property {number} maxY y の最大（足元）
 */

/**
 * カードのスプライトを OZ Vector Editor で描くときの約束の範囲（倍率の元）。
 * 原点 (0, 0) がカードの中心で、カードの外形を幅100×高さ140（x -50〜50、y -70〜70）の実寸で描く。
 * ゲームはこの範囲をカードの矩形に縦横別々の倍率で合わせ、範囲の外にはみ出した部分も同じ倍率で描く。
 * スプライトの bounds は読まない。
 * @type {Readonly<{minX: number, maxX: number, minY: number, maxY: number}>}
 */
const CARD_ART_RANGE = Object.freeze({ minX: -50, maxX: 50, minY: -70, maxY: 70 });

/**
 * 識別子 → 絵と絵の範囲の凍結した表。
 * 兵（soldier）とゴブリン（goblin）の範囲（x ±99・y ±98）はスプライトの bounds（x ±106・y ±105。太さ 16 の線を含む）と違う。
 * 表は兵の描く大きさ（drawSpriteCentered の size）の基準で、bounds に合わせると約 7% 小さく描かれるため、見た目を変えないよう今の値を残す。
 * 描く位置・大きさには bounds を使わない。焼き付ける範囲を求めるときだけ、表の範囲と bounds を合わせて使う（troopFigureBakeBounds）。
 * スプライトを描き直して差し替えるときに、表を新しい bounds に合わせ直し、layout.js の TROOP_SIZE も一緒に見直す。
 * @type {Readonly<Record<string, Readonly<SpriteEntry>>>}
 */
const SPRITE_TABLE = Object.freeze({
  [SPRITE_IDS.background]: Object.freeze({ sprite: background, minX: -360, maxX: 360, minY: -260, maxY: 100 }),
  [SPRITE_IDS.castle]: Object.freeze({ sprite: unitCastle, minX: -115, maxX: 101, minY: -292, maxY: 150 }),
  [SPRITE_IDS.giant]: Object.freeze({ sprite: unitGiant, minX: -113, maxX: 160, minY: -153, maxY: 243 }),
  [SPRITE_IDS.dragon]: Object.freeze({ sprite: unitDragon, minX: -150, maxX: 168, minY: -196, maxY: 200 }),
  [SPRITE_IDS.soldier]: Object.freeze({ sprite: unitSolder, minX: -99, maxX: 99, minY: -98, maxY: 98 }),
  [SPRITE_IDS.goblin]: Object.freeze({ sprite: unitGoblin, minX: -99, maxX: 99, minY: -98, maxY: 98 }),
  [SPRITE_IDS.sword]: Object.freeze({ sprite: suitSword, minX: -39.5, maxX: 40.5, minY: -100.5, maxY: 99.5 }),
  [SPRITE_IDS.shield]: Object.freeze({ sprite: suitShield, minX: -80.5, maxX: 80.5, minY: -100.5, maxY: 100.5 }),
  [SPRITE_IDS.hammer]: Object.freeze({ sprite: suitHammer, minX: -60.5, maxX: 60.5, minY: -90.5, maxY: 90.5 }),
  [SPRITE_IDS.gold]: Object.freeze({ sprite: suitGold, minX: -70.5, maxX: 70.5, minY: -89.5, maxY: 85.5 }),
  [SPRITE_IDS.fire]: Object.freeze({ sprite: effectFire, minX: -84, maxX: 85, minY: -99, maxY: 92 }),
  [SPRITE_IDS.hit]: Object.freeze({ sprite: effectHit, minX: -99, maxX: 99, minY: -99, maxY: 99 }),
  [SPRITE_IDS.cardFrontSword]: Object.freeze({ sprite: cardFrontSword, ...CARD_ART_RANGE }),
  [SPRITE_IDS.cardFrontShield]: Object.freeze({ sprite: cardFrontShield, ...CARD_ART_RANGE }),
  [SPRITE_IDS.cardFrontHammer]: Object.freeze({ sprite: cardFrontHammer, ...CARD_ART_RANGE }),
  [SPRITE_IDS.cardFrontGold]: Object.freeze({ sprite: cardFrontGold, ...CARD_ART_RANGE }),
  [SPRITE_IDS.cardBack]: Object.freeze({ sprite: cardBack, ...CARD_ART_RANGE }),
});

/**
 * ロゴのスプライトの識別子（SPRITE_IDS とは別。呼ぶ側はこの定数でロゴを指す）。
 * @type {Readonly<{ready: string, battle: string, phase: string, stage: string, nameGoblins: string, nameGiant: string, nameDragon: string}>}
 */
export const LOGO_IDS = Object.freeze({
  ready: 'ready',
  battle: 'battle',
  phase: 'phase',
  stage: 'stage',
  nameGoblins: 'nameGoblins',
  nameGiant: 'nameGiant',
  nameDragon: 'nameDragon',
});

/**
 * ロゴの識別子 → スプライトの凍結した表。
 * エディタで描くときの約束: 原点 (0, 0) を絵の中心にして描き、ゲームは px をそのまま（倍率 1）描く。bounds は読まない。
 * @type {Readonly<Record<string, {draw: function(CanvasRenderingContext2D): void}>>}
 */
const LOGO_TABLE = Object.freeze({
  [LOGO_IDS.ready]: logoReady,
  [LOGO_IDS.battle]: logoBattle,
  [LOGO_IDS.phase]: logoTurn,
  [LOGO_IDS.stage]: logoStage,
  [LOGO_IDS.nameGoblins]: logoNameGoblins,
  [LOGO_IDS.nameGiant]: logoNameGiant,
  [LOGO_IDS.nameDragon]: logoNameDragon,
});

/**
 * 数字 0〜9 のスプライト（添字が数字）。
 * エディタで数字を描くときの約束: 原点 (0, 0) が枠の中心で、幅56×高さ76（x -28〜28、y -38〜38）の枠の中に描く。
 * 並べる間隔は枠の幅（DIGIT_CELL.w）。bounds は読まない。
 * @type {ReadonlyArray<{draw: function(CanvasRenderingContext2D): void}>}
 */
const DIGIT_SPRITES = Object.freeze([digit0, digit1, digit2, digit3, digit4, digit5, digit6, digit7, digit8, digit9]);

/**
 * 数字を描くときの約束の枠（エディタで数字を描く大きさ。並べる間隔は w）。export しない。
 * @type {Readonly<{w: number, h: number}>}
 */
const DIGIT_CELL = Object.freeze({ w: 56, h: 76 });

/**
 * 予告の絵の識別子（SPRITE_IDS・LOGO_IDS とは別。呼ぶ側はこの定数で予告の絵を指す）。
 * @type {Readonly<{attack: string, defend: string, windup: string, claw: string, inhale: string, breath: string}>}
 */
export const INTENT_IDS = Object.freeze({
  attack: 'attack',
  defend: 'defend',
  windup: 'windup',
  claw: 'claw',
  inhale: 'inhale',
  breath: 'breath',
});

/**
 * 予告の絵の識別子 → スプライトの凍結した表（範囲の数値は持たない）。
 * @type {Readonly<Record<string, {draw: function(CanvasRenderingContext2D): void}>>}
 */
const INTENT_TABLE = Object.freeze({
  [INTENT_IDS.attack]: intentAttack,
  [INTENT_IDS.defend]: intentDefend,
  [INTENT_IDS.windup]: intentWindup,
  [INTENT_IDS.claw]: intentClaw,
  [INTENT_IDS.inhale]: intentInhale,
  [INTENT_IDS.breath]: intentBreath,
});

/**
 * 予告の絵を描くときの約束の枠（エディタで予告の絵を描く大きさ）。
 * 原点 (0, 0) が枠の中心で、幅40×高さ40（x -20〜20、y -20〜20）の枠の中に描く。
 * ゲームはエディタの px をそのまま（倍率 1）描く。bounds は読まない。layout.js が札の大きさを求めるのに使う。
 * @type {Readonly<{w: number, h: number}>}
 */
export const INTENT_CELL = Object.freeze({ w: 40, h: 40 });

/**
 * 識別子から絵と絵の範囲を引く。未知の識別子は Error。
 * @param {string} id SPRITE_IDS の値
 * @returns {Readonly<SpriteEntry>} 絵と絵の範囲
 * @throws {Error} 未知の識別子のとき
 */
function lookupSprite(id) {
  if (!Object.prototype.hasOwnProperty.call(SPRITE_TABLE, id)) {
    throw new Error(`spriteView: 未知のスプライトの識別子です: ${id}`);
  }
  return SPRITE_TABLE[id];
}

/**
 * 絵の高さを height にしたときの、絵の範囲の矩形を求める（縦横比は絵の範囲から）。
 * 横は絵の範囲の中央を centerX に、下端を footY にそろえる。
 * @param {string} id SPRITE_IDS の値
 * @param {number} centerX 絵の中心の x
 * @param {number} footY 絵の下端（足元）の y
 * @param {number} height 絵の高さ
 * @returns {Rect} 絵の範囲の矩形
 */
export function spriteFitRect(id, centerX, footY, height) {
  const e = lookupSprite(id);
  const w = height * (e.maxX - e.minX) / (e.maxY - e.minY);
  return { x: centerX - w / 2, y: footY - height, w, h: height };
}

/**
 * 縦横比を保ったまま絵の範囲が rect に収まる最大の倍率で、横は中央・縦は下端をそろえて描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} id SPRITE_IDS の値
 * @param {Rect} rect 絵を収める矩形
 * @returns {void}
 */
export function drawSpriteFit(ctx, id, rect) {
  const e = lookupSprite(id);
  const bw = e.maxX - e.minX;
  const bh = e.maxY - e.minY;
  const s = Math.min(rect.w / bw, rect.h / bh);
  const left = rect.x + (rect.w - bw * s) / 2;
  ctx.save();
  ctx.translate(left - e.minX * s, rect.y + rect.h - e.maxY * s);
  ctx.scale(s, s);
  e.sprite.draw(ctx);
  ctx.restore();
}

/**
 * 絵の範囲の長い方の辺が size になる倍率で、絵の範囲の中心を (cx, cy) にそろえて描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} id SPRITE_IDS の値
 * @param {number} cx 絵の中心の x
 * @param {number} cy 絵の中心の y
 * @param {number} size 絵の範囲の長い方の辺の長さ
 * @returns {void}
 */
export function drawSpriteCentered(ctx, id, cx, cy, size) {
  const e = lookupSprite(id);
  const bw = e.maxX - e.minX;
  const bh = e.maxY - e.minY;
  const s = size / Math.max(bw, bh);
  ctx.save();
  ctx.translate(cx - ((e.minX + e.maxX) / 2) * s, cy - ((e.minY + e.maxY) / 2) * s);
  ctx.scale(s, s);
  e.sprite.draw(ctx);
  ctx.restore();
}

/**
 * 絵の範囲を矩形 (x, y, w, h) にぴったり合わせて描く（横の倍率 w/範囲の幅、縦の倍率 h/範囲の高さ。別々）。
 * 範囲の外にはみ出した部分も同じ変換のまま描かれる。カード1枚ごとにオブジェクトを作らないよう、矩形は位置で受ける。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} id SPRITE_IDS の値
 * @param {number} x 矩形の左端
 * @param {number} y 矩形の上端
 * @param {number} w 矩形の幅
 * @param {number} h 矩形の高さ
 * @returns {void}
 */
export function drawSpriteStretched(ctx, id, x, y, w, h) {
  const e = lookupSprite(id);
  const sx = w / (e.maxX - e.minX);
  const sy = h / (e.maxY - e.minY);
  ctx.save();
  ctx.translate(x - e.minX * sx, y - e.minY * sy);
  ctx.scale(sx, sy);
  e.sprite.draw(ctx);
  ctx.restore();
}

/**
 * ロゴを、原点を中心 (cx, cy) に置き、倍率 scale をかけて描く。scale が 0 以下なら何もしない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} id LOGO_IDS の値
 * @param {number} cx 絵の中心の x
 * @param {number} cy 絵の中心の y
 * @param {number} scale 倍率（1 で等倍）
 * @returns {void}
 * @throws {Error} 未知の識別子のとき
 */
export function drawLogo(ctx, id, cx, cy, scale) {
  if (!Object.prototype.hasOwnProperty.call(LOGO_TABLE, id)) {
    throw new Error(`spriteView: 未知のロゴの識別子です: ${id}`);
  }
  if (scale <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  LOGO_TABLE[id].draw(ctx);
  ctx.restore();
}

/**
 * 予告の絵を、原点を中心 (cx, cy) に置き、倍率 1 で描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} id INTENT_IDS の値
 * @param {number} cx 絵の中心の x
 * @param {number} cy 絵の中心の y
 * @returns {void}
 * @throws {Error} 未知の識別子のとき
 */
export function drawIntentIcon(ctx, id, cx, cy) {
  if (!Object.prototype.hasOwnProperty.call(INTENT_TABLE, id)) {
    throw new Error(`spriteView: 未知の予告の絵の識別子です: ${id}`);
  }
  ctx.save();
  ctx.translate(cx, cy);
  INTENT_TABLE[id].draw(ctx);
  ctx.restore();
}

/**
 * 数字を、各桁を枠の幅の間隔で左から並べ、全体の中心の x を cx、各桁の中心の y を cy にそろえて描く。
 * value が 0 以上の整数でないとき、または scale が 0 以下のときは何もしない（エラーにしない）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {number} value 描く数（0 以上の整数）
 * @param {number} cx 並べた全体の中心の x
 * @param {number} cy 各桁の中心の y
 * @param {number} scale 倍率（1 で等倍）
 * @returns {void}
 */
export function drawDigits(ctx, value, cx, cy, scale) {
  if (!Number.isInteger(value) || value < 0 || scale <= 0) return;
  const text = String(value);
  const pitch = DIGIT_CELL.w * scale;
  const left = cx - (pitch * text.length) / 2;
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    ctx.translate(left + (i + 0.5) * pitch, cy);
    ctx.scale(scale, scale);
    DIGIT_SPRITES[text.charCodeAt(i) - 48].draw(ctx);
    ctx.restore();
  }
}

/**
 * 兵1体（体の絵＋持ち物の絵）を、足元を (x, footY) にそろえて描く。tilt が 0 でなければ足元を軸に傾ける。
 * 兵1体ごとにオブジェクトを作らないよう、引数は位置で受ける。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} bodyId 体の絵の識別子（SPRITE_IDS の値）
 * @param {string|null} itemId 持ち物の絵の識別子（null なら描かない）
 * @param {number} x 足元の x
 * @param {number} footY 足元の y
 * @param {number} size 体の直径（長い方の辺）
 * @param {number} tilt 傾き（rad。足元を軸）
 * @param {number} itemSize 持ち物の大きさ（長い方の辺）
 * @param {number} itemDX 持ち物の中心の x のずれ（体の中心から。前＝右が正）
 * @param {number} itemDY 持ち物の中心の y のずれ（体の中心から。下が正）
 * @param {number} scaleX 横の伸び縮み（1 で元の大きさ。足元が軸）
 * @param {number} scaleY 縦の伸び縮み（1 で元の大きさ。足元が軸）
 * @returns {void}
 */
export function drawTroopFigure(ctx, bodyId, itemId, x, footY, size, tilt, itemSize, itemDX, itemDY, scaleX, scaleY) {
  ctx.save();
  ctx.translate(x, footY);
  if (tilt !== 0) ctx.rotate(tilt);
  if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY);
  drawSpriteCentered(ctx, bodyId, 0, -size / 2, size);
  if (itemId !== null) {
    drawSpriteCentered(ctx, itemId, itemDX, -size / 2 + itemDY, itemSize);
  }
  ctx.restore();
}

/**
 * 焼き付ける範囲の四方に足す余白（論理 px）。尖った角の線が bounds から少しはみ出す分を収める。
 * @type {number}
 */
const BAKE_EDGE_PAD = 1;

/**
 * 表の範囲とスプライトの bounds を合わせた「焼き付けの元の範囲」を返す。
 * bounds が minX・minY・maxX・maxY の有限の数を持たなければ表の範囲だけを返す。
 * @param {Readonly<SpriteEntry>} e 表の項目
 * @returns {{minX: number, minY: number, maxX: number, maxY: number}} 元の範囲（スプライトの座標）
 */
function bakeSourceRange(e) {
  const b = e.sprite.bounds;
  const ok = b !== null && typeof b === 'object'
    && Number.isFinite(b.minX) && Number.isFinite(b.minY)
    && Number.isFinite(b.maxX) && Number.isFinite(b.maxY);
  if (!ok) return { minX: e.minX, minY: e.minY, maxX: e.maxX, maxY: e.maxY };
  return {
    minX: Math.min(e.minX, b.minX),
    minY: Math.min(e.minY, b.minY),
    maxX: Math.max(e.maxX, b.maxX),
    maxY: Math.max(e.maxY, b.maxY),
  };
}

/**
 * 1つの絵を drawSpriteCentered(ctx, id, cx, cy, size) で描いたときの、焼き付けの元の範囲を移した矩形を求める。
 * 倍率・中心は表の範囲から求める（drawSpriteCentered と同じ変換）。
 * @param {string} id SPRITE_IDS の値
 * @param {number} cx 絵の中心の x
 * @param {number} cy 絵の中心の y
 * @param {number} size 表の範囲の長い方の辺の長さ
 * @returns {{minX: number, minY: number, maxX: number, maxY: number}} 描く座標での範囲
 */
function bakePartRange(id, cx, cy, size) {
  const e = lookupSprite(id);
  const s = size / Math.max(e.maxX - e.minX, e.maxY - e.minY);
  const ox = cx - ((e.minX + e.maxX) / 2) * s;
  const oy = cy - ((e.minY + e.maxY) / 2) * s;
  const r = bakeSourceRange(e);
  return { minX: ox + r.minX * s, minY: oy + r.minY * s, maxX: ox + r.maxX * s, maxY: oy + r.maxY * s };
}

/**
 * 兵1体（体＋持ち物）を drawTroopFigure(ctx, bodyId, itemId, 0, 0, size, 0, itemSize, itemDX, itemDY, 1, 1) で描いたときの、
 * 焼き付ける範囲（線の太さを含む。足元が原点の論理 px）を求める。四方に BAKE_EDGE_PAD の余白を足す。
 * 描く位置・大きさは表の範囲のまま。スプライトの bounds は焼き付ける範囲にだけ使う。
 * @param {string} bodyId 体の絵の識別子（SPRITE_IDS の値）
 * @param {string|null} itemId 持ち物の絵の識別子（null なら体だけ）
 * @param {number} size 体の直径（長い方の辺）
 * @param {number} itemSize 持ち物の大きさ（長い方の辺）
 * @param {number} itemDX 持ち物の中心の x のずれ
 * @param {number} itemDY 持ち物の中心の y のずれ（下が正）
 * @returns {{minX: number, minY: number, maxX: number, maxY: number}} 焼き付ける範囲
 */
export function troopFigureBakeBounds(bodyId, itemId, size, itemSize, itemDX, itemDY) {
  const r = bakePartRange(bodyId, 0, -size / 2, size);
  if (itemId !== null) {
    const t = bakePartRange(itemId, itemDX, -size / 2 + itemDY, itemSize);
    r.minX = Math.min(r.minX, t.minX);
    r.minY = Math.min(r.minY, t.minY);
    r.maxX = Math.max(r.maxX, t.maxX);
    r.maxY = Math.max(r.maxY, t.maxY);
  }
  return {
    minX: r.minX - BAKE_EDGE_PAD,
    minY: r.minY - BAKE_EDGE_PAD,
    maxX: r.maxX + BAKE_EDGE_PAD,
    maxY: r.maxY + BAKE_EDGE_PAD,
  };
}
