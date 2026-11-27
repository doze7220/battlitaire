/**
 * 責務: DEBUG タブで変えられるルールの値の項目の表（RULE_ITEMS）を、`RULES` の形から城・★の抽選と敵の種類・行動の決まりの種類・分裂（子を持つ敵）ごとに組み立てて持つ。
 * 状態を持たない純粋な表と引く関数（ルール層）。
 */

import { RULES } from './config.js';
import { enemyTypeIds } from './enemyTypes.js';
import { unitPointsOf } from './unitPoints.js';

/**
 * DEBUG タブで変えられるルールの値の項目。
 * @typedef {Object} RuleItem
 * @property {string} id 識別子（例 'castle.maxHp'、'goblins.attack.min'）。
 * @property {string} group 組（'castle'・'stageStars'（★の抽選）か敵の種類の識別子）。
 * @property {string} kind 値の種類（'castleMaxHp'|'enemyMaxHp'|'defense'|'amount'|'chance'|'percent'|'risePercent'|'cycleLength'|'burn'|'chargeTurns'。'percent' は 0〜100 の整数の百分率、'risePercent' は★の抽選の1ステージごとに上がる確率の量（0〜100 の整数の百分率））。
 * @property {string} name 項目の名前の識別子（DEBUG タブが文字を引く）。
 * @property {string} timing 今の敵（城・★の抽選）のときに効く時期（'now'|'nextIntent'|'nextCycle'|'nextCharge'|'nextBattle'|'nextStage'）。
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
 * @returns {Readonly<RuleItem>[]} [最小, 最大]
 */
function rangeItems(baseId, group, baseName, kind, rangeOf, unit = null) {
  const minId = `${baseId}.min`;
  const maxId = `${baseId}.max`;
  return [
    item(minId, group, kind, `${baseName}Min`, 'nextIntent', maxId, 'min',
      (c) => rangeOf(c).min, (c, v) => { rangeOf(c).min = v; }, unit),
    item(maxId, group, kind, `${baseName}Max`, 'nextIntent', minId, 'max',
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
 * 設定から項目の表を組み立てる（城 → ★の抽選 → 設定に書いた順の敵）。
 * @param {any} rules ルールの調整値
 * @returns {readonly Readonly<RuleItem>[]} 項目の並び
 * @throws {Error} 知らない行動の決まりの種類のとき
 */
function buildItems(rules) {
  const items = [
    item('castle.maxHp', 'castle', 'castleMaxHp', 'maxHp', 'now', null, null,
      (c) => c.castleMaxHp, (c, v) => { c.castleMaxHp = v; }),
    ...stageStarItems(rules),
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
 * 変えられるルールの値の項目の並び（凍結。城 → ★の抽選 → 敵の順）。
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
