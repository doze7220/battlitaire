/**
 * 攻防の当たり（時刻・位置・種類・大きな一撃か・段の番号）を、段ごとに終わり方が決まった兵とヒットマークから、段の種類ごとの表で記録する。
 * 時刻の式は持たず（名簿・打撃の時刻を写す）、描画も状態の変更も行わない。
 */

/**
 * 当たりの種類の数値。
 * @type {Readonly<{hit: number, enemyDamage: number, castleDamage: number, repair: number}>}
 */
export const IMPACT_KINDS = Object.freeze({ hit: 0, enemyDamage: 1, castleDamage: 2, repair: 3 });

/**
 * 体の見せ方ごとの「敵の HP を減らす側の兵の種類」。
 * @type {Readonly<Object<string, string>>}
 */
const ENEMY_DAMAGE_KIND = Object.freeze({ horde: 'goblin', figure: 'attack' });

/**
 * 当たりの記録。同じ番号の要素が1つの当たりを表す並んだ配列。
 * @typedef {Object} ImpactLog
 * @property {number[]} x 光・数字・粒の中心の x
 * @property {number[]} y 光・数字・粒の中心の y
 * @property {number[]} time 当たりの時刻（演出の時刻 ms）
 * @property {number[]} kind 種類（`IMPACT_KINDS` の値）
 * @property {number[]} heavy 大きな一撃の段なら 1、そうでなければ 0
 * @property {number[]} step 段の番号
 */

/**
 * 段を組み立てる前の写し。
 * @typedef {Object} StepWatch
 * @property {import('./troopRoster.js').TroopRoster} roster 兵の名簿
 * @property {import('./hitMarks.js').HitMarkList} marks ヒットマークの記録
 * @property {import('./troopMotion.js').TroopUnit[]} open そのときまだ終わり方の決まっていない兵
 * @property {number} firstNew そのときの名簿の長さ（これ以降が段で足された兵）
 * @property {number} marksFrom そのときのヒットマークの数
 */

/**
 * 空の当たりの記録を作る。
 * @returns {ImpactLog} 記録
 */
export function createImpactLog() {
  return { x: [], y: [], time: [], kind: [], heavy: [], step: [] };
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
 * @returns {void}
 */
function addImpact(log, x, y, time, kind, heavy, step) {
  log.x.push(x);
  log.y.push(y);
  log.time.push(time);
  log.kind.push(kind);
  log.heavy.push(heavy);
  log.step.push(step);
}

/**
 * 終わった兵1体の体の中心で当たりを足す。
 * @param {ImpactLog} log 記録
 * @param {StepWatch} watch 段の写し
 * @param {import('./troopMotion.js').TroopUnit} unit 終わった兵
 * @param {number} kind 種類
 * @param {number} heavy 大きな一撃なら 1
 * @param {number} step 段の番号
 * @returns {void}
 */
function addUnitImpact(log, watch, unit, kind, heavy, step) {
  const size = unit.size > 0 ? unit.size : watch.roster.layout.size;
  addImpact(log, unit.end.x, unit.end.y - size / 2, unit.end.time, kind, heavy, step);
}

/**
 * 段の種類ごとの記録の関数の引数。
 * @typedef {Object} RuleContext
 * @property {ImpactLog} log 記録
 * @property {StepWatch} watch 段の写し
 * @property {import('./troopMotion.js').TroopUnit[]} ended その段で終わり方が決まった兵（時刻の昇順）
 * @property {import('./battleSteps.js').BattleStep} step 段
 * @property {number} index 段の番号
 * @property {number} heavy 大きな一撃なら 1
 * @property {string} bodyStyle 敵の体の見せ方
 */

/**
 * 終わった兵すべてを `hit` にする。
 * @param {RuleContext} c 引数
 * @returns {void}
 */
function recordAllHit(c) {
  for (const unit of c.ended) addUnitImpact(c.log, c.watch, unit, IMPACT_KINDS.hit, c.heavy, c.index);
}

/**
 * 終わった兵の前から `step.amount` 体を `castleDamage`、残りを `hit` にする。
 * @param {RuleContext} c 引数
 * @returns {void}
 */
function recordCastleHit(c) {
  c.ended.forEach((unit, k) => {
    addUnitImpact(c.log, c.watch, unit, k < c.step.amount ? IMPACT_KINDS.castleDamage : IMPACT_KINDS.hit, c.heavy, c.index);
  });
}

/**
 * 敵の HP を減らす側の種類の兵の前から `step.amount` 体を `enemyDamage`、それ以外の終わった兵を `hit` にする。
 * @param {RuleContext} c 引数
 * @returns {void}
 */
function recordEnemyHit(c) {
  const damageKind = ENEMY_DAMAGE_KIND[c.bodyStyle];
  let damaged = 0;
  for (const unit of c.ended) {
    let kind = IMPACT_KINDS.hit;
    if (unit.kind === damageKind && damaged < c.step.amount) {
      kind = IMPACT_KINDS.enemyDamage;
      damaged++;
    }
    addUnitImpact(c.log, c.watch, unit, kind, c.heavy, c.index);
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
 * 終わった兵（修理の兵）すべてを `repair` にする（常に大きな一撃ではない）。
 * @param {RuleContext} c 引数
 * @returns {void}
 */
function recordRepair(c) {
  for (const unit of c.ended) addUnitImpact(c.log, c.watch, unit, IMPACT_KINDS.repair, 0, c.index);
}

/**
 * 段の種類ごとの記録の表。表にない段は何も記録しない。
 * @type {Readonly<Object<string, (c: RuleContext) => void>>}
 */
const IMPACT_RULES = Object.freeze({
  block: recordAllHit,
  enemyBlock: recordAllHit,
  armorBlock: recordAllHit,
  strikeBlock: recordAllHit,
  castleHit: recordCastleHit,
  enemyHit: recordEnemyHit,
  strikeCastle: recordStrikeCastle,
  heal: recordRepair,
});

/**
 * 段を組み立てた後に呼び、その段の当たりを記録する。その段で終わり方が決まった兵（写しの時点で未決定だった兵と、段で足された兵のうち
 * `end` のあるもの）を、終わり方の時刻の昇順（同じなら名簿の順）に並べて、段の種類ごとの表で記録する。
 * @param {ImpactLog} log 記録
 * @param {StepWatch} watch `watchStep` の戻り値
 * @param {import('./battleSteps.js').BattleStep} step 組み立てた段
 * @param {number} index 段の番号
 * @param {string} bodyStyle 敵の体の見せ方（'horde'・'figure'）
 * @returns {void}
 */
export function recordStepImpacts(log, watch, step, index, bodyStyle) {
  const rule = IMPACT_RULES[step.type];
  if (rule === undefined) return;
  const ended = watch.open
    .concat(watch.roster.units.slice(watch.firstNew))
    .filter((unit) => unit.end !== null)
    .map((unit, order) => ({ unit, order }))
    .sort((a, b) => a.unit.end.time - b.unit.end.time || a.order - b.order)
    .map((entry) => entry.unit);
  rule({ log, watch, ended, step, index, heavy: step.heavy === true ? 1 : 0, bodyStyle });
}
