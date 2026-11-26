/**
 * 敵の種類ごとの攻防の見せ方の表（体の見せ方・行動の中の種類ごとの攻撃の見せ方・防御の見せ方）と、攻撃の見せ方ごとの段の作り方の表を持ち、引くだけ。
 * 大きな一撃・ための動きの表も持つ。敵の種類の識別子と行動の中の種類はルール層の値を読む。描画も状態の変更もしない。
 */

import { ENEMY_PACES } from './battleAnimConfig.js';

/**
 * 攻撃の見せ方ごとの段の作り方。
 * @typedef {Object} AttackShow
 * @property {'enemy'|'flame'|null} unit 出す敵の側の兵の種類（打撃は null）
 * @property {'offscreen'|'mouth'|null} from 兵の出る場所（打撃は null）
 * @property {'block'|'strikeBlock'} blockStep 相殺の段の種類
 * @property {'castleHit'|'strikeCastle'} castleStep 城の被害の段の種類
 * @property {string|null} dash 絵の駆け寄りの見せ方の名前（`DASH_STYLES` の項目名。駆け寄らないものは null）
 */

/**
 * 攻撃の見せ方の表（見せ方の名前 → 段の作り方）。
 * @type {Readonly<Record<string, Readonly<AttackShow>>>}
 */
export const ATTACK_SHOWS = Object.freeze({
  march: Object.freeze({ unit: 'enemy', from: 'offscreen', blockStep: 'block', castleStep: 'castleHit', dash: null }),
  flames: Object.freeze({ unit: 'flame', from: 'mouth', blockStep: 'block', castleStep: 'castleHit', dash: null }),
  strike: Object.freeze({ unit: null, from: null, blockStep: 'strikeBlock', castleStep: 'strikeCastle', dash: null }),
  dashSwift: Object.freeze({ unit: null, from: null, blockStep: 'strikeBlock', castleStep: 'strikeCastle', dash: 'swift' }),
  dashStraight: Object.freeze({ unit: null, from: null, blockStep: 'strikeBlock', castleStep: 'strikeCastle', dash: 'straight' }),
  dashBounce: Object.freeze({ unit: null, from: null, blockStep: 'strikeBlock', castleStep: 'strikeCastle', dash: 'bounce' }),
});

/**
 * 防御の見せ方ごとの段の作り方。
 * @typedef {Object} DefenseShow
 * @property {'enemyGuard'|null} unit 出す敵の側の守りの兵の種類（シールドは null）
 * @property {'enemyBlock'|'shieldBlock'} blockStep 敵の防御が攻撃を受け止める段の種類
 */

/**
 * 防御の見せ方の表（体の見せ方 → 防御の見せ方）。
 * @type {Readonly<Record<'horde'|'figure', Readonly<DefenseShow>>>}
 */
export const DEFENSE_SHOWS = Object.freeze({
  horde: Object.freeze({ unit: 'enemyGuard', blockStep: 'enemyBlock' }),
  figure: Object.freeze({ unit: null, blockStep: 'shieldBlock' }),
});

/**
 * 敵の種類の識別子ごとの見せ方の表。`dents` は体に当たるとへこむか（スライムだけ真）。`pace` は動きの速さと止めの長さの名前（`ENEMY_PACES` の項目名）。`attacks` は行動の中の種類（`variant`）→ 攻撃の見せ方の名前（`default` は既定）。
 * `heavy` は大きな一撃とみなす攻撃の中の種類の並び、`charge` はための動きを見せる振りかぶりの中の種類の並び
 * （中の種類のない行動は `default`）。
 * @type {Readonly<Record<string, Readonly<{body: 'horde'|'figure', attacks: Readonly<Record<string, string>>, heavy: readonly string[], charge: readonly string[], dents: boolean, pace: 'normal'|'slow'}>>>}
 */
export const ENEMY_SHOWS = Object.freeze({
  goblins: Object.freeze({
    body: 'horde',
    attacks: Object.freeze({ default: 'march' }),
    heavy: Object.freeze([]),
    charge: Object.freeze([]),
    dents: false,
    pace: 'normal',
  }),
  wolf: Object.freeze({
    body: 'figure',
    attacks: Object.freeze({ default: 'dashSwift' }),
    heavy: Object.freeze(['heavy']),
    charge: Object.freeze(['charge']),
    dents: false,
    pace: 'normal',
  }),
  boar: Object.freeze({
    body: 'figure',
    attacks: Object.freeze({ default: 'dashStraight' }),
    heavy: Object.freeze(['heavy']),
    charge: Object.freeze(['charge']),
    dents: false,
    pace: 'normal',
  }),
  slime: Object.freeze({
    body: 'figure',
    attacks: Object.freeze({ default: 'dashBounce' }),
    heavy: Object.freeze([]),
    charge: Object.freeze([]),
    dents: true,
    pace: 'normal',
  }),
  skeletons: Object.freeze({
    body: 'horde',
    attacks: Object.freeze({ default: 'march' }),
    heavy: Object.freeze([]),
    charge: Object.freeze([]),
    dents: false,
    pace: 'normal',
  }),
  giant: Object.freeze({
    body: 'figure',
    attacks: Object.freeze({ default: 'strike' }),
    heavy: Object.freeze(['default']),
    charge: Object.freeze(['default']),
    dents: false,
    pace: 'normal',
  }),
  dragon: Object.freeze({
    body: 'figure',
    attacks: Object.freeze({ default: 'strike', breath: 'flames' }),
    heavy: Object.freeze(['breath']),
    charge: Object.freeze(['inhale']),
    dents: false,
    pace: 'normal',
  }),
});

/**
 * 敵の種類の見せ方の項目を引く。
 * @param {string} typeId 敵の種類の識別子
 * @param {string} name 呼び出し元の関数名（Error の文の頭）
 * @returns {Readonly<{body: 'horde'|'figure', attacks: Readonly<Record<string, string>>, heavy: readonly string[], charge: readonly string[], dents: boolean, pace: 'normal'|'slow'}>}
 */
function showOf(typeId, name) {
  if (!Object.prototype.hasOwnProperty.call(ENEMY_SHOWS, typeId)) {
    throw new Error(`${name}: 見せ方のない敵の種類 ${typeId}`);
  }
  return ENEMY_SHOWS[typeId];
}

/**
 * 敵の体の見せ方を返す。
 * @param {string} typeId 敵の種類の識別子
 * @returns {'horde'|'figure'} `horde`＝HP の群れ／`figure`＝絵
 */
export function enemyBodyStyle(typeId) {
  return showOf(typeId, 'enemyBodyStyle').body;
}

/**
 * 敵の防御の見せ方（体の見せ方で決まる守りの兵・受け止める段）を返す。
 * @param {string} typeId 敵の種類の識別子
 * @returns {Readonly<DefenseShow>}
 */
export function enemyDefenseShow(typeId) {
  return DEFENSE_SHOWS[showOf(typeId, 'enemyDefenseShow').body];
}

/**
 * 敵の攻撃の見せ方（段の作り方）を返す。
 * @param {string} typeId 敵の種類の識別子
 * @param {string|undefined} variant 予告の行動の中の種類（なければ既定）
 * @returns {Readonly<AttackShow>}
 */
export function enemyAttackShow(typeId, variant) {
  const attacks = showOf(typeId, 'enemyAttackShow').attacks;
  const key =
    typeof variant === 'string' && Object.prototype.hasOwnProperty.call(attacks, variant)
      ? variant
      : 'default';
  return ATTACK_SHOWS[attacks[key]];
}

/**
 * 行動の中の種類を表の引き鍵にする（文字列ならそのまま、なければ `default`）。
 * 攻撃の見せ方（`enemyAttackShow`）と違い、表にない中の種類を `default` に置き換えない。
 * @param {string|undefined} variant 行動の中の種類
 * @returns {string} 引き鍵
 */
function variantKey(variant) {
  return typeof variant === 'string' ? variant : 'default';
}

/**
 * 敵の攻撃が大きな一撃かを返す（ドラゴンの爪のように表にない中の種類は false）。
 * @param {string} typeId 敵の種類の識別子
 * @param {string|undefined} variant 予告の行動の中の種類（なければ既定）
 * @returns {boolean} 大きな一撃なら true
 */
export function isHeavyAttack(typeId, variant) {
  return showOf(typeId, 'isHeavyAttack').heavy.includes(variantKey(variant));
}

/**
 * 振りかぶり・吸い込みの攻防で、ための動きを見せるかを返す。
 * @param {string} typeId 敵の種類の識別子
 * @param {string|undefined} variant 予告の行動の中の種類（なければ既定）
 * @returns {boolean} ための動きを見せるなら true
 */
export function hasChargeShow(typeId, variant) {
  return showOf(typeId, 'hasChargeShow').charge.includes(variantKey(variant));
}

/**
 * 体に当たるとへこむ敵かを返す（スライムだけ true）。
 * @param {string} typeId 敵の種類の識別子
 * @returns {boolean} へこむなら true
 */
export function enemyDents(typeId) {
  return showOf(typeId, 'enemyDents').dents;
}

/**
 * 敵の動きの速さと止めの長さの倍率（`ENEMY_PACES` の、その敵の `pace` の名前の項目）を返す。
 * @param {string} typeId 敵の種類の識別子
 * @returns {Readonly<import('./battleAnimConfig.js').EnemyPace>} 倍率（`moveScale`・`stopScale`）
 * @throws {Error} 見せ方のない敵の種類、または `ENEMY_PACES` にない名前のとき
 */
export function enemyPace(typeId) {
  const name = showOf(typeId, 'enemyPace').pace;
  if (!Object.prototype.hasOwnProperty.call(ENEMY_PACES, name)) {
    throw new Error(`enemyPace: 未知の動きの速さ ${name}（${typeId}）`);
  }
  return ENEMY_PACES[name];
}
