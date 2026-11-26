/**
 * 強化の「効き方の種類」ごとの表（出せるか・上限・値の抽選・DEBUG の値・取る・外す・足し分・札の +◯・発動率・手札の枠・精鋭の確率と能力・取る前と後の値・「強化」タブの値）。
 * 強化の種類の識別子では分岐せず、設定の `effect` でこの表を引く（ルール層。渡された乱数だけを使う）。
 */

import { rollAmount } from './enemyBehaviors.js';
import { scaledReleaseBonus, bundleBonus } from './release.js';
import { growHand, shrinkHand } from './hand.js';

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
 * @property {() => Object<string, import('./upgradeBoosts.js').EliteStatus>} eliteStatus ゲージごとの精鋭の確率・能力・ポイントの問い合わせ（状態は変えない）。
 */

/**
 * 効き方の種類1つぶんの行。
 * @typedef {Object} UpgradeEffect
 * @property {(spec: Object, taken: UpgradeTaken) => boolean} canOffer 3択に出せるか。
 * @property {(spec: Object, taken: UpgradeTaken) => boolean} isCapped 上限に着いたか。
 * @property {(spec: Object, random: () => number, taken: UpgradeTaken) => number} roll 3択が出たときに決める値（乱数の呼び出しは行ごとに決まっている）。
 * @property {(spec: Object, taken: UpgradeTaken) => number} fixedValue DEBUG の「取る」ボタンの値（乱数なし）。
 * @property {(game: UpgradeTarget, spec: Object, value: number) => void} take 取ったときにすぐ効くこと。
 * @property {(game: UpgradeTarget, spec: Object, taken: UpgradeTaken) => void} untake DEBUG で外すときに戻すこと。
 * @property {(spec: Object, taken: UpgradeTaken) => number} castleMaxHpBonus 城の最大 HP に足している量。
 * @property {(spec: Object, taken: UpgradeTaken) => Object<string, number>} turnGains ターンの頭にゲージへ足す量（ゲージ → 量）。
 * @property {(spec: Object, taken: UpgradeTaken, card: Object) => number} cardBonus 札の +◯ に足す量。
 * @property {(spec: Object, taken: UpgradeTaken) => number} comboSteps 束の補正の段。
 * @property {(spec: Object, taken: UpgradeTaken) => number} allSuitsExtra 4スートそろいの足し分。
 * @property {(spec: Object, taken: UpgradeTaken) => ChanceActions} actionChance ターンの始まりの行動の発動率と増える数。
 * @property {(spec: Object, taken: UpgradeTaken) => number} handSlots 手札の枠の足し分。
 * @property {(spec: Object, taken: UpgradeTaken) => Object<string, number>} eliteChance 精鋭になる確率の百分率（ゲージ → 百分率）。
 * @property {(spec: Object, taken: UpgradeTaken) => Object<string, number>} elitePower 精鋭の能力の足し分（ゲージ → 量）。
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
  eliteChance: () => ({}),
  elitePower: () => ({}),
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
  cardSuit: Object.freeze({
    ...EFFECT_DEFAULTS,
    roll: (spec) => spec.amount,
    fixedValue: (spec) => spec.amount,
    cardBonus: (spec, taken, card) => (card.suit === spec.suit ? taken.amount : 0),
    preview: (game, spec, taken, value) => ({ before: taken.amount, after: taken.amount + value }),
  }),
  cardRank: Object.freeze({
    ...EFFECT_DEFAULTS,
    roll: (spec) => spec.amount,
    fixedValue: (spec) => spec.amount,
    cardBonus: (spec, taken, card) => (card.rank === spec.rank ? taken.amount : 0),
    preview: (game, spec, taken, value) => ({ before: taken.amount, after: taken.amount + value }),
  }),
  /** 4スートそろいの強化。`preview`・`status` は自分の行の取った記録だけから求める（同じ効き方の行は1つだけの前提）。 */
  allSuitsBoost: Object.freeze({
    ...EFFECT_DEFAULTS,
    canOffer: (spec, taken) => taken.count < spec.maxCount,
    isCapped: (spec, taken) => taken.count >= spec.maxCount,
    roll: (spec) => spec.amount,
    fixedValue: (spec) => spec.amount,
    allSuitsExtra: (spec, taken) => taken.amount,
    preview: (game, spec, taken, value) => {
      const before = game.config.allSuitsBonus + taken.amount;
      return { before, after: before + value, left: spec.maxCount - taken.count - 1 };
    },
    status: (game, spec, taken) => ({ shown: true, value: game.config.allSuitsBonus + taken.amount, limit: 0 }),
  }),
  /** コンボ（束の補正）の強化。`preview`・`status` は自分の行の取った記録だけから求める（同じ効き方の行は1つだけの前提）。 */
  comboBoost: Object.freeze({
    ...EFFECT_DEFAULTS,
    canOffer: (spec, taken) => taken.count < spec.maxCount,
    isCapped: (spec, taken) => taken.count >= spec.maxCount,
    roll: (spec) => spec.amount,
    fixedValue: (spec) => spec.amount,
    comboSteps: (spec, taken) => taken.amount,
    preview: (game, spec, taken, value) => {
      const cards = spec.previewCards;
      const bonusAt = (steps) => bundleBonus(cards, scaledReleaseBonus(game.config.releaseBonus, steps));
      return {
        before: bonusAt(taken.amount),
        after: bonusAt(taken.amount + value),
        cards,
        left: spec.maxCount - taken.count - 1,
      };
    },
    status: (game, spec, taken) => {
      const bonus = scaledReleaseBonus(game.config.releaseBonus, taken.amount);
      return { shown: true, value: bonus.perCard, limit: bonus.max };
    },
  }),
  /** アクションポイント（ターンの始まりに発動率で行動が増える）。取った記録の `amount` がそのまま発動率の百分率になる。 */
  actionChance: Object.freeze({
    ...EFFECT_DEFAULTS,
    canOffer: (spec, taken) => taken.amount < spec.maxPercent,
    isCapped: (spec, taken) => taken.amount >= spec.maxPercent,
    roll: (spec, random, taken) => Math.min(rollAmount(spec.range, random), spec.maxPercent - taken.amount),
    fixedValue: (spec, taken) => Math.min(spec.range.min, spec.maxPercent - taken.amount),
    actionChance: (spec, taken) => ({ percent: taken.amount, actions: spec.actions }),
    preview: (game, spec, taken, value) => ({
      before: taken.amount,
      after: taken.amount + value,
      actions: spec.actions,
    }),
  }),
  /**
   * 精鋭の確率（放った兵が精鋭になる確率。ゲージごと）。取った記録の `amount` がそのまま確率の百分率になる。
   * `preview`・`status` は自分の行の取った記録と、ゲームの合計（`eliteStatus()`）を読む（同じゲージの確率の行・能力の行は1つずつの前提）。
   */
  eliteChance: Object.freeze({
    ...EFFECT_DEFAULTS,
    canOffer: (spec, taken) => taken.amount < spec.maxPercent,
    isCapped: (spec, taken) => taken.amount >= spec.maxPercent,
    roll: (spec, random, taken) => Math.min(rollAmount(spec.range, random), spec.maxPercent - taken.amount),
    fixedValue: (spec, taken) => Math.min(spec.range.min, spec.maxPercent - taken.amount),
    eliteChance: (spec, taken) => ({ [spec.gauge]: taken.amount }),
    preview: (game, spec, taken, value) => ({ before: taken.amount, after: taken.amount + value }),
    status: (game, spec, taken) => ({
      shown: true,
      value: taken.amount,
      limit: game.eliteStatus()[spec.gauge].power,
    }),
  }),
  /**
   * 精鋭の能力（精鋭1体のポイントに足す量。ゲージごと。上限なし）。乱数は呼ばない。
   * `preview` はゲームの合計（`eliteStatus()`）から精鋭1体のポイントの前後を求める（同じゲージの確率の行・能力の行は1つずつの前提）。
   * 「強化」タブの行は確率の行に能力を並べるので、この行は出さない。
   */
  elitePower: Object.freeze({
    ...EFFECT_DEFAULTS,
    roll: (spec) => spec.amount,
    fixedValue: (spec) => spec.amount,
    elitePower: (spec, taken) => ({ [spec.gauge]: taken.amount }),
    preview: (game, spec, taken, value) => {
      const before = game.eliteStatus()[spec.gauge].points;
      return { before, after: before + value };
    },
    status: () => ({ shown: false, value: 0, limit: 0 }),
  }),
  /** 次の戦闘の間の行動（敵を倒すまで毎ターン行動が増える。重ねて取っても足し分は増えない）。 */
  battleActions: Object.freeze({
    ...EFFECT_DEFAULTS,
    roll: (spec) => spec.amount,
    fixedValue: (spec) => spec.amount,
    take: (game, spec, value) => {
      game.battleActionBonus = Math.max(game.battleActionBonus, value);
    },
    untake: (game) => {
      game.battleActionBonus = 0;
    },
    preview: (game, spec, taken, value) => ({
      before: game.battleActionBonus,
      after: Math.max(game.battleActionBonus, value),
    }),
    status: (game) => ({ shown: game.battleActionBonus > 0, value: game.battleActionBonus, limit: 0 }),
  }),
  /** 手札の枠の強化（取るとその場で枠が増える。外すと元の枠の数に戻り、外した枠の札は捨て札の後ろへ移る）。 */
  handSlot: Object.freeze({
    ...EFFECT_DEFAULTS,
    canOffer: (spec, taken) => taken.count < spec.maxCount,
    isCapped: (spec, taken) => taken.count >= spec.maxCount,
    roll: (spec) => spec.amount,
    fixedValue: (spec) => spec.amount,
    take: (game, spec, value) => {
      game.hand = growHand(game.hand, value);
    },
    untake: (game, spec, taken) => {
      const shrunk = shrinkHand(game.hand, game.hand.length - taken.amount);
      game.hand = shrunk.hand;
      game.discard.push(...shrunk.removed);
    },
    handSlots: (spec, taken) => taken.amount,
    preview: (game, spec, taken, value) => ({
      before: game.hand.length,
      after: game.hand.length + value,
    }),
    status: (game) => ({ shown: true, value: game.hand.length, limit: 0 }),
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
