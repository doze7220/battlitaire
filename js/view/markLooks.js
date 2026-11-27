/**
 * 責務: 列の印の種類ごとの見た目の表（列の染め・縁・予告の札の塗り・縁・印の絵の色と描き方）と、印の絵（渦巻き。図形で描く）の描画。
 * 状態は変えず、ルール層・anim は import しない。
 */

/**
 * 印の種類ごとの見た目。
 * @typedef {Object} MarkLook
 * @property {string} tint 列の領域を染める色（カードより奥に描く。薄い色）
 * @property {string} edge 列の領域の縁の色
 * @property {string} badgeFill 予告の札の塗りの色
 * @property {string} badgeStroke 予告の札の縁の色
 * @property {string} iconFill 放つ矢印の上の印の丸の塗りの色
 * @property {string} iconColor 印の絵の線の色
 * @property {string} icon 印の絵の名前（`MARK_ICONS` のキー）
 */

/**
 * 印の種類（`columnMarks.js` の `MARK_KINDS` のキー）→ 見た目の表。値は初期値（試遊で決め直す）。
 * @type {Readonly<Record<string, Readonly<MarkLook>>>}
 */
export const MARK_LOOKS = Object.freeze({
  confuse: Object.freeze({
    tint: 'rgba(168, 85, 247, 0.22)',
    edge: 'rgba(196, 140, 255, 0.85)',
    badgeFill: 'rgba(91, 33, 182, 0.92)',
    badgeStroke: '#e9d5ff',
    iconFill: 'rgba(91, 33, 182, 0.95)',
    iconColor: '#f5e9ff',
    icon: 'swirl',
  }),
});

/** 渦巻きの回転数 */
const SWIRL_TURNS = 2.25;
/** 渦巻きの折れ線の分割数 */
const SWIRL_STEPS = 40;
/** 渦巻きの線の太さ（印の大きさに対する比） */
const SWIRL_LINE_RATIO = 0.1;
/** 渦巻きの外側の半径（印の大きさに対する比） */
const SWIRL_RADIUS_RATIO = 0.4;
/** 表にない印の絵のかわりの文字 */
const UNKNOWN_ICON_TEXT = '？';
/** 表にない印の絵の文字の大きさ（印の大きさに対する比） */
const UNKNOWN_ICON_FONT_RATIO = 0.8;

/**
 * 印の絵の描き方の表（名前 → 描く関数）。
 * @type {Readonly<Record<string, (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) => void>>}
 */
const MARK_ICONS = Object.freeze({
  /**
   * 渦巻き（アルキメデスの渦の折れ線。中心から外へ回る）を描く。
   * @param {CanvasRenderingContext2D} ctx 描画先
   * @param {number} cx 渦の中心の x（px）
   * @param {number} cy 渦の中心の y（px）
   * @param {number} size 印の大きさ（px。線の太さ・外側の半径の基準）
   * @param {string} color 線の色
   * @returns {void}
   */
  swirl(ctx, cx, cy, size, color) {
    const maxR = size * SWIRL_RADIUS_RATIO;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, size * SWIRL_LINE_RATIO);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= SWIRL_STEPS; i++) {
      const t = i / SWIRL_STEPS;
      const angle = t * SWIRL_TURNS * Math.PI * 2;
      const r = t * maxR;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  },
});

/**
 * 印の種類の見た目を引く。
 * @param {string} kind 印の種類
 * @returns {Readonly<MarkLook>|null} 見た目。表にない種類は null
 */
export function markLookOf(kind) {
  return Object.prototype.hasOwnProperty.call(MARK_LOOKS, kind) ? MARK_LOOKS[kind] : null;
}

/**
 * 印の絵を描く（`MARK_LOOKS` の `icon` の描き方。表にない種類は「？」）。ctx の変更は save／restore で囲む。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} kind 印の種類
 * @param {number} cx 中心の x
 * @param {number} cy 中心の y
 * @param {number} size 絵を収める大きさ（直径。px）
 * @returns {void}
 */
export function drawMarkIcon(ctx, kind, cx, cy, size) {
  const look = markLookOf(kind);
  ctx.save();
  if (look !== null && Object.prototype.hasOwnProperty.call(MARK_ICONS, look.icon)) {
    MARK_ICONS[look.icon](ctx, cx, cy, size, look.iconColor);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(size * UNKNOWN_ICON_FONT_RATIO)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(UNKNOWN_ICON_TEXT, cx, cy);
  }
  ctx.restore();
}
