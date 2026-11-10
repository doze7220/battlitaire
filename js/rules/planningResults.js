/**
 * 責務: 段取りの操作（置く・捨てる・放つ・手札に入れる・手札から置く・束を移す）の結果の型定義だけを持つ。
 * 実行時の処理は持たない。
 */

/**
 * 「置く」操作の結果。
 * @typedef {Object} PlaceResult
 * @property {'place'} type 操作の種類
 * @property {number} deckIndex 取った山札の番号
 * @property {number} columnIndex 置いた列の番号
 * @property {import('./card.js').Card} card 置いたカード
 * @property {number} actionsLeft 操作後の残り行動回数
 * @property {import('./piles.js').Refill[]} refills 操作後に起きた補充
 */

/**
 * 「捨てる」操作の結果。
 * @typedef {Object} DiscardResult
 * @property {'discard'} type 操作の種類
 * @property {number} deckIndex 捨てた山札の番号
 * @property {import('./card.js').Card} card 捨てたカード
 * @property {number} actionsLeft 操作後の残り行動回数
 * @property {import('./piles.js').Refill[]} refills 操作後に起きた補充
 */

/**
 * 「放つ」操作の結果。
 * @typedef {Object} ReleaseResult
 * @property {'release'} type 操作の種類
 * @property {number} columnIndex 放った列の番号
 * @property {import('./card.js').Card[]} cards 放ったカード（列の下から順）
 * @property {import('./release.js').ReleaseSegment[]} segments 区切りごとの計算結果
 * @property {Object<string, number>} gains ゲージごとの加算量
 * @property {number} actionsLeft 操作後の残り行動回数
 * @property {import('./piles.js').Refill[]} refills 操作後に起きた補充
 */

/**
 * 「手札に入れる」操作の結果。
 * @typedef {Object} HoldResult
 * @property {'hold'} type 操作の種類
 * @property {number} deckIndex 取った山札の番号
 * @property {number} slotIndex 入れた手札の枠の番号
 * @property {import('./card.js').Card} card 手札に入れたカード
 * @property {number} actionsLeft 操作後の残り行動回数
 * @property {import('./piles.js').Refill[]} refills 操作後に起きた補充
 */

/**
 * 「手札から置く」操作の結果。
 * @typedef {Object} HandPlaceResult
 * @property {'placeFromHand'} type 操作の種類
 * @property {number} slotIndex 取った手札の枠の番号
 * @property {number} columnIndex 置いた列の番号
 * @property {import('./card.js').Card} card 置いたカード
 * @property {number} actionsLeft 操作後の残り行動回数
 */

/**
 * 「束を移す」操作の結果。
 * @typedef {Object} MoveResult
 * @property {'move'} type 操作の種類
 * @property {number} fromColumn 移し元の列の番号
 * @property {number} fromIndex 移し元の列で、束の一番下だった位置
 * @property {number} toColumn 移し先の列の番号
 * @property {import('./card.js').Card[]} cards 移したカード（下から順）
 * @property {number} actionsLeft 操作後の残り行動回数
 */

/**
 * 段取りの操作の結果の和。
 * @typedef {PlaceResult|DiscardResult|ReleaseResult|HoldResult|HandPlaceResult|MoveResult} PlanningResult
 */

export {};
