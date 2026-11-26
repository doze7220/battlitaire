/**
 * 攻防の当たり（時刻・位置・種類・大きな一撃か・段の番号・減る量）を、段ごとに終わり方が決まった兵・傷ついた兵の当たり・ヒットマークから、
 * 段の種類ごとの表で記録する。時刻の式は持たず（名簿・打撃の時刻を写す）、描画も状態の変更も行わない。
 */

/**
 * 当たりの種類の数値。
 * @type {Readonly<{hit: number, enemyDamage: number, castleDamage: number, repair: number}>}
 */
export const IMPACT_KINDS = Object.freeze({ hit: 0, enemyDamage: 1, castleDamage: 2, repair: 3 });

/**
 * 当たりの記録。同じ番号の要素が1つの当たりを表す並んだ配列。
 * @typedef {Object} ImpactLog
 * @property {number[]} x 光・数字・粒の中心の x
 * @property {number[]} y 光・数字・粒の中心の y
 * @property {number[]} time 当たりの時刻（演出の時刻 ms）
 * @property {number[]} kind 種類（`IMPACT_KINDS` の値）
 * @property {number[]} heavy 大きな一撃の段なら 1、そうでなければ 0
 * @property {number[]} step 段の番号
 * @property {number[]} amount HP が減る量（`enemyDamage`・`castleDamage` の数字の量。ほかの当たり・修理は 1）
 */

/**
 * 段を組み立てる前の写し。
 * @typedef {Object} StepWatch
 * @property {import('./troopRoster.js').TroopRoster} roster 兵の名簿
 * @property {import('./hitMarks.js').HitMarkList} marks ヒットマークの記録
 * @property {import('./troopMotion.js').TroopUnit[]} open そのときまだ終わり方の決まっていない兵
 * @property {number} firstNew そのときの名簿の長さ（これ以降が段で足された兵）
 * @property {number} marksFrom そのときのヒットマークの数
 * @property {Map<import('./troopMotion.js').TroopUnit, number>} woundFrom そのときの兵ごとの `woundHits` の数（これより後の分が段で傷ついた当たり。写しにない兵は 0）
 * @property {number} strikesFrom そのときの名簿の `strikes` の長さ（これ以降が段で足された、敵の HP を減らす当たり）
 */

/**
 * 段で起きた1つの当たり（終わり方が決まった兵の当たり、または傷ついた兵の当たり）。
 * @typedef {Object} ImpactEvent
 * @property {import('./troopMotion.js').TroopUnit} unit 当たった兵
 * @property {number} time 時刻（ms）
 * @property {number} x 体の中心の x
 * @property {number} y 体の中心の y
 * @property {boolean} wound true＝傷ついた当たり（兵は残る）／false＝終わり方が決まった当たり
 */

/**
 * 空の当たりの記録を作る。
 * @returns {ImpactLog} 記録
 */
export function createImpactLog() {
  return { x: [], y: [], time: [], kind: [], heavy: [], step: [], amount: [] };
}

/**
 * 段を組み立てる前に呼び、終わり方の未決定の兵・名簿の長さ・ヒットマークの数を写す（名簿・記録は書き換えない）。
 * @param {import('./troopRoster.js').TroopRoster} roster 兵の名簿
 * @param {import('./hitMarks.js').HitMarkList} marks ヒットマークの記録
 * @returns {StepWatch} 写し
 */
export function watchStep(roster, marks) {
  return {
    roster,
    marks,
    open: roster.units.filter((unit) => unit.end === null),
    firstNew: roster.units.length,
    marksFrom: marks.time.length,
    woundFrom: new Map(roster.units.map((unit) => [unit, unit.woundHits.length])),
    strikesFrom: roster.strikes.length,
  };
}

/**
 * 当たりを1つ足す。
 * @param {ImpactLog} log 記録
 * @param {number} x 中心の x
 * @param {number} y 中心の y
 * @param {number} time 時刻（ms）
 * @param {number} kind 種類
 * @param {number} heavy 大きな一撃なら 1
 * @param {number} step 段の番号
 * @param {number} [amount] HP が減る量（既定 1）
 * @returns {void}
 */
function addImpact(log, x, y, time, kind, heavy, step, amount = 1) {
  log.x.push(x);
  log.y.push(y);
  log.time.push(time);
  log.kind.push(kind);
  log.heavy.push(heavy);
  log.step.push(step);
  log.amount.push(amount);
}

/**
 * 当たり1つの位置（体の中心）で当たりを足す。
 * @param {ImpactLog} log 記録
 * @param {ImpactEvent} event 当たり
 * @param {number} kind 種類
 * @param {number} heavy 大きな一撃なら 1
 * @param {number} step 段の番号
 * @param {number} [amount] HP が減る量（既定 1）
 * @returns {void}
 */
function addEventImpact(log, event, kind, heavy, step, amount = 1) {
  addImpact(log, event.x, event.y, event.time, kind, heavy, step, amount);
}

/**
 * 段の種類ごとの記録の関数の引数。
 * @typedef {Object} RuleContext
 * @property {ImpactLog} log 記録
 * @property {StepWatch} watch 段の写し
 * @property {ImpactEvent[]} events その段の当たり（終わり方が決まった兵の当たりと傷ついた兵の当たり。時刻の昇順。同じなら傷ついた当たりが先、次に名簿の順）
 * @property {import('./battleSteps.js').BattleStep} step 段
 * @property {number} index 段の番号
 * @property {number} heavy 大きな一撃なら 1
 * @property {string} bodyStyle 敵の体の見せ方（今は使わない。呼び出し側の形を保つため受け取る）
 */

/**
 * 当たり（終わった兵・傷ついた兵の当たり）すべてを `hit` にする。
 * @param {RuleContext} c 引数
 * @returns {void}
 */
function recordAllHit(c) {
  for (const event of c.events) addEventImpact(c.log, event, IMPACT_KINDS.hit, c.heavy, c.index);
}

/**
 * 終わった兵の残りのポイント（`points`）を前から、合計が `step.amount` になるまで `castleDamage`（量はそのポイント。最後は残りの量）にし、
 * ほかの当たり（残りの兵・傷ついた当たり）を `hit` にする。1体1ポイントなら前から `step.amount` 体が量 1 の `castleDamage`。
 * @param {RuleContext} c 引数
 * @returns {void}
 */
function recordCastleHit(c) {
  let left = c.step.amount;
  for (const event of c.events) {
    const spend = event.wound ? 0 : Math.min(left, event.unit.points);
    if (spend > 0) {
      left -= spend;
      addEventImpact(c.log, event, IMPACT_KINDS.castleDamage, c.heavy, c.index, spend);
    } else {
      addEventImpact(c.log, event, IMPACT_KINDS.hit, c.heavy, c.index);
    }
  }
}

/**
 * 段で足された、敵の HP を減らす当たり（`roster.strikes`）ごとに、その当たりの体（群れは体、絵は攻撃の兵）の当たりのうち
 * 時刻の最初の1つを `enemyDamage`（量はその当たりのポイント。合計は `step.amount` まで）にし、同じ当たりの残りの体の当たりは記録しない
 * （「-N」と光は1回）。当たりに含まれない当たりは `hit` にする。1体1ポイントの当たりなら、前から `step.amount` 個の体の当たりが量 1 の `enemyDamage` になる。
 * @param {RuleContext} c 引数
 * @returns {void}
 */
function recordEnemyHit(c) {
  /** @type {Map<ImpactEvent, number>} 当たりの当たり → 量（0 は同じ当たりの残りで、記録しない） */
  const roles = new Map();
  let left = c.step.amount;
  for (const strike of c.watch.roster.strikes.slice(c.watch.strikesFrom)) {
    if (left <= 0) break;
    const found = [];
    for (const body of strike.bodies) {
      const event = c.events.find((e) => e.unit === body.unit && e.time === body.time && !roles.has(e) && !found.includes(e));
      if (event !== undefined) found.push(event);
    }
    if (found.length === 0) continue;
    found.sort((a, b) => c.events.indexOf(a) - c.events.indexOf(b));
    const spend = Math.min(strike.points, left);
    left -= spend;
    roles.set(found[0], spend);
    for (let i = 1; i < found.length; i++) roles.set(found[i], 0);
  }
  for (const event of c.events) {
    if (!roles.has(event)) {
      addEventImpact(c.log, event, IMPACT_KINDS.hit, c.heavy, c.index);
    } else if (roles.get(event) > 0) {
      addEventImpact(c.log, event, IMPACT_KINDS.enemyDamage, c.heavy, c.index, roles.get(event));
    }
  }
}

/**
 * その段で足されたヒットマークの前から `step.amount` 個を、マークの位置・時刻で `castleDamage` にする。
 * @param {RuleContext} c 引数
 * @returns {void}
 */
function recordStrikeCastle(c) {
  const marks = c.watch.marks;
  const end = Math.min(marks.time.length, c.watch.marksFrom + c.step.amount);
  for (let i = c.watch.marksFrom; i < end; i++) {
    addImpact(c.log, marks.x[i], marks.y[i], marks.time[i], IMPACT_KINDS.castleDamage, c.heavy, c.index);
  }
}

/**
 * 終わった兵（修理の兵）すべてを `repair` にする（常に大きな一撃ではない。傷ついた当たりは数えない）。
 * @param {RuleContext} c 引数
 * @returns {void}
 */
function recordRepair(c) {
  for (const event of c.events) {
    if (!event.wound) addEventImpact(c.log, event, IMPACT_KINDS.repair, 0, c.index);
  }
}

/**
 * 段の種類ごとの記録の表。表にない段は何も記録しない。
 * @type {Readonly<Object<string, (c: RuleContext) => void>>}
 */
const IMPACT_RULES = Object.freeze({
  block: recordAllHit,
  enemyBlock: recordAllHit,
  shieldBlock: recordAllHit,
  strikeBlock: recordAllHit,
  castleHit: recordCastleHit,
  enemyHit: recordEnemyHit,
  strikeCastle: recordStrikeCastle,
  heal: recordRepair,
});

/**
 * 段で起きた当たり（その段で終わり方が決まった兵と、傷ついた兵の増えた `woundHits`）を、時刻の昇順（同じなら傷ついた当たりが先、次に名簿の順）に並べる。
 * @param {StepWatch} watch 段の写し
 * @returns {ImpactEvent[]} 当たりの並び
 */
function collectEvents(watch) {
  const units = watch.roster.units;
  const entries = [];
  for (const unit of watch.open.concat(units.slice(watch.firstNew))) {
    if (unit.end === null) continue;
    const size = unit.size > 0 ? unit.size : watch.roster.layout.size;
    entries.push({ unit, time: unit.end.time, x: unit.end.x, y: unit.end.y - size / 2, wound: false });
  }
  for (const unit of units) {
    const size = unit.size > 0 ? unit.size : watch.roster.layout.size;
    for (let i = watch.woundFrom.get(unit) ?? 0; i < unit.woundHits.length; i++) {
      const hit = unit.woundHits[i];
      entries.push({ unit, time: hit.time, x: hit.x, y: hit.y - size / 2, wound: true });
    }
  }
  return entries
    .map((event, order) => ({ event, order }))
    .sort((a, b) => a.event.time - b.event.time || Number(b.event.wound) - Number(a.event.wound) || a.order - b.order)
    .map((entry) => entry.event);
}

/**
 * 段を組み立てた後に呼び、その段の当たりを記録する。その段で終わり方が決まった兵（写しの時点で未決定だった兵と、段で足された兵のうち
 * `end` のあるもの）と、段で傷ついた兵の当たり（`woundHits` の増えた分）を、時刻の昇順（同じなら傷ついた当たりが先、次に名簿の順）に並べて、
 * 段の種類ごとの表で記録する。傷のない兵だけなら終わり方の時刻の昇順（同じなら名簿の順）。
 * @param {ImpactLog} log 記録
 * @param {StepWatch} watch `watchStep` の戻り値
 * @param {import('./battleSteps.js').BattleStep} step 組み立てた段
 * @param {number} index 段の番号
 * @param {string} bodyStyle 敵の体の見せ方（'horde'・'figure'）。今は使わない（呼び出し側の形を保つため受け取る）
 * @returns {void}
 */
export function recordStepImpacts(log, watch, step, index, bodyStyle) {
  const rule = IMPACT_RULES[step.type];
  if (rule === undefined) return;
  rule({ log, watch, events: collectEvents(watch), step, index, heavy: step.heavy === true ? 1 : 0, bodyStyle });
}
