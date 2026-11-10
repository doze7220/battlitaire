/**
 * 責務: 盤面の選択の状態（山札・手札・束）と、タップに応じた選択の遷移・ルール層の操作の呼び出し、
 * 選択から表示用の値（BoardUi）を作ること。ルールの判定は書かず、game の問い合わせと操作を呼ぶだけ。
 */

/**
 * 盤面の選択の状態。選択なしは null。
 * @typedef {null
 *   | { kind: 'deck', index: number }
 *   | { kind: 'hand', index: number }
 *   | { kind: 'run', column: number, from: number }} BoardSelection
 */

/**
 * タップを処理した結果。
 * @typedef {Object} TapStep
 * @property {BoardSelection} selection タップ後の選択の状態
 * @property {import('../rules/planningResults.js').PlanningResult|null} result 操作を呼んだときの結果（呼ばなかった・操作が null を返したときは null）
 */

/**
 * 行動が残っているときのタップを処理する。ルール層の操作を呼ぶことがある。
 * @param {import('../rules/Game.js').Game} game ゲーム
 * @param {BoardSelection} selection 今の選択
 * @param {import('../view/layout.js').Hit|null} hit 当たったもの（何もなければ null）
 * @returns {TapStep} タップ後の選択と、操作の結果
 */
export function applyTap(game, selection, hit) {
  if (hit === null || hit.kind === 'actionEnd') return { selection: null, result: null };
  if (hit.kind === 'deck') return tapDeck(game, selection, hit.index);
  if (hit.kind === 'hand') return tapHand(game, selection, hit.index);
  if (hit.kind === 'column') return tapColumn(game, selection, hit.index, hit.cardIndex ?? null);
  if (hit.kind === 'release') return tapRelease(game, selection, hit.index);
  return { selection: null, result: null };
}

/**
 * 山札のタップ（同じ山札なら捨てる、別の山札なら選択を替える）。
 * @param {import('../rules/Game.js').Game} game ゲーム
 * @param {BoardSelection} selection 今の選択
 * @param {number} index 山札の番号
 * @returns {TapStep} タップ後の選択と、操作の結果
 */
function tapDeck(game, selection, index) {
  if (selection !== null && selection.kind === 'deck' && selection.index === index) {
    const result = game.canDiscard(index) ? game.discardTop(index) : null;
    return { selection: null, result };
  }
  if (game.canSelectDeck(index)) return { selection: { kind: 'deck', index }, result: null };
  return { selection: null, result: null };
}

/**
 * 手札の枠のタップ（山札の選択中に空き枠なら入れる、カード入りなら手札の選択）。
 * @param {import('../rules/Game.js').Game} game ゲーム
 * @param {BoardSelection} selection 今の選択
 * @param {number} slot 手札の枠の番号
 * @returns {TapStep} タップ後の選択と、操作の結果
 */
function tapHand(game, selection, slot) {
  if (game.hand[slot] === null) {
    if (selection !== null && selection.kind === 'deck' && game.canHold(selection.index, slot)) {
      return { selection: null, result: game.hold(selection.index, slot) };
    }
    return { selection: null, result: null };
  }
  if (selection !== null && selection.kind === 'hand' && selection.index === slot) {
    return { selection: null, result: null };
  }
  if (game.canSelectHandSlot(slot)) return { selection: { kind: 'hand', index: slot }, result: null };
  return { selection: null, result: null };
}

/**
 * 列のタップ（山札・手札の選択中は置く、束の選択中は移す、選択なしならカードから束を選ぶ）。
 * @param {import('../rules/Game.js').Game} game ゲーム
 * @param {BoardSelection} selection 今の選択
 * @param {number} column 列の番号
 * @param {number|null} cardIndex タップしたカードの列の中の番号（カードに当たらなければ null）
 * @returns {TapStep} タップ後の選択と、操作の結果
 */
function tapColumn(game, selection, column, cardIndex) {
  if (selection === null) {
    if (cardIndex !== null && game.canSelectRun(column, cardIndex)) {
      return { selection: { kind: 'run', column, from: cardIndex }, result: null };
    }
    return { selection: null, result: null };
  }
  if (selection.kind === 'deck') {
    const result = game.placeableColumns(selection.index).includes(column)
      ? game.place(selection.index, column)
      : null;
    return { selection: null, result };
  }
  if (selection.kind === 'hand') {
    const result = game.handPlaceableColumns(selection.index).includes(column)
      ? game.placeFromHand(selection.index, column)
      : null;
    return { selection: null, result };
  }
  if (selection.kind === 'run') {
    if (column === selection.column) return { selection: null, result: null };
    const result = game.runTargetColumns(selection.column, selection.from).includes(column)
      ? game.moveRun(selection.column, selection.from, column)
      : null;
    return { selection: null, result };
  }
  return { selection: null, result: null };
}

/**
 * 「放つ」ボタンのタップ（放てれば放って選択を外す。放てなければ選択はそのまま）。
 * @param {import('../rules/Game.js').Game} game ゲーム
 * @param {BoardSelection} selection 今の選択
 * @param {number} column 列の番号
 * @returns {TapStep} タップ後の選択と、操作の結果
 */
function tapRelease(game, selection, column) {
  if (game.canRelease(column)) return { selection: null, result: game.release(column) };
  return { selection, result: null };
}

/**
 * 選択とルール層の問い合わせから、盤面の描画用の値を作る（状態は変えない）。
 * @param {import('../rules/Game.js').Game} game ゲーム
 * @param {BoardSelection} selection 今の選択
 * @returns {import('../view/boardView.js').BoardUi} 描画用の値
 */
export function boardUiFor(game, selection) {
  const deck = selection !== null && selection.kind === 'deck' ? selection.index : null;
  const hand = selection !== null && selection.kind === 'hand' ? selection.index : null;
  const run = selection !== null && selection.kind === 'run' ? selection : null;
  let placeableColumns = [];
  if (deck !== null) placeableColumns = game.placeableColumns(deck);
  else if (hand !== null) placeableColumns = game.handPlaceableColumns(hand);
  else if (run !== null) placeableColumns = game.runTargetColumns(run.column, run.from);
  const holdSlots = [];
  if (deck !== null) {
    game.hand.forEach((_, s) => {
      if (game.canHold(deck, s)) holdSlots.push(s);
    });
  }
  return {
    selectedDeck: deck,
    discardMode: deck !== null && game.canDiscard(deck),
    placeableColumns,
    holdSlots,
    selectedHandSlot: hand,
    selectedRun: run !== null ? { column: run.column, from: run.from } : null,
    releasable: game.columns.map((_, c) => game.canRelease(c)),
    outOfActions: game.isOutOfActions(),
    battleReady: game.canResolveBattle(),
  };
}
