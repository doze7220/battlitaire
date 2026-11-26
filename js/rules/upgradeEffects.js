/**
 * 強化の「効き方の種類」ごとの表（出せるか・上限・値の抽選・DEBUG の値・取る・外す・足し分・札の +◯・発動率・手札の枠・取る前と後の値・「強化」タブの値）。
 * 強化の種類の識別子では分岐せず、設定の `effect` でこの表を引く（ルール層。渡された乱数だけを使う）。
 */

import { rollAmount } from './enemyBehaviors.js';

/**
 * 取った強化の1種類ぶんの記録。
 * @typedef {Object} UpgradeTaken
 * @property {number} count 取った回数（取っていなければ 0）。
 * @property {number} amount 効いた量の合計（最大 HP は増えた量、自動兵士は1ターンに足す兵の数）。
 */

/**
 * 選択肢の文字に出す、取る前と後の値。
 * @typedef {Object} UpgradePreview
 * @property {number} before 取る前の値。
 * @property {number} after 取った後の値。
 * @property {number} [left] 取った後にあと何回取れるか（回数の上限がある強化だけ）。
 * @property {number} [cards] コンボの説明に出す束の枚数。
 * @property {number} [actions] アクションポイントの発動で増える行動の数。
 */

/**
 * 「強化」タブの行に出すか・出す値。
 * @typedef {Object} UpgradeStatus
 * @property {boolean} shown 行を出すか。
 * @property {number} value 出す値。
 * @property {number} limit 2つ目の値（コンボの上限。使わなければ 0）。
 */

/**
 * ターンの始まりの行動の発動率と、発動で増える行動の数。
 * @typedef {Object} ChanceActions
 * @property {number} percent 発動率の百分率（整数）。
 * @property {number} actions 発動で増える行動の数。
 */

/**
 * ゲームのうち、効き方の表が触る部分。
 * @typedef {Object} UpgradeTarget
 * @property {{ hp: number, maxHp: number }} castle 城。
 * @property {Object} config ルールの設定。
 * @property {Object} upgrades 取った強化の状態。
 * @property {Array} hand 手札（枠の並び）。
 * @property {Array} discard 捨て札。
 * @property {number} battleActionBonus この戦闘の間の行動の足し分。
 */

/**
 * 効き方の種類1つぶんの行。
 * @typedef {Object} UpgradeEffect
 * @property {(spec: Object, taken: UpgradeTaken) => boolean} canOffer 3択に出せるか。
 * @property {(spec: Object, taken: UpgradeTaken) => boolean} isCapped 上限に着いたか。
 * @property {(spec: Object, random: () => number, taken: UpgradeTaken) => number} roll 3択が出たときに決める値（乱数の呼び出しは行ごとに決まっている）。
 * @property {(spec: Object, taken: UpgradeTaken) => number} fixedValue DEBUG の「+1」の値（乱数なし）。
 * @property {(game: UpgradeTarget, spec: Object, value: number) => void} take 取ったときにすぐ効くこと。
 * @property {(game: UpgradeTarget, spec: Object, taken: UpgradeTaken) => void} untake DEBUG で外すときに戻すこと。
 * @property {(spec: Object, taken: UpgradeTaken) => number} castleMaxHpBonus 城の最大 HP に足している量。
 * @property {(spec: Object, taken: UpgradeTaken) => Object<string, number>} turnGains ターンの頭にゲージへ足す量（ゲージ → 量）。
 * @property {(spec: Object, taken: UpgradeTaken, card: Object) => number} cardBonus 札の +◯ に足す量。
 * @property {(spec: Object, taken: UpgradeTaken) => number} comboSteps 束の補正の段。
 * @property {(spec: Object, taken: UpgradeTaken) => number} allSuitsExtra 4スートそろいの足し分。
 * @property {(spec: Object, taken: UpgradeTaken) => ChanceActions} actionChance ターンの始まりの行動の発動率と増える数。
 * @property {(spec: Object, taken: UpgradeTaken) => number} handSlots 手札の枠の足し分。
 * @property {(game: UpgradeTarget, spec: Object, taken: UpgradeTaken) => UpgradeStatus} status 「強化」タブの行に出すか・値。
 * @property {(game: UpgradeTarget, spec: Object, taken: UpgradeTaken, value: number) => UpgradePreview} preview 取る前と後の値（状態は変えない）。
 */

/**
 * 効き方の既定の口（各行に広げる。行は自分に要る口だけ上書きする）。
 * @type {Readonly<Partial<UpgradeEffect>>}
 */
export const EFFECT_DEFAULTS = Object.freeze({
  canOffer: () => true,
  isCapped: () => false,
  take: () => {},
  untake: () => {},
  castleMaxHpBonus: () => 0,
  turnGains: () => ({}),
  cardBonus: () => 0,
  comboSteps: () => 0,
  allSuitsExtra: () => 0,
  actionChance: () => ({ percent: 0, actions: 0 }),
  handSlots: () => 0,
  status: (game, spec, taken) => ({ shown: true, value: taken.amount, limit: 0 }),
});

/**
 * 効き方の種類 → 行。
 * @type {Readonly<Object<string, Readonly<UpgradeEffect>>>}
 */
export const UPGRADE_EFFECTS = Object.freeze({
  castleMaxHp: Object.freeze({
    ...EFFECT_DEFAULTS,
    roll: (spec, random) => rollAmount(spec.range, random),
    fixedValue: (spec) => spec.range.min,
    take: (game, spec, value) => {
      game.castle.maxHp += value;
      game.castle.hp += value;
    },
    untake: (game, spec, taken) => {
      game.castle.maxHp -= taken.amount;
      if (game.castle.hp > game.castle.maxHp) game.castle.hp = game.castle.maxHp;
    },
    castleMaxHpBonus: (spec, taken) => taken.amount,
    preview: (game, spec, taken, value) => ({
      before: game.castle.maxHp,
      after: game.castle.maxHp + value,
    }),
  }),
  autoTroop: Object.freeze({
    ...EFFECT_DEFAULTS,
    roll: (spec) => spec.amount,
    fixedValue: (spec) => spec.amount,
    turnGains: (spec, taken) => ({ [spec.gauge]: taken.amount }),
    preview: (game, spec, taken, value) => ({
      before: taken.amount,
      after: taken.amount + value,
    }),
  }),
});

/**
 * 強化の設定から効き方の行を引く。
 * @param {{ effect: string }} spec 強化の設定
 * @returns {Readonly<UpgradeEffect>} 効き方の行
 * @throws {Error} 表にない効き方の種類のとき
 */
export function effectOf(spec) {
  const effect = Object.hasOwn(UPGRADE_EFFECTS, spec.effect) ? UPGRADE_EFFECTS[spec.effect] : undefined;
  if (effect === undefined) throw new Error(`unknown upgrade effect: ${spec.effect}`);
  return effect;
}
