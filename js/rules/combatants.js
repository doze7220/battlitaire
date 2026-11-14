/**
 * 責務: 城・敵の状態の生成（敵は種類の設定から作る。ルール層。画面・エンジンには触れない）。
 */

import { createBehaviorState } from './enemyBehaviors.js';

/**
 * 敵の行動（予告にも使う）。
 * @typedef {Object} EnemyAction
 * @property {'attack'|'defend'|'windup'} kind 行動の種類（攻撃・防御・振りかぶり（行動しない。量は 0））
 * @property {number} amount 行動の量（攻撃なら攻撃の値、防御なら防御の値、振りかぶりなら 0）
 * @property {'claw'|'breath'} [variant] 攻撃の中の種類（任意。爪・ブレス。城へのダメージの扱いは種類で変わらない）
 * @property {{ min: number, max: number }} [burn] 行動に付く列の札を燃やす効果の枚数の範囲（任意）
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
 * @property {number} armor 常時防御力
 * @property {EnemyAction|null} intent 次の行動の予告（未決定なら null）
 * @property {object} behaviorState 行動の決まりの状態（weighted では {}、cycle では { countdown }、charge では { charge }）
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
 * 敵の初期状態を種類の設定から作る（予告はまだ決めない）。
 * @param {string} typeId 敵の種類の識別子
 * @param {import('./config.js').EnemySpec} spec 敵の種類の設定
 * @returns {Enemy} HP が最大で、予告が null、決まりの状態が初期値の敵
 */
export function createEnemy(typeId, spec) {
  return {
    typeId,
    name: spec.name,
    hp: spec.maxHp,
    maxHp: spec.maxHp,
    armor: spec.armor,
    intent: null,
    behaviorState: createBehaviorState(spec.behavior),
  };
}
