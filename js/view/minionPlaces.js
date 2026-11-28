/**
 * 責務: 子（次のターンに持ち越す攻撃のユニット）を持つ敵の種類ごとの、子の大きさと待つ場所の表を持ち、そこから配置（待つ場所の矩形・生まれ出る位置）を組み立てる。
 * 状態は持たず、何も import しない純粋な表と関数。
 */

/**
 * 子の大きさと待つ場所の表の行。x・w は段の左端からの絶対値（足元の中心が入る範囲）。h は足元の範囲の下端（groundY）から上への高さ。
 * @typedef {Object} MinionPlaceDef
 * @property {number} size 子の体の大きさ（直径）
 * @property {{ x: number, w: number, h: number }} area 待つ場所の x と幅、高さ（groundY から上へ。足元の範囲の高さを超えるときは足元の範囲の高さに縮める）
 */

/**
 * 子を持つ敵の種類ごとの配置。
 * @typedef {Object} MinionPlace
 * @property {number} size 子の体の大きさ（直径）
 * @property {{ x: number, y: number, w: number, h: number }} area 待つ場所（子の足元の中心が入る範囲）
 * @property {{ x: number, y: number }} hatch 生まれ出る足元の位置（その敵の絵の足元の中央から少しだけ上）
 */

/**
 * 敵の種類の識別子 → 子の大きさと待つ場所の行（子を持つ敵だけが持つ。`MINION_SKINS` と同じ識別子をそろえる）。試遊で決め直す値。
 * @type {Readonly<Record<string, Readonly<MinionPlaceDef>>>}
 */
export const MINION_PLACES = Object.freeze({
  slime: Object.freeze({ size: 24, area: Object.freeze({ x: 440, w: 70, h: 130 }) }),
  necromancer: Object.freeze({ size: 24, area: Object.freeze({ x: 430, w: 110, h: 150 }) }),
});

/**
 * 生まれ出る足元の y の、groundY から上への高さ（絵の奥から出るように、絵の足元より少しだけ上）。試遊で決め直す値。
 * @type {number}
 */
const HATCH_RISE = 2;

/**
 * 子を持つ敵の種類ごとの配置を作る。待つ場所の矩形は y = groundY − h'・高さ h'（h' = min(行の h, fieldH)）。
 * 生まれ出る位置は、その敵の絵の矩形の下端の中央の x（体が縮んでも足元の中央は動かない）と、y = groundY − HATCH_RISE。
 * @param {Object} params 引数
 * @param {number} params.groundY 地面の下端の y（足元の範囲の下端）
 * @param {number} params.fieldH 兵の足元の範囲の高さ
 * @param {Object<string, { rect: { x: number, y: number, w: number, h: number } }>} params.figures 敵の種類の識別子 → 敵の絵の配置（`layout.js` の `enemyFigures`）
 * @returns {Readonly<Record<string, MinionPlace>>} 識別子 → 配置（凍結）
 * @throws {Error} 子を持つ敵の絵の行がないとき
 */
export function createMinionPlaces({ groundY, fieldH, figures }) {
  /** @type {Record<string, MinionPlace>} */
  const places = {};
  for (const typeId of Object.keys(MINION_PLACES)) {
    const def = MINION_PLACES[typeId];
    if (!Object.prototype.hasOwnProperty.call(figures, typeId)) {
      throw new Error(`子を持つ敵の絵の行がありません: ${typeId}`);
    }
    const rect = figures[typeId].rect;
    const h = Math.min(def.area.h, fieldH);
    places[typeId] = Object.freeze({
      size: def.size,
      area: Object.freeze({ x: def.area.x, y: groundY - h, w: def.area.w, h }),
      hatch: Object.freeze({ x: rect.x + rect.w / 2, y: groundY - HATCH_RISE }),
    });
  }
  return Object.freeze(places);
}
