/**
 * 責務: 中断データを Storage に読み書き・消去する唯一の所。デバッグ（Engine.debug）のときは保存も消去も読み込みもしない。
 * 設定の値は扱わない（settingsStore.js の持ち分）。Engine.debug は Engine.start の後だけ読めるので、シーンからだけ呼ぶ。
 */
import { Engine, Storage } from 'oz';
import { toSuspendData, readSuspendData } from '../rules/suspendData.js';

/** 中断データを Storage に入れる名前（このファイルだけが使う）。 @type {string} */
const SUSPEND_NAME = 'suspend';

/**
 * Storage.open の defaults に足す名前と既定値（中断データなし）。
 * @type {Readonly<{suspend: null}>}
 */
export const SUSPEND_DEFAULTS = Object.freeze({ [SUSPEND_NAME]: null });

/**
 * 中断データの保存の値を書く唯一の関数。Engine.debug が真なら何もしない。
 * @param {import('../rules/suspendData.js').SuspendData|null} value 保存する中断データ（消すときは null）
 * @returns {void}
 */
function writeSuspend(value) {
  if (Engine.debug) return;
  Storage.set(SUSPEND_NAME, value);
}

/**
 * ゲームの今の状態（ターンの始まり、または3択の段階）を中断データとして上書きで保存する。デバッグなら何もしない。ゲームは変えない。
 * @param {import('../rules/Game.js').Game} game 保存するゲーム
 * @returns {void}
 */
export function saveSuspend(game) {
  if (Engine.debug) return;
  writeSuspend(toSuspendData(game));
}

/**
 * 保存された中断データを読む。デバッグなら null（何も書かない）。
 * 保存があるのに版番号・形・設定が合わず読めないときは、その中断データだけを消してから null を返す。
 * @returns {import('../rules/suspendData.js').SuspendData|null} 中断データ。なければ null
 */
export function loadSuspend() {
  if (Engine.debug) return null;
  const raw = Storage.get(SUSPEND_NAME);
  if (raw === null || raw === undefined) return null;
  const data = readSuspendData(raw);
  if (data === null) clearSuspend();
  return data;
}

/**
 * 保存された中断データを消す。デバッグなら何もしない。
 * @returns {void}
 */
export function clearSuspend() {
  if (Engine.debug) return;
  writeSuspend(null);
}
