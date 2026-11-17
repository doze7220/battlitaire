/**
 * 敵の種類ごとの攻防の見せ方の表（体の見せ方・行動の中の種類ごとの攻撃の見せ方）と、攻撃の見せ方ごとの段の作り方の表を持ち、引くだけ。
 * 敵の種類の識別子と行動の中の種類はルール層の値を読む。描画も状態の変更もしない。
 */

/**
 * 攻撃の見せ方ごとの段の作り方。
 * @typedef {Object} AttackShow
 * @property {'enemy'|'flame'|null} unit 出す敵の側の兵の種類（打撃は null）
 * @property {'offscreen'|'mouth'|null} from 兵の出る場所（打撃は null）
 * @property {'block'|'strikeBlock'} blockStep 相殺の段の種類
 * @property {'castleHit'|'strikeCastle'} castleStep 城の被害の段の種類
 */

/**
 * 攻撃の見せ方の表（見せ方の名前 → 段の作り方）。
 * @type {Readonly<Record<string, Readonly<AttackShow>>>}
 */
export const ATTACK_SHOWS = Object.freeze({
  march: Object.freeze({ unit: 'enemy', from: 'offscreen', blockStep: 'block', castleStep: 'castleHit' }),
  flames: Object.freeze({ unit: 'flame', from: 'mouth', blockStep: 'block', castleStep: 'castleHit' }),
  strike: Object.freeze({ unit: null, from: null, blockStep: 'strikeBlock', castleStep: 'strikeCastle' }),
});

/**
 * 敵の種類の識別子ごとの見せ方の表。`attacks` は行動の中の種類（`variant`）→ 攻撃の見せ方の名前（`default` は既定）。
 * @type {Readonly<Record<string, Readonly<{body: 'horde'|'figure', attacks: Readonly<Record<string, string>>}>>>}
 */
export const ENEMY_SHOWS = Object.freeze({
  goblins: Object.freeze({ body: 'horde', attacks: Object.freeze({ default: 'march' }) }),
  giant: Object.freeze({ body: 'figure', attacks: Object.freeze({ default: 'strike' }) }),
  dragon: Object.freeze({ body: 'figure', attacks: Object.freeze({ default: 'strike', breath: 'flames' }) }),
});

/**
 * 敵の種類の見せ方の項目を引く。
 * @param {string} typeId 敵の種類の識別子
 * @param {string} name 呼び出し元の関数名（Error の文の頭）
 * @returns {Readonly<{body: 'horde'|'figure', attacks: Readonly<Record<string, string>>}>}
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
