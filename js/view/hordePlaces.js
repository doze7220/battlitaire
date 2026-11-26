/**
 * 責務: 群れで描く敵の種類ごとの、体の大きさと並ぶ場所（群れの範囲・攻撃と守りの陣地）の表を持ち、そこから配置を組み立てる。
 * 標準の行（null）は layout.js が渡す標準の大きさと範囲のまま。状態は持たず、何も import しない純粋な表と関数。
 */

/**
 * 群れの敵の種類ごとの大きさと並ぶ場所の表の行（標準と違う敵だけが持つ）。x・w は段の左端からの絶対値（足元の中心が入る範囲）。
 * @typedef {Object} HordePlaceDef
 * @property {number} size 体の大きさ（直径）
 * @property {{ x: number, w: number }} area 群れの足元の中心が入る範囲の x と幅
 * @property {{ x: number, w: number }} enemy 攻撃の兵の陣地の x と幅
 * @property {{ x: number, w: number }} enemyGuard 守りの兵の陣地の x と幅
 */

/**
 * 群れの敵の種類ごとの配置。
 * @typedef {Object} HordePlace
 * @property {number} size 体の大きさ（直径）
 * @property {{ x: number, y: number, w: number, h: number }} area 群れの足元の中心が入る範囲
 * @property {{ enemy: { x: number, y: number, w: number, h: number }, enemyGuard: { x: number, y: number, w: number, h: number } }} camps 攻撃の兵・守りの兵の陣地
 */

/**
 * 敵の種類の識別子 → 大きさと並ぶ場所の行（群れで描く敵だけが持つ。`HORDE_SKINS` と同じ識別子をそろえる）。
 * null は標準（`layout.js` の `TROOP_SIZE`・`HORDE_AREA_X`・`TROOP_CAMPS_X` の `enemy`・`enemyGuard` のまま）。試遊で決め直す値。
 * @type {Readonly<Record<string, Readonly<HordePlaceDef>|null>>}
 */
export const HORDE_PLACES = Object.freeze({
  goblins: null,
  skeletons: null,
  ogres: Object.freeze({
    size: 48,
    area: Object.freeze({ x: 605, w: 75 }),
    enemy: Object.freeze({ x: 435, w: 30 }),
    enemyGuard: Object.freeze({ x: 525, w: 25 }),
  }),
});

/**
 * 群れの敵の種類ごとの配置を作る。標準の行（null）は `standard` そのもの（同じオブジェクト）を返す。
 * 標準でない行は、縦を兵の足元の範囲から上を `size − 標準の大きさ` だけ削る（体の上端が標準の兵と同じ高さになる）。
 * @param {Object} params 引数
 * @param {number} params.groundY 地面の下端の y（足元の範囲の下端）
 * @param {number} params.fieldH 兵の足元の範囲の高さ
 * @param {HordePlace} params.standard 標準の大きさと3つの範囲（凍結して渡す。標準の行はこのオブジェクトをそのまま返す）
 * @returns {Readonly<Record<string, HordePlace>>} 識別子 → 配置（凍結）
 */
export function createHordePlaces({ groundY, fieldH, standard }) {
  /** @type {Record<string, HordePlace>} */
  const places = {};
  for (const typeId of Object.keys(HORDE_PLACES)) {
    const def = HORDE_PLACES[typeId];
    if (def === null) {
      places[typeId] = standard;
      continue;
    }
    const cut = Math.max(0, def.size - standard.size);
    const y = groundY - fieldH + cut;
    const h = fieldH - cut;
    places[typeId] = Object.freeze({
      size: def.size,
      area: Object.freeze({ x: def.area.x, y, w: def.area.w, h }),
      camps: Object.freeze({
        enemy: Object.freeze({ x: def.enemy.x, y, w: def.enemy.w, h }),
        enemyGuard: Object.freeze({ x: def.enemyGuard.x, y, w: def.enemyGuard.w, h }),
      }),
    });
  }
  return Object.freeze(places);
}
