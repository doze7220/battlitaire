/**
 * 責務: 城・敵の状態の生成（敵は種類の設定とステージの加算から作る。ルール層。画面・エンジンには触れない）。
 */

import { createBehaviorState } from './enemyBehaviors.js';
import { grownMaxHp } from './stageBonus.js';
import { unitPointsOf } from './unitPoints.js';

/**
 * 敵の行動（予告にも使う）。
 * @typedef {Object} EnemyAction
 * @property {'attack'|'windup'|'guard'} kind 行動の種類（攻撃・振りかぶり（行動しない。量は 0）・防御だけ（攻撃しない。量は 0。防御の量は `guard`））
 * @property {number} amount 行動の量（攻撃なら攻撃の値、振りかぶり・防御だけなら 0。防御の量・ステージの加算は含まない＝加算の前）。行動の決まりが設定の幅から抽選した値
 * @property {number} [guard] 防御だけの行動が持つ、加算の前の防御の量（任意。予告にするとき `createIntent` が防御に変えて取り除くので、予告には残らない）
 * @property {'claw'|'breath'|'inhale'|'charge'|'heavy'|'bigGuard'} [variant] 行動の中の種類（任意。攻撃の爪・ブレス・大攻撃、振りかぶりの吸い込む・溜める、防御だけの大防御。表示の違いだけで、城へのダメージ・行動の扱いは種類で変わらない）
 * @property {{ min: number, max: number }} [burn] 行動に付く列の札を燃やす効果の枚数の範囲（任意）
 * @property {boolean} [sureHeal] デバッグで「攻撃して回復」を指定した予告だけが持つ（任意）。攻撃の直後の回復が必ず当たる
 */

/**
 * 敵の予告（行動にステージの加算と防御の量を足したもの）。
 * amount は攻撃の値にステージの加算を足した後の量（振りかぶり・吸い込む・防御だけは 0）、
 * baseDefense は抽選した（防御だけの行動では行動が持つ）防御の量にステージの加算を足した後の量（疲弊の前。張らない・隙のターンは 0）、
 * defense は疲弊を掛けた後の防御の量（予告・シールド・攻防が読むのはこれだけ）。
 * @typedef {EnemyAction & { baseDefense: number, defense: number }} EnemyIntent
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
 * @property {object} behaviorState 行動の決まりの状態（steady・either では {}、cycle では { countdown }、inhale では { lastVariant }、buildup では { turnsToHeavy, chargeTurns }）
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
 * @returns {Enemy} HP が加算後の最大で、予告が null、決まりの状態が初期値の敵
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
  };
}
