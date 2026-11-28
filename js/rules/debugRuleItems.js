/**
 * 責務: DEBUG タブで変えられるルールの値の項目の表（RULE_ITEMS）を、`RULES` の形から城・★の抽選・激昂と敵の種類・行動の決まりの種類・分裂（子を持つ敵）ごとに組み立てて持つ。
 * 状態を持たない純粋な表と引く関数（ルール層）。
 */

import { RULES } from './config.js';
import { enemyTypeIds } from './enemyTypes.js';
import { unitPointsOf } from './unitPoints.js';

/**
 * DEBUG タブで変えられるルールの値の項目。
 * @typedef {Object} RuleItem
 * @property {string} id 識別子（例 'castle.maxHp'、'goblins.attack.min'）。
 * @property {string} group 組（'castle'・'stageStars'（★の抽選）・'rage'（激昂）か敵の種類の識別子）。
 * @property {string} kind 値の種類（'castleMaxHp'|'enemyMaxHp'|'defense'|'amount'|'chance'|'percent'|'risePercent'|'rageTurn'|'rageStep'|'cycleLength'|'burn'|'chargeTurns'|'confuseTurns'|'fortifyTurns'|'fortifyCount'。'fortifyTurns' は防御を取る間隔のターン数（1 以上の整数）、'fortifyCount' は身をかがめるまでに防御を取る回数（1 以上の整数）、'percent' は 0〜100 の整数の百分率、'risePercent' は★の抽選の1ステージごとに上がる確率の量（0〜100 の整数の百分率）、'rageTurn' は激昂の始まる戦闘のターン（1 以上の整数）、'rageStep' は激昂の1ターンごとに上がる倍率の量（0 以上の整数の百分率））。
 * @property {string} name 項目の名前の識別子（DEBUG タブが文字を引く）。
 * @property {string} timing 今の敵（城・★の抽選）のときに効く時期（'now'|'nextIntent'|'nextCycle'|'nextCharge'|'nextConfuse'|'nextFortify'|'nextTackle'|'nextBattle'|'nextStage'）。
 * @property {string|null} pairId 最小と最大の組の相手の id（組でなければ null）。
 * @property {'min'|'max'|null} side 組の中で自分が最小か最大か（組でなければ null）。
 * @property {(config: any) => number} get 設定から値を読む。
 * @property {(config: any, value: number) => void} set 設定の値を書く（写しにだけ使う）。
 * @property {number|null} unit 1体のポイントの刻み（HP・攻撃・防御の量の項目だけ、その敵の `unitPointsOf(spec)`。ほか（城・確率・周期・溜めのターン数・燃やす札・巨人の回復の量）は null）。
 */

/**
 * 項目を作る（凍結して返す）。
 * @param {string} id 識別子
 * @param {string} group 組
 * @param {string} kind 値の種類
 * @param {string} name 項目の名前の識別子
 * @param {string} timing 効く時期
 * @param {string|null} pairId 組の相手の id
 * @param {'min'|'max'|null} side 組の中の側
 * @param {(config: any) => number} get 読む関数
 * @param {(config: any, value: number) => void} set 書く関数
 * @param {number|null} [unit] 1体のポイントの刻み（量の項目だけ。既定 null）
 * @returns {Readonly<RuleItem>} 項目
 */
function item(id, group, kind, name, timing, pairId, side, get, set, unit = null) {
  return Object.freeze({ id, group, kind, name, timing, pairId, side, get, set, unit });
}

/**
 * 最小と最大の組の2項目を作る。
 * @param {string} baseId 'T.xxx' の部分（'.min'・'.max' を足して id にする）
 * @param {string} group 組
 * @param {string} baseName 項目の名前の前半（'attack' なら 'attackMin'・'attackMax'）
 * @param {string} kind 値の種類
 * @param {(config: any) => { min: number, max: number }} rangeOf 設定から範囲のオブジェクトを引く
 * @param {number|null} [unit] 1体のポイントの刻み（量の幅だけ。既定 null）
 * @param {string} [timing] 効く時期（既定 'nextIntent'。混乱の間隔は 'nextConfuse'、防御を取る間隔は 'nextFortify'、防御を取る回数は 'nextTackle'）
 * @returns {Readonly<RuleItem>[]} [最小, 最大]
 */
function rangeItems(baseId, group, baseName, kind, rangeOf, unit = null, timing = 'nextIntent') {
  const minId = `${baseId}.min`;
  const maxId = `${baseId}.max`;
  return [
    item(minId, group, kind, `${baseName}Min`, timing, maxId, 'min',
      (c) => rangeOf(c).min, (c, v) => { rangeOf(c).min = v; }, unit),
    item(maxId, group, kind, `${baseName}Max`, timing, minId, 'max',
      (c) => rangeOf(c).max, (c, v) => { rangeOf(c).max = v; }, unit),
  ];
}

/**
 * 行動の決まりの種類ごとの、敵の行動の項目（最大 HP より後）の組み立ての表。
 * @type {Readonly<Object<string, (typeId: string, behavior: any, unit: number) => Readonly<RuleItem>[]>>}
 */
const BEHAVIOR_ITEMS = Object.freeze({
  steady: (typeId, behavior, unit) => rangeItems(`${typeId}.attack`, typeId, 'attack', 'amount',
    (c) => c.enemies[typeId].behavior.attackRange, unit),
  assault: (typeId, behavior, unit) => rangeItems(`${typeId}.attack`, typeId, 'attack', 'amount',
    (c) => c.enemies[typeId].behavior.attackRange, unit),
  cycle: (typeId, behavior, unit) => {
    const items = [
      item(`${typeId}.cycleLength`, typeId, 'cycleLength', 'cycleLength', 'nextCycle', null, null,
        (c) => c.enemies[typeId].behavior.cycleLength,
        (c, v) => { c.enemies[typeId].behavior.cycleLength = v; }),
      ...rangeItems(`${typeId}.attack`, typeId, 'attack', 'amount', (c) => c.enemies[typeId].behavior.attackRange, unit),
    ];
    if (behavior.attackHeal) {
      items.push(
        item(`${typeId}.heal.chance`, typeId, 'chance', 'healChance', 'nextBattle', null, null,
          (c) => c.enemies[typeId].behavior.attackHeal.chance,
          (c, v) => { c.enemies[typeId].behavior.attackHeal.chance = v; }),
        item(`${typeId}.heal.amount`, typeId, 'amount', 'healAmount', 'nextBattle', null, null,
          (c) => c.enemies[typeId].behavior.attackHeal.amount,
          (c, v) => { c.enemies[typeId].behavior.attackHeal.amount = v; }),
      );
    }
    return items;
  },
  inhale: (typeId, behavior, unit) => [
    ...rangeItems(`${typeId}.claw`, typeId, 'claw', 'amount', (c) => c.enemies[typeId].behavior.claw.range, unit),
    ...rangeItems(`${typeId}.breath`, typeId, 'breath', 'amount', (c) => c.enemies[typeId].behavior.breath.range, unit),
    ...rangeItems(`${typeId}.burn`, typeId, 'burn', 'burn', (c) => c.enemies[typeId].behavior.breath.burn),
    item(`${typeId}.inhaleChance`, typeId, 'chance', 'inhaleChance', 'nextIntent', null, null,
      (c) => c.enemies[typeId].behavior.inhaleChance,
      (c, v) => { c.enemies[typeId].behavior.inhaleChance = v; }),
  ],
  buildup: (typeId, behavior, unit) => [
    ...rangeItems(`${typeId}.attack`, typeId, 'attack', 'amount', (c) => c.enemies[typeId].behavior.attackRange, unit),
    ...rangeItems(`${typeId}.heavy`, typeId, 'heavy', 'amount', (c) => c.enemies[typeId].behavior.heavyRange, unit),
    item(`${typeId}.chargeChance`, typeId, 'chance', 'chargeChance', 'nextIntent', null, null,
      (c) => c.enemies[typeId].behavior.chargeChance,
      (c, v) => { c.enemies[typeId].behavior.chargeChance = v; }),
    item(`${typeId}.chargeTurns`, typeId, 'chargeTurns', 'chargeTurns', 'nextCharge', null, null,
      (c) => c.enemies[typeId].behavior.chargeTurns,
      (c, v) => { c.enemies[typeId].behavior.chargeTurns = v; }),
  ],
  brood: (typeId, behavior, unit) => [
    ...rangeItems(`${typeId}.attack`, typeId, 'youngAttack', 'amount', (c) => c.enemies[typeId].behavior.attackRange, unit),
    item(`${typeId}.protectChance`, typeId, 'chance', 'protectChance', 'nextIntent', null, null,
      (c) => c.enemies[typeId].behavior.protectChance,
      (c, v) => { c.enemies[typeId].behavior.protectChance = v; }),
    ...rangeItems(`${typeId}.protect`, typeId, 'protect', 'defense', (c) => c.enemies[typeId].behavior.protectRange, unit),
    ...rangeItems(`${typeId}.rush`, typeId, 'rush', 'amount', (c) => c.enemies[typeId].behavior.rushRange, unit),
    item(`${typeId}.rageChance`, typeId, 'chance', 'rageChance', 'nextIntent', null, null,
      (c) => c.enemies[typeId].behavior.rageChance,
      (c, v) => { c.enemies[typeId].behavior.rageChance = v; }),
    ...rangeItems(`${typeId}.bigRush`, typeId, 'bigRush', 'amount', (c) => c.enemies[typeId].behavior.bigRushRange, unit),
  ],
  either: (typeId, behavior, unit) => [
    item(`${typeId}.attackChance`, typeId, 'chance', 'attackChance', 'nextIntent', null, null,
      (c) => c.enemies[typeId].behavior.attackChance,
      (c, v) => { c.enemies[typeId].behavior.attackChance = v; }),
    ...rangeItems(`${typeId}.attack`, typeId, 'attack', 'amount', (c) => c.enemies[typeId].behavior.attackRange, unit),
    ...rangeItems(`${typeId}.guard`, typeId, 'defense', 'defense', (c) => c.enemies[typeId].behavior.guardRange, unit),
    item(`${typeId}.bigGuardChance`, typeId, 'chance', 'bigGuardChance', 'nextIntent', null, null,
      (c) => c.enemies[typeId].behavior.bigGuardChance,
      (c, v) => { c.enemies[typeId].behavior.bigGuardChance = v; }),
    ...rangeItems(`${typeId}.bigGuard`, typeId, 'bigGuard', 'defense', (c) => c.enemies[typeId].behavior.bigGuardRange, unit),
  ],
  // 混乱の周期。最初の混乱のターン（firstConfuseTurn）はスライダーに出さない（今の敵には効かず「出てきたときから」しか効かないため）
  confuse: (typeId, behavior, unit) => [
    ...rangeItems(`${typeId}.attack`, typeId, 'attack', 'amount', (c) => c.enemies[typeId].behavior.attackRange, unit),
    item(`${typeId}.heavyChance`, typeId, 'chance', 'strongAttackChance', 'nextIntent', null, null,
      (c) => c.enemies[typeId].behavior.heavyChance,
      (c, v) => { c.enemies[typeId].behavior.heavyChance = v; }),
    ...rangeItems(`${typeId}.heavy`, typeId, 'strongAttack', 'amount', (c) => c.enemies[typeId].behavior.heavyRange, unit),
    ...rangeItems(`${typeId}.bigGuard`, typeId, 'thickGuard', 'defense', (c) => c.enemies[typeId].behavior.bigGuardRange, unit),
    ...rangeItems(`${typeId}.confuseInterval`, typeId, 'confuseInterval', 'confuseTurns',
      (c) => c.enemies[typeId].behavior.confuseInterval, null, 'nextConfuse'),
  ],
  // 防御を溜めて体当たり。最初の防御を取るのターン（firstFortifyTurn）はスライダーに出さない（今の敵には「次の体当たりの後から」しか効かないため）
  hoard: (typeId, behavior, unit) => [
    ...rangeItems(`${typeId}.attack`, typeId, 'attack', 'amount', (c) => c.enemies[typeId].behavior.attackRange, unit),
    ...rangeItems(`${typeId}.fortify`, typeId, 'fortify', 'defense', (c) => c.enemies[typeId].behavior.fortifyRange, unit),
    ...rangeItems(`${typeId}.fortifyInterval`, typeId, 'fortifyInterval', 'fortifyTurns',
      (c) => c.enemies[typeId].behavior.fortifyInterval, null, 'nextFortify'),
    ...rangeItems(`${typeId}.fortifyCount`, typeId, 'fortifyCount', 'fortifyCount',
      (c) => c.enemies[typeId].behavior.fortifyCount, null, 'nextTackle'),
  ],
});

/**
 * 敵の防御の項目（張る確率と量の幅）を作る。行動と別に防御を抽選する敵（`defense` を持つ敵）だけ。
 * @param {string} typeId 敵の種類の識別子
 * @param {any} spec 敵の設定
 * @param {number} unit 1体のポイント
 * @returns {Readonly<RuleItem>[]} [確率, 最小, 最大]。`defense` を持たない敵は空
 */
function defenseItems(typeId, spec, unit) {
  if (!spec.defense) return [];
  return [
    item(`${typeId}.defense.chance`, typeId, 'chance', 'defenseChance', 'nextIntent', null, null,
      (c) => c.enemies[typeId].defense.chance,
      (c, v) => { c.enemies[typeId].defense.chance = v; }),
    ...rangeItems(`${typeId}.defense`, typeId, 'defense', 'defense', (c) => c.enemies[typeId].defense.range, unit),
  ];
}

/**
 * 敵の分裂の項目（子が生まれる割合）を作る。分裂を持つ敵（`split` を持つ敵）だけ。
 * @param {string} typeId 敵の種類の識別子
 * @param {any} spec 敵の設定
 * @returns {Readonly<RuleItem>[]} [割合]（0〜100 の整数。次の攻防から効く）。`split` を持たない敵は空
 */
function splitItems(typeId, spec) {
  if (!spec.split) return [];
  return [
    item(`${typeId}.split.percent`, typeId, 'percent', 'splitPercent', 'nextBattle', null, null,
      (c) => c.enemies[typeId].split.percent,
      (c, v) => { c.enemies[typeId].split.percent = v; }),
  ];
}

/**
 * ★の抽選の項目（抽選の行ごとの、1ステージごとに上がる確率の量）を作る。
 * @param {any} rules ルールの調整値
 * @returns {Readonly<RuleItem>[]} 抽選の行の並びごとに1つ（項目名は `riseStar{★}`。次のステージから効く）
 */
function stageStarItems(rules) {
  return rules.stageStars.draws.map((d, i) =>
    item(`stageStars.star${d.star}.rise`, 'stageStars', 'risePercent', `riseStar${d.star}`, 'nextStage', null, null,
      (c) => c.stageStars.draws[i].risePercent,
      (c, v) => { c.stageStars.draws[i].risePercent = v; }));
}

/**
 * 激昂の項目（始まるターンと、1ターンごとに上がる倍率の量）を作る。どちらもすぐ効く（今の予告の攻撃の量を数え直す）。
 * @returns {Readonly<RuleItem>[]} [始まるターン, 上がる量]
 */
function rageItems() {
  return [
    item('rage.fromTurn', 'rage', 'rageTurn', 'rageFromTurn', 'now', null, null,
      (c) => c.rage.fromTurn, (c, v) => { c.rage.fromTurn = v; }),
    item('rage.stepPercent', 'rage', 'rageStep', 'rageStepPercent', 'now', null, null,
      (c) => c.rage.stepPercent, (c, v) => { c.rage.stepPercent = v; }),
  ];
}

/**
 * 設定から項目の表を組み立てる（城 → ★の抽選 → 激昂 → 設定に書いた順の敵）。
 * @param {any} rules ルールの調整値
 * @returns {readonly Readonly<RuleItem>[]} 項目の並び
 * @throws {Error} 知らない行動の決まりの種類のとき
 */
function buildItems(rules) {
  const items = [
    item('castle.maxHp', 'castle', 'castleMaxHp', 'maxHp', 'now', null, null,
      (c) => c.castleMaxHp, (c, v) => { c.castleMaxHp = v; }),
    ...stageStarItems(rules),
    ...rageItems(),
  ];
  for (const typeId of enemyTypeIds(rules)) {
    const behavior = rules.enemies[typeId].behavior;
    const unit = unitPointsOf(rules.enemies[typeId]);
    const build = BEHAVIOR_ITEMS[behavior.type];
    if (!build) throw new Error(`unknown enemy behavior type: ${behavior.type}`);
    items.push(
      item(`${typeId}.maxHp`, typeId, 'enemyMaxHp', rules.enemies[typeId].brood ? 'maxHpTotal' : 'maxHp', 'now', null, null,
        (c) => c.enemies[typeId].maxHp, (c, v) => { c.enemies[typeId].maxHp = v; }, unit),
      ...build(typeId, behavior, unit),
      ...splitItems(typeId, rules.enemies[typeId]),
      ...defenseItems(typeId, rules.enemies[typeId], unit),
    );
  }
  return items;
}

/**
 * 変えられるルールの値の項目の並び（凍結。城 → ★の抽選 → 激昂 → 敵の順）。
 * @type {readonly Readonly<RuleItem>[]}
 */
export const RULE_ITEMS = Object.freeze(buildItems(RULES));

/**
 * 識別子から項目を引く。
 * @param {string} id 項目の識別子
 * @returns {Readonly<RuleItem>|null} 項目。なければ null
 */
export function ruleItemById(id) {
  return RULE_ITEMS.find((it) => it.id === id) ?? null;
}
