/**
 * 責務: 敵を倒したときの内訳が順に出る動きの時間の設定を1か所に凍結して持つ。
 * これらの数値は、ほかのファイルに書かない。
 */

/**
 * 内訳が順に出る動きの設定（時間の単位はミリ秒）。
 * @typedef {Object} DefeatTallyAnim
 * @property {number} itemMs 項目が1つずつ出る間（ms）。試遊で決め直す。
 * @property {number} fadeMs 1つが濃くなりきる長さ（ms）。試遊で決め直す。
 */

/**
 * 内訳が順に出る動きの設定。
 * @type {Readonly<DefeatTallyAnim>}
 */
export const DEFEAT_TALLY_ANIM = Object.freeze({ itemMs: 200, fadeMs: 120 });
