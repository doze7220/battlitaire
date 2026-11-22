/**
 * 責務: クレジットの文面の行を凍結した定数で持つ。発注者はここだけを書き換える。
 * 状態は持たず、何も import しない。
 */

/**
 * クレジットの文面の行（凍結）。行を足せば窓の「クレジット」タブに行が増える
 * （領域に収まらないほど増えたら、指で縦にずらして見られる）。
 * @type {ReadonlyArray<string>}
 */
export const CREDIT_LINES = Object.freeze([
  'BGM: 魔王魂',
  "効果音: Springin' Sound Stock",
]);
