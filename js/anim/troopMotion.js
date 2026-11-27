/**
 * 兵1体の動きの記録（脚・終わり方）の作成と追記、時計からの1体の見た目（位置・傾き・濃さ・待っているか）を求める。
 * 弾む・揺れる・進む向きと逆へ弾かれて落ちる・その場で消える・踏み込み（加速）の式はここだけに置く。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';

/**
 * 兵の種類。自軍はゲージの識別子（attack・defense・heal）、敵の側は enemy・enemyGuard、goblin＝群れの敵の HP の群れ、
 * shield＝絵の敵のシールド、flame＝ブレスの炎、minion＝待っている・襲う子、minionBorn＝その攻防で生まれた子、figure＝絵の敵の絵（倒れる動きだけに使い、名簿には入れない）。
 * @typedef {'attack'|'defense'|'heal'|'enemy'|'enemyGuard'|'goblin'|'shield'|'flame'|'figure'|'minion'|'minionBorn'} TroopKind
 */

/**
 * 弾みも揺れもなく真っすぐ進む種類。
 * @type {ReadonlySet<string>}
 */
const GLIDE_KINDS = new Set(['flame']);

/**
 * 当たったときに跳ねて落ちずに、その場で消える種類。
 * @type {ReadonlySet<string>}
 */
const VANISH_ON_HIT_KINDS = new Set(['flame']);

/**
 * 当たる脚で踏み込む（加速する）種類。
 * @type {ReadonlySet<string>}
 */
const RUSH_KINDS = new Set(['attack']);

/**
 * 倒れるときに弾かれる向き（-1＝左、1＝右）。進む向きと逆。表にない種類（shield・flame・figure）は横に動かない（0）。
 * @type {Readonly<Record<string, number>>}
 */
const KNOCK_DIRS = Object.freeze({
  attack: -1,
  defense: -1,
  heal: -1,
  enemy: 1,
  enemyGuard: 1,
  goblin: 1,
  minion: 1,
  minionBorn: 1,
});

/**
 * 移動の区間（脚）。位置は直線で補間する。
 * @typedef {Object} TroopLeg
 * @property {number} start 脚の始まりの時刻（ms）
 * @property {number} end 脚の終わりの時刻（ms）
 * @property {number} fromX 元の x
 * @property {number} fromY 元の足元の y
 * @property {number} toX 行き先の x
 * @property {number} toY 行き先の足元の y
 * @property {boolean} rush true なら敵へ踏み込む脚（進み具合を `rushPower` で累乗して加速する）
 */

/**
 * 終わり方。
 * @typedef {Object} TroopEnd
 * @property {'fall'|'vanish'} type 'fall'＝跳ねて落ちる／'vanish'＝その場で見えなくなる（城に入る・画面の外へ出る・炎が当たる）
 * @property {number} time 終わり方の始まる時刻（ms）
 * @property {number} doneAt 見えなくなる時刻（ms）
 * @property {number} x 始まる位置の x
 * @property {number} y 始まる位置の足元の y
 * @property {number} dx 落ちる間の横のずれの合計（px、符号つき。'vanish'・向きのない種類は 0）
 * @property {number} points 終わり方が決まる直前の残りのポイント（人数の表示値が、この時刻に減る量。`spendTroopPoints` で終わるときは使う前の残り）
 */

/**
 * 兵1体の記録。攻防の始めに作り、毎フレームは書き換えない（作るときだけ x・y・freeAt・points を使う）。
 * @typedef {Object} TroopUnit
 * @property {TroopKind} kind 種類
 * @property {number} index 種類の中の何番目か
 * @property {number} homeX 家の x
 * @property {number} homeY 家の足元の y
 * @property {number} appearAt 現れ始める時刻（ms）
 * @property {number} appearMs 現れる（濃くなる）時間（ms。0 ならすぐ）
 * @property {number} size 描く大きさ（0 なら配置の兵の大きさ）
 * @property {boolean} glide true なら弾み・揺れなしで真っすぐ動く
 * @property {boolean} auto 自動兵士か（印だけ。動き・時刻・結果には影響せず、見た目の色だけに使う。既定 false）
 * @property {boolean} elite 自軍の精鋭か（当たる順と見た目の色だけに使い、動き・時刻は変えない。精鋭の `points` は 2 以上。既定 false）
 * @property {TroopLeg[]} legs 移動の区間の並び（時刻の昇順）
 * @property {TroopEnd|null} end 終わり方（まだなら null）
 * @property {number} x 作るときだけ使う。最後の脚の行き先の x（いまいる位置）
 * @property {number} y 作るときだけ使う。最後の脚の行き先の足元の y
 * @property {number} freeAt 作るときだけ使う。最後の脚の終わりの時刻（次の脚はこれ以降に始める）
 * @property {number} points 作るときだけ使う。残りのポイント（名簿を組み立てる間だけ減らす。既定 1）
 * @property {number|null} woundAt 傷ついた姿になる時刻（ms。null なら傷つかない。始めから傷ついた体は現れる時刻）
 * @property {Array<{time: number, x: number, y: number, points: number}>} woundHits 攻防の途中で傷ついた当たり（時刻と位置とその当たりで使ったポイント。始めから傷ついた体は空）
 */

/**
 * 時計からの1体の見た目の入れ物。`sampleTroop` が書き込む（呼び出しごとにオブジェクトを作らないため）。
 * @typedef {Object} TroopSample
 * @property {boolean} visible 見えるか
 * @property {number} x 足元の x
 * @property {number} footY 足元の y（持ち上がり・跳ね・落ちを含む）
 * @property {number} sortY 描く順に使う地面の上の y（持ち上がり・跳ね・落ちを含まない）
 * @property {number} tilt 傾き（rad。足元を軸）
 * @property {number} alpha 濃さ（0〜1）
 * @property {boolean} idle 家の位置で止まって待っているか（見えていて、終わり方が始まっておらず、脚の途中でない）
 * @property {boolean} wounded 傷ついた姿か（見えていて、`woundAt` が null でなく、時計が `woundAt` 以上）
 */

/**
 * 兵1体の記録を作る。
 * @param {TroopKind} kind 種類
 * @param {number} index 種類の中の何番目か
 * @param {number} homeX 家の x
 * @param {number} homeY 家の足元の y
 * @param {number} appearAt 現れ始める時刻（ms）
 * @param {number} appearMs 現れる時間（ms。0 ならすぐ）
 * @returns {TroopUnit} 脚・終わり方・傷のない記録（points は 1、woundAt は null、woundHits は空、auto・elite は false）
 */
export function createTroopUnit(kind, index, homeX, homeY, appearAt, appearMs) {
  return {
    kind,
    index,
    homeX,
    homeY,
    appearAt,
    appearMs,
    size: 0,
    glide: GLIDE_KINDS.has(kind),
    auto: false,
    elite: false,
    legs: [],
    end: null,
    x: homeX,
    y: homeY,
    freeAt: appearAt,
    points: 1,
    woundAt: null,
    woundHits: [],
  };
}

/**
 * 兵に移動の脚を足す。元の位置はいまいる位置（`unit.x`・`unit.y`）で、足したあと行き先へ進める。
 * @param {TroopUnit} unit 兵
 * @param {number} start 脚の始まりの時刻（ms。`unit.freeAt` 以降）
 * @param {number} toX 行き先の x
 * @param {number} toY 行き先の足元の y
 * @param {number} duration 脚の長さ（ms）
 * @returns {void}
 * @throws {Error} `start` が `unit.freeAt` より前のとき
 */
export function addTroopLeg(unit, start, toX, toY, duration) {
  if (start < unit.freeAt) {
    throw new Error(`addTroopLeg: start(${start}) が freeAt(${unit.freeAt}) より前です`);
  }
  const end = start + duration;
  unit.legs.push({ start, end, fromX: unit.x, fromY: unit.y, toX, toY, rush: false });
  unit.x = toX;
  unit.y = toY;
  unit.freeAt = end;
}

/**
 * 種類ごとの、当たったときの終わり方を返す（炎はその場で消え、ほかは跳ねて落ちる）。
 * @param {TroopKind} kind 兵の種類
 * @returns {'fall'|'vanish'} 終わり方
 */
export function troopHitEnd(kind) {
  return VANISH_ON_HIT_KINDS.has(kind) ? 'vanish' : 'fall';
}

/**
 * 足元が `startY` から跳ねて落ち始めてから、`fallOutY` に着くまでの時間（ms）を求める。
 * @param {number} startY 跳ね始める足元の y
 * @param {number} fallOutY 消える y（足元がこれより下に来たら消える）
 * @returns {number} 跳ね始めから消えるまでの時間（ms）
 */
export function fallDuration(startY, fallOutY) {
  const { popHeight, popMs, fallAccel } = BATTLE_ANIM;
  const drop = Math.max(0, fallOutY - (startY - popHeight));
  return popMs + Math.sqrt((2 * drop) / fallAccel);
}

/**
 * 兵に終わり方を決める。位置はいまいる位置（`unit.x`・`unit.y`）。
 * 'fall' で踏み込む種類（`RUSH_KINDS`）の最後の脚が終わり方の時刻ちょうどに終わり、右（敵の方）へ進む脚なら、その脚を `rush` にする。
 * @param {TroopUnit} unit 兵
 * @param {'fall'|'vanish'} type 終わり方
 * @param {number} time 終わり方の始まる時刻（ms）
 * @param {number} fallOutY 落ちる兵が消える y（'fall' のときだけ使う）
 * @returns {void}
 * @throws {Error} すでに終わり方があるとき・未知の種類のとき
 */
export function setTroopEnd(unit, type, time, fallOutY) {
  if (unit.end !== null) {
    throw new Error('setTroopEnd: すでに終わり方が決まっています');
  }
  let doneAt;
  let dx = 0;
  if (type === 'fall') {
    if (Object.prototype.hasOwnProperty.call(KNOCK_DIRS, unit.kind)) {
      dx = KNOCK_DIRS[unit.kind] * BATTLE_ANIM.knockDistance;
    }
    doneAt = time + fallDuration(unit.y, fallOutY);
    const last = unit.legs.length > 0 ? unit.legs[unit.legs.length - 1] : null;
    if (RUSH_KINDS.has(unit.kind) && last !== null && last.end === time && last.toX > last.fromX) {
      last.rush = true;
    }
  } else if (type === 'vanish') {
    doneAt = time;
  } else {
    throw new Error(`setTroopEnd: 未知の終わり方 ${type}`);
  }
  unit.end = { type, time, doneAt, x: unit.x, y: unit.y, dx, points: unit.points };
}

/**
 * 兵の残りのポイントを points だけ減らす。0 以下なら終わり方を決め（`setTroopEnd`）、残れば傷ついた姿になり（`woundAt` が null のときだけ time）、
 * 傷ついた当たり（time と今いる位置と使ったポイント）を `woundHits` に足す。終わるときの `end.points` は使う前の残り。1体1ポイントなら必ず終わり方が決まる。
 * @param {TroopUnit} unit 兵
 * @param {number} points 減らすポイント
 * @param {number} time 当たる時刻（ms。呼ぶ側が `unit.freeAt` 以降にそろえる）
 * @param {number} fallOutY 落ちる兵が消える y（終わり方が 'fall' のときだけ使う）
 * @returns {void}
 * @throws {Error} 終わり方が決まるとき、すでに終わり方があれば（`setTroopEnd` と同じ）
 */
export function spendTroopPoints(unit, points, time, fallOutY) {
  const before = unit.points;
  unit.points -= points;
  if (unit.points <= 0) {
    setTroopEnd(unit, troopHitEnd(unit.kind), time, fallOutY);
    unit.end.points = before;
    return;
  }
  if (unit.woundAt === null) unit.woundAt = time;
  unit.woundHits.push({ time, x: unit.x, y: unit.y, points });
}

/**
 * 時計からの1体の見た目を `out` に書き込む（オブジェクトを作らない）。
 * @param {TroopUnit} unit 兵
 * @param {number} clock 時計の値（ms）
 * @param {TroopSample} out 書き込み先
 * @returns {void}
 * @throws {Error} `BATTLE_ANIM.moveStyle` が未知のとき
 */
export function sampleTroop(unit, clock, out) {
  const style = BATTLE_ANIM.moveStyle;
  if (style !== 'hop' && style !== 'sway') {
    throw new Error(`sampleTroop: 未知の moveStyle ${style}`);
  }

  out.visible = false;
  out.idle = false;
  out.wounded = false;
  out.tilt = 0;
  out.alpha = 1;
  if (clock < unit.appearAt) return;

  const end = unit.end;
  if (end !== null && clock >= end.time) {
    if (end.type === 'vanish') return;
    if (clock >= end.doneAt) return;
    out.visible = true;
    out.wounded = unit.woundAt !== null && clock >= unit.woundAt;
    out.sortY = end.y;
    const { popHeight, popMs, fallAccel } = BATTLE_ANIM;
    const tau = clock - end.time;
    const span = end.doneAt - end.time;
    out.x = end.x + (span > 0 ? end.dx * Math.min(1, tau / span) : end.dx);
    let dy;
    if (tau <= popMs) {
      const v0 = (2 * popHeight) / popMs;
      const g1 = (2 * popHeight) / (popMs * popMs);
      dy = -(v0 * tau - (g1 * tau * tau) / 2);
    } else {
      const d = tau - popMs;
      dy = -popHeight + (fallAccel * d * d) / 2;
    }
    out.footY = end.y + dy;
    return;
  }

  out.visible = true;
  out.wounded = unit.woundAt !== null && clock >= unit.woundAt;
  if (unit.appearMs > 0) {
    out.alpha = Math.min(1, (clock - unit.appearAt) / unit.appearMs);
  }

  let x = unit.homeX;
  let y = unit.homeY;
  let lift = 0;
  let moving = false;
  const legs = unit.legs;
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    if (clock >= leg.end) {
      x = leg.toX;
      y = leg.toY;
      continue;
    }
    if (clock < leg.start) break;
    const length = leg.end - leg.start;
    const u = (clock - leg.start) / length;
    moving = true;
    const e = leg.rush ? u ** BATTLE_ANIM.rushPower : u;
    x = leg.fromX + (leg.toX - leg.fromX) * e;
    y = leg.fromY + (leg.toY - leg.fromY) * e;
    if (unit.glide) {
      lift = 0;
      out.tilt = 0;
    } else if (style === 'hop') {
      const n = Math.max(1, Math.round(length / BATTLE_ANIM.hopPeriodMs));
      lift = BATTLE_ANIM.hopHeight * Math.abs(Math.sin(Math.PI * n * u));
    } else {
      const n = Math.max(1, Math.round(length / BATTLE_ANIM.swayPeriodMs));
      out.tilt = BATTLE_ANIM.swayAngle * Math.sin(2 * Math.PI * n * u);
    }
    break;
  }
  out.x = x;
  out.sortY = y;
  out.footY = y - lift;
  out.idle = !moving && x === unit.homeX && y === unit.homeY;
}
