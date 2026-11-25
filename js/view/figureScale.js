/**
 * 絵の敵の体の大きさ（HP → 倍率）と、大きさに合わせた当たる位置・シールドの範囲・予告の札の高さを求める純粋関数を持つ。
 * 何も import せず、状態は変えない（足元＝絵の矩形の下端の中央を軸に縮む）。
 */

/**
 * 絵の配置のうち、倍率の計算に読む項目。
 * @typedef {Object} ScaleFigure
 * @property {{ x: number, y: number, w: number, h: number }} rect 絵の矩形（足元が下端）
 * @property {{ x: number, y: number, w: number, h: number }|null} shieldArea シールドマークを並べる矩形（なければ null）
 * @property {{ x: number, y: number }} intent 予告の札の上端の基準
 */

/**
 * HP から体の倍率を求める。`minScale + (1 − minScale) × (hp / maxHp を 0〜1 に収めた値)`（`minScale` が 1 ならちょうど 1）。
 * @param {number} minScale HP が 0 に近いときの体の倍率
 * @param {number} hp 表示する HP
 * @param {number} maxHp 最大 HP（0 以下なら縮まない扱いで 1）
 * @returns {number} 体の倍率
 */
export function bodyScale(minScale, hp, maxHp) {
  if (minScale === 1 || !(maxHp > 0)) return 1;
  const ratio = Math.min(1, Math.max(0, hp / maxHp));
  return minScale + (1 - minScale) * ratio;
}

/**
 * 絵の中心から倍率をかけた x を返す。
 * @param {ScaleFigure} figure 絵の配置
 * @param {number} x 倍率をかける前の x
 * @param {number} scale 体の倍率
 * @returns {number} 倍率をかけた後の x
 */
export function scaledX(figure, x, scale) {
  const cx = figure.rect.x + figure.rect.w / 2;
  return cx + (x - cx) * scale;
}

/**
 * シールドを並べる矩形を、中心だけ足元から倍率をかけて動かして返す（幅・高さは変えない。マークは小さくならない）。
 * @param {ScaleFigure} figure 絵の配置
 * @param {number} scale 体の倍率
 * @returns {{ x: number, y: number, w: number, h: number }|null} 動かした矩形（シールドを張らない敵は null）
 */
export function scaledShieldArea(figure, scale) {
  const area = figure.shieldArea;
  if (area === null) return null;
  const footY = figure.rect.y + figure.rect.h;
  const cx = scaledX(figure, area.x + area.w / 2, scale);
  const cy = footY + (area.y + area.h / 2 - footY) * scale;
  return { x: cx - area.w / 2, y: cy - area.h / 2, w: area.w, h: area.h };
}

/**
 * 予告の札の上端の y を、体の縮みに合わせて下げる（`intent.y + rect.h × (1 − scale)`）。
 * @param {ScaleFigure} figure 絵の配置
 * @param {number} scale 体の倍率
 * @returns {number} 札の上端の y
 */
export function scaledIntentY(figure, scale) {
  return figure.intent.y + figure.rect.h * (1 - scale);
}
