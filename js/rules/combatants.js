/**
 * 責務: 城・敵の状態の生成（敵は種類の設定とステージの加算から作る。ルール層。画面・エンジンには触れない）。
 */

import { createBehaviorState } from './enemyBehaviors.js';
import { createEnemyParts } from './enemyParts.js';
import { grownMaxHp } from './stageBonus.js';
import { unitPointsOf } from './unitPoints.js';

/**
 * 敵の行動（予告にも使う）。
 * @typedef {Object} EnemyAction
 * @property {'attack'|'windup'|'guard'} kind 行動の種類（攻撃・振りかぶり（行動しない。量は 0）・防御だけ（攻撃しない。量は 0。防御の量は `guard`））
 * @property {number} amount 行動の量（攻撃なら攻撃の値、振りかぶり・防御だけなら 0。防御の量・ステージの加算は含まない＝加算の前）。行動の決まりが設定の幅から抽選した値
 * @property {number} [guard] 防御だけの行動が持つ、加算の前の防御の量（任意。予告にするとき `createIntent` が防御に変えて取り除くので、予告には残らない）
 * @property {'claw'|'breath'|'inhale'|'charge'|'heavy'|'bigGuard'|'protect'|'rush'|'rage'|'bigRush'} [variant] 行動の中の種類（任意。攻撃の爪・ブレス・大攻撃、振りかぶりの吸い込む・溜める、防御だけの大防御、親子の敵の守る（防御だけ）・突進・怒りを溜める（振りかぶり）・大突進（攻撃）。表示の違いだけで、城へのダメージ・行動の扱いは種類で変わらない）
 * @property {{ min: number, max: number }} [burn] 行動に付く列の札を燃やす効果の枚数の範囲（任意）
 * @property {boolean} [sureHeal] デバッグで「攻撃して回復」を指定した予告だけが持つ（任意）。攻撃の直後の回復が必ず当たる
 * @property {import('./columnMarks.js').MarkRequest} [mark] 行動が持つ印の求め（任意。種類だけで列はまだない）。行動の決まりが付け、`createIntent` が予告へ写し、`Game.intentOf` が `withMarkColumn` で列の印（`ColumnMark`）に置き換える
 */

/**
 * 敵の予告（行動にステージの加算と防御の量を足したもの）。
 * amount は攻撃の値にステージの加算を足した後の量に激昂の倍率をかけた最後の量（振りかぶり・吸い込む・防御だけは 0。予告・攻防が読むのはこれだけ）、
 * baseAmount は加算の後・倍率の前の量（DEBUG でターンの番号・激昂の値を変えたとき amount を数え直す元になるだけ）、
 * defense は抽選した（防御だけの行動では行動が持つ）防御の量にステージの加算を足した後の防御の量（激昂の倍率はかけない。張らない・隙のターンは 0。予告・シールド・攻防が読むのはこれだけ）。
 * 子を持つ敵（設定に `split` がある）の予告だけ、このターンのふつうの攻撃に上乗せして襲う子の数 `minions` を持つ（任意）。
 * 予告の `mark` は列の印（種類・列・済んだか）。行動の `mark`（印の求め）とは形が違い、`enemy.intent` に入る予告（`Game.intentOf` の戻り値）は必ずこちら。印を求めない行動・ほかの敵の予告は持たない。
 * @typedef {Omit<EnemyAction, 'mark'> & { baseAmount: number, defense: number, minions?: number, mark?: import('./columnMarks.js').ColumnMark }} EnemyIntent
 */

/**
 * 城の状態。
 * @typedef {Object} Castle
 * @property {number} hp 現在の HP
 * @property {number} maxHp 最大 HP
 */

/**
 * 敵の状態。
 * @typedef {Object} Enemy
 * @property {string} typeId 敵の種類の識別子
 * @property {string} name 敵の名前
 * @property {number} hp 現在の HP
 * @property {number} maxHp 最大 HP
 * @property {EnemyIntent|null} intent 次の行動の予告（未決定なら null）
 * @property {import('./enemyParts.js').EnemyParts|null} parts 親と子の HP（親子でない敵は null。親子の敵は hp === parts.parent + parts.child を保つ）
 * @property {number} minions 次のターンに襲う待っている子の数（0 以上の整数。子を持たない敵はいつも 0）
 * @property {object} behaviorState 行動の決まりの状態（steady・either では {}、cycle では { countdown }、inhale では { lastVariant }、buildup では { turnsToHeavy, chargeTurns }、confuse では { untilConfuse }）
 */

/**
 * 城の初期状態を作る。
 * @param {{ castleMaxHp: number }} config ルールの設定
 * @returns {Castle} HP が最大の城
 */
export function createCastle(config) {
  return { hp: config.castleMaxHp, maxHp: config.castleMaxHp };
}

/**
 * 敵の初期状態を種類の設定とステージの加算から作る（予告はまだ決めない）。
 * @param {string} typeId 敵の種類の識別子
 * @param {import('./config.js').EnemySpec} spec 敵の種類の設定
 * @param {import('./stageBonus.js').StageBonus} bonus ステージの加算量（最大 HP に効く。最大 HP は敵の1体のポイントの倍数に切り捨てる）
 * @returns {Enemy} HP が加算後の最大で、予告が null、決まりの状態が初期値、`parts` が親と子の最大 HP（親子でない敵は null）、`minions` が 0 の敵
 */
export function createEnemy(typeId, spec, bonus) {
  const maxHp = grownMaxHp(spec.maxHp, bonus, unitPointsOf(spec));
  return {
    typeId,
    name: spec.name,
    hp: maxHp,
    maxHp,
    intent: null,
    behaviorState: createBehaviorState(spec.behavior),
    parts: createEnemyParts(spec, maxHp),
    minions: 0,
  };
}
