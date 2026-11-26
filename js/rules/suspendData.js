/**
 * 責務: 中断データ（ターンの始まり、または3択の段階（候補が決まった後）のゲームの状態）の形（版番号・項目の表）、ゲームからデータへの変換、データの確かめ、データからゲームへの復元。
 * 純粋な計算だけ（保存先・画面・エンジンには触れない。ルール層）。
 */

import { RULES } from './config.js';
import { Game } from './Game.js';
import { createRng, isRngState } from './rng.js';
import { createDecks } from './piles.js';
import { enemyTypeIds, enemySpecOf } from './enemyTypes.js';
import { isBehaviorState } from './enemyBehaviors.js';
import { isGameStats } from './gameStats.js';
import { isBattleRecord } from './battleRecord.js';
import { isUpgradeState } from './upgrades.js';
import { isEliteState } from './elites.js';
import { isUpgradeOffer } from './upgradeOffer.js';
import { handSizeOf } from './upgradeBoosts.js';

/**
 * 中断データの版番号（形が変わったら上げる。版番号はここ1か所）。
 * 4: 強化のカード・特別の枠（この戦闘の間の足し分 `battleActionBonus`・強化から決まる手札の枠の数）を足したとき 3 から上げた。
 * 5: 精鋭の状態 `elites` を足したとき 4 から上げた。
 * 6: スコア（結果の記録の形の変更）と戦闘の記録 `battleRecord` を足したとき 5 から上げた。
 * @type {number}
 */
export const SUSPEND_VERSION = 6;

/**
 * 中断データ（ターンの始まり、または3択の段階の状態。`null`・真偽値・文字列・数・配列・プレーンなオブジェクトだけでできている）。
 * 保存しないもの: `outcome`（いつも null）・`config`・画面の状態。
 * @typedef {Object} SuspendData
 * @property {number} version 版番号（`SUSPEND_VERSION`）
 * @property {number[]} rng 乱数の状態（4つの整数）
 * @property {number} seed 敵の並びの種
 * @property {number} stageNumber ステージの番号
 * @property {'planning'|'choosing'} stage 段階（'planning' はターンの始まり、'choosing' は3択を選んでいる）
 * @property {number} phase 通しのフェーズ（ターン）
 * @property {number} battleTurn 戦闘のターン
 * @property {number} actionsMax そのターンの行動の回数
 * @property {number} actionsLeft 残りの行動の回数
 * @property {{ suit: string, cards: import('./card.js').Card[] }[]} decks 山札（並びの順）
 * @property {import('./card.js').Card[]} discard 捨て札
 * @property {import('./card.js').Card[][]} columns 列
 * @property {(import('./card.js').Card|null)[]} hand 手札（`null` は空き枠。長さは設定の初めの枠の数 + 取った手札の枠）
 * @property {number} battleActionBonus この戦闘の間、毎ターン足す行動の数（3択の段階では 0）
 * @property {Object<string, number>} gauges ゲージの識別子 → 値
 * @property {{ hp: number, maxHp: number }} castle 城
 * @property {{ typeId: string, hp: number, maxHp: number, intent: import('./combatants.js').EnemyIntent, behaviorState: object }} enemy 敵（名前は設定から引くので持たない）
 * @property {import('./gameStats.js').GameStats} stats 結果の記録（倒した数・総ターン数・スコア・項目ごとの合計と回数・倒した敵の並び・最大の一撃・一番長いコンボ）
 * @property {import('./battleRecord.js').BattleRecord} battleRecord 今の敵との戦闘の記録（使ったターン数・城が被害を受けたか・一番長い区切りの枚数。3択の段階では倒した敵の記録）
 * @property {import('./upgrades.js').UpgradeState} upgrades 取った強化
 * @property {import('./elites.js').EliteState} elites ゲージごとの精鋭の数と上振れ（ターンの始まりはいつも 0、3択の段階は攻防のターンの値）
 * @property {import('./upgradeOffer.js').UpgradeOffer|null} upgradeOffer 3択の候補（3択の段階のときだけ。それ以外は null）
 */

/**
 * 項目の1行。
 * @typedef {Object} SuspendField
 * @property {(game: Game) => unknown} save ゲームからこの項目の値を取り出す（共有しない写し）
 * @property {(value: unknown, config: Readonly<import('./config.js').Rules>) => boolean} check 値の形が正しいか（例外を投げない）
 * @property {(game: Game, value: unknown) => void} load 値（写して使う）をゲームに上書きする
 */

/**
 * 値がプレーンなオブジェクトか。
 * @param {unknown} value 調べる値
 * @returns {boolean} `null`・配列でないオブジェクトなら true
 */
function isPlain(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 値が `min` 以上の整数か。
 * @param {unknown} value 調べる値
 * @param {number} min 下限
 * @returns {boolean} 整数で `min` 以上なら true
 */
function isIntFrom(value, min) {
  return Number.isInteger(value) && /** @type {number} */ (value) >= min;
}

/**
 * 値がカード（`id`・`suit`・`rank`）の形か。
 * @param {unknown} value 調べる値
 * @returns {boolean} 形が合えば true
 */
function isCardShape(value) {
  return isPlain(value) && Number.isInteger(value.id) && typeof value.suit === 'string' && Number.isInteger(value.rank);
}

/**
 * 値がカードの配列か。
 * @param {unknown} value 調べる値
 * @returns {boolean} 全部がカードの形の配列なら true
 */
function isCardList(value) {
  return Array.isArray(value) && value.every(isCardShape);
}

/**
 * 知っている予告の種類（凍結の並び）。
 * @type {ReadonlyArray<string>}
 */
const INTENT_KINDS = Object.freeze(['attack', 'windup', 'guard']);

/**
 * 予告の形が正しいか。
 * @param {unknown} value 調べる値
 * @returns {boolean} `kind` が 'attack'・'windup'・'guard'、`amount`・`baseDefense`・`defense` が 0 以上の整数、`variant` は無いか文字列、`burn` は無いか 0 ≤ min ≤ max の整数なら true
 */
function isIntentShape(value) {
  if (!isPlain(value)) return false;
  if (!INTENT_KINDS.includes(value.kind)) return false;
  if (!isIntFrom(value.amount, 0) || !isIntFrom(value.baseDefense, 0) || !isIntFrom(value.defense, 0)) return false;
  if (value.variant !== undefined && typeof value.variant !== 'string') return false;
  if (value.burn !== undefined) {
    const burn = value.burn;
    if (!isPlain(burn) || !isIntFrom(burn.min, 0) || !Number.isInteger(burn.max) || burn.max < burn.min) return false;
  }
  return true;
}

/**
 * 項目の表（保存・確かめ・戻しを1行にまとめる。状態が増えたらここへ1行足し、`SUSPEND_VERSION` を上げる）。
 * @type {Readonly<Object<string, Readonly<SuspendField>>>}
 */
const FIELDS = Object.freeze({
  rng: Object.freeze({
    save: (game) => game.rng.state(),
    check: (value) => isRngState(value),
    load: (game, value) => game.rng.setState(/** @type {number[]} */ (value)),
  }),
  seed: Object.freeze({
    save: (game) => game.seed,
    check: (value) => Number.isInteger(value),
    load: (game, value) => {
      game.seed = /** @type {number} */ (value);
    },
  }),
  stageNumber: Object.freeze({
    save: (game) => game.stageNumber,
    check: (value) => isIntFrom(value, 1),
    load: (game, value) => {
      game.stageNumber = /** @type {number} */ (value);
    },
  }),
  stage: Object.freeze({
    save: (game) => game.stage,
    check: (value) => value === 'planning' || value === 'choosing',
    load: (game, value) => {
      game.stage = /** @type {'planning'|'choosing'} */ (value);
    },
  }),
  phase: Object.freeze({
    save: (game) => game.phase,
    check: (value) => isIntFrom(value, 1),
    load: (game, value) => {
      game.phase = /** @type {number} */ (value);
    },
  }),
  battleTurn: Object.freeze({
    save: (game) => game.battleTurn,
    check: (value) => isIntFrom(value, 1),
    load: (game, value) => {
      game.battleTurn = /** @type {number} */ (value);
    },
  }),
  actionsMax: Object.freeze({
    save: (game) => game.actionsMax,
    check: (value) => isIntFrom(value, 0),
    load: (game, value) => {
      game.actionsMax = /** @type {number} */ (value);
    },
  }),
  actionsLeft: Object.freeze({
    save: (game) => game.actionsLeft,
    check: (value) => isIntFrom(value, 0),
    load: (game, value) => {
      game.actionsLeft = /** @type {number} */ (value);
    },
  }),
  decks: Object.freeze({
    save: (game) => structuredClone(game.decks.map((deck) => ({ suit: deck.suit, cards: deck.cards }))),
    check: (value, config) =>
      Array.isArray(value) &&
      value.length === config.suits.length &&
      value.every(
        (deck, i) =>
          isPlain(deck) && deck.suit === config.suits[i] && isCardList(deck.cards) && deck.cards.every((card) => card.suit === deck.suit),
      ),
    load: (game, value) => {
      game.decks = structuredClone(/** @type {any} */ (value));
    },
  }),
  discard: Object.freeze({
    save: (game) => structuredClone(game.discard),
    check: (value) => isCardList(value),
    load: (game, value) => {
      game.discard = structuredClone(/** @type {any} */ (value));
    },
  }),
  columns: Object.freeze({
    save: (game) => structuredClone(game.columns),
    check: (value, config) => Array.isArray(value) && value.length === config.columnCount && value.every(isCardList),
    load: (game, value) => {
      game.columns = structuredClone(/** @type {any} */ (value));
    },
  }),
  hand: Object.freeze({
    save: (game) => structuredClone(game.hand),
    check: (value) => Array.isArray(value) && value.every((slot) => slot === null || isCardShape(slot)),
    load: (game, value) => {
      game.hand = structuredClone(/** @type {any} */ (value));
    },
  }),
  battleActionBonus: Object.freeze({
    save: (game) => game.battleActionBonus,
    check: (value) => isIntFrom(value, 0),
    load: (game, value) => {
      game.battleActionBonus = /** @type {number} */ (value);
    },
  }),
  gauges: Object.freeze({
    save: (game) => ({ ...game.gauges }),
    check: (value, config) =>
      isPlain(value) &&
      Object.keys(value).length === config.gauges.length &&
      config.gauges.every((gauge) => Object.prototype.hasOwnProperty.call(value, gauge) && isIntFrom(value[gauge], 0)),
    load: (game, value) => {
      game.gauges = { ...(/** @type {any} */ (value)) };
    },
  }),
  castle: Object.freeze({
    save: (game) => ({ hp: game.castle.hp, maxHp: game.castle.maxHp }),
    check: (value) => isPlain(value) && isIntFrom(value.hp, 1) && Number.isInteger(value.maxHp) && value.hp <= value.maxHp,
    load: (game, value) => {
      game.castle = { ...(/** @type {any} */ (value)) };
    },
  }),
  enemy: Object.freeze({
    save: (game) =>
      structuredClone({
        typeId: game.enemy.typeId,
        hp: game.enemy.hp,
        maxHp: game.enemy.maxHp,
        intent: game.enemy.intent,
        behaviorState: game.enemy.behaviorState,
      }),
    check: (value, config) =>
      isPlain(value) &&
      typeof value.typeId === 'string' &&
      enemyTypeIds(config).includes(value.typeId) &&
      isIntFrom(value.hp, 0) &&
      Number.isInteger(value.maxHp) &&
      value.hp <= value.maxHp &&
      isIntentShape(value.intent) &&
      isBehaviorState(enemySpecOf(config, value.typeId).behavior, value.behaviorState),
    load: (game, value) => {
      const v = structuredClone(/** @type {any} */ (value));
      game.enemy = {
        typeId: v.typeId,
        name: enemySpecOf(game.config, v.typeId).name,
        hp: v.hp,
        maxHp: v.maxHp,
        intent: v.intent,
        behaviorState: v.behaviorState,
      };
    },
  }),
  stats: Object.freeze({
    save: (game) => structuredClone(game.stats),
    check: (value, config) => isGameStats(value, config),
    load: (game, value) => {
      game.stats = structuredClone(/** @type {any} */ (value));
    },
  }),
  battleRecord: Object.freeze({
    save: (game) => ({ ...game.battleRecord }),
    check: (value) => isBattleRecord(value),
    load: (game, value) => {
      game.battleRecord = { ...(/** @type {any} */ (value)) };
    },
  }),
  upgrades: Object.freeze({
    save: (game) => structuredClone(game.upgrades),
    check: (value, config) => isUpgradeState(value, config),
    load: (game, value) => {
      game.upgrades = structuredClone(/** @type {any} */ (value));
    },
  }),
  elites: Object.freeze({
    save: (game) => structuredClone(game.elites),
    check: (value, config) => isEliteState(value, config),
    load: (game, value) => {
      game.elites = structuredClone(/** @type {any} */ (value));
    },
  }),
  upgradeOffer: Object.freeze({
    save: (game) => structuredClone(game.upgradeOffer),
    check: (value, config) => value === null || isUpgradeOffer(value, config),
    load: (game, value) => {
      game.upgradeOffer = structuredClone(/** @type {any} */ (value));
    },
  }),
});

/**
 * 項目をまたぐ段階の整合を確かめる（'planning' は敵が生きていて候補なし、'choosing' は敵が倒れていて候補があり行き先が 'stage'）。
 * 3択の段階でない敵の HP 0 のデータ・DEBUG の候補（行き先 'planning'）はここで捨てる。
 * @param {SuspendData} data 項目ごとの形の確かめを通ったデータ
 * @returns {boolean} 整合していれば true
 */
function isStageConsistent(data) {
  if (data.stage === 'planning') return data.enemy.hp >= 1 && data.upgradeOffer === null;
  return data.enemy.hp === 0 && data.upgradeOffer !== null && data.upgradeOffer.next === 'stage';
}

/**
 * 手札の長さが、取った強化から決まる枠の数（設定の初めの枠の数 + 取った手札の枠）と一致するか。設定の `handSize` とは直接比べない。
 * @param {SuspendData} data 項目ごとの形の確かめを通ったデータ
 * @param {Readonly<import('./config.js').Rules>} config ルールの設定
 * @returns {boolean} 一致すれば true
 */
function isHandConsistent(data, config) {
  return data.hand.length === handSizeOf(config, data.upgrades);
}

/**
 * 全部の札（山札・捨て札・列・手札）が、今の設定で作る札とちょうど一致するか（欠け・重なり・知らない札を見つける）。
 * 札の id の決め方は書き写さず、`createDecks` で作った札と比べる。
 * @param {SuspendData} data 項目ごとの形の確かめを通ったデータ
 * @param {Readonly<import('./config.js').Rules>} config ルールの設定
 * @returns {boolean} 枚数・id・スート・数字がちょうど一致すれば true
 */
function hasAllCards(data, config) {
  const reference = createDecks(config, () => 0).flatMap((deck) => deck.cards);
  const byId = new Map(reference.map((card) => [card.id, card]));
  const all = [
    ...data.decks.flatMap((deck) => deck.cards),
    ...data.discard,
    ...data.columns.flat(),
    ...data.hand.filter((card) => card !== null),
  ];
  if (all.length !== reference.length) return false;
  const seen = new Set();
  for (const card of all) {
    const expected = byId.get(card.id);
    if (expected === undefined || seen.has(card.id)) return false;
    if (expected.suit !== card.suit || expected.rank !== card.rank) return false;
    seen.add(card.id);
  }
  return true;
}

/**
 * ゲームから中断データを作る（ターンの始まり、または3択の段階（候補が決まった後）で、操作の前に呼ぶ。`game` は変えない。結果は `game` と参照を共有しない）。
 * @param {Game} game ターンの始まり、または3択の段階（候補が決まった後）のゲーム
 * @returns {SuspendData} 中断データ
 */
export function toSuspendData(game) {
  /** @type {Record<string, unknown>} */
  const data = { version: SUSPEND_VERSION };
  for (const [name, field] of Object.entries(FIELDS)) data[name] = field.save(game);
  return /** @type {SuspendData} */ (data);
}

/**
 * 保存されていた値を確かめ、今の設定と合えば中断データとして返す（どんな値でも例外を投げない）。
 * 版番号・各項目の形・`actionsLeft <= actionsMax`・段階の整合・手札の長さ（強化から決まる枠の数）・全部の札の組が今の設定と合うかを見る。敵の数値などは設定と比べない。
 * @param {unknown} raw 保存されていた値（`null`・配列・数・文字列・入れ子の欠けを含む）
 * @param {Readonly<import('./config.js').Rules>} [config] ルールの設定（既定は `RULES`）
 * @returns {SuspendData|null} 合えば `raw` の写し（参照を共有しない）。合わなければ `null`
 */
export function readSuspendData(raw, config = RULES) {
  try {
    if (!isPlain(raw) || /** @type {any} */ (raw).version !== SUSPEND_VERSION) return null;
    const source = /** @type {Record<string, unknown>} */ (raw);
    for (const [name, field] of Object.entries(FIELDS)) {
      if (!field.check(source[name], config)) return null;
    }
    const data = /** @type {SuspendData} */ (structuredClone(source));
    if (data.actionsLeft > data.actionsMax) return null;
    if (!isStageConsistent(data)) return null;
    if (!isHandConsistent(data, config)) return null;
    if (!hasAllCards(data, config)) return null;
    /** @type {Record<string, unknown>} */
    const result = { version: SUSPEND_VERSION };
    for (const name of Object.keys(FIELDS)) result[name] = /** @type {any} */ (data)[name];
    return /** @type {SuspendData} */ (result);
  } catch {
    return null;
  }
}

/**
 * 中断データからゲームを作る（`readSuspendData` を通ったデータだけを渡す）。
 * 新しいゲームを作った時の抽選の結果は捨て、全項目を上書きする（乱数の状態も保存したものに戻る）。
 * @param {SuspendData} data `readSuspendData` が返したデータ（書き換えない。参照を共有しない）
 * @param {Readonly<import('./config.js').Rules>} [config] ルールの設定（既定は `RULES`）
 * @returns {Game} ターンの始まり、または3択の段階のゲーム
 */
export function restoreGame(data, config = RULES) {
  const game = new Game({ rng: createRng(data.rng), seed: data.seed, config });
  for (const [name, field] of Object.entries(FIELDS)) field.load(game, /** @type {any} */ (data)[name]);
  return game;
}
