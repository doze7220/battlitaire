/**
 * 責務: 敵の予告の「攻撃の側」「防御の側」「子の側」「溜め（gain）の側」「列の印の札」を出すかどうかの判定（予告の札と始まりの文字が共用する）。
 * 純粋な判定だけで、何も import しない。
 */

/**
 * 予告に出す側を決める。防御の側は防御の量が 0 より大きいとき。子の側は予告の minions が数で 0 より大きいとき（攻撃・防御の側の判定とは独立）。
 * 攻撃の側は、攻撃の量が 0 以下で中の種類（variant）がなく、かつ防御の側が出るときだけ出さない（札が空にならない）。
 * 防御だけの行動（kind が 'guard'）は攻撃の側を出さず、防御の側を必ず出す（量が 0 でも「防御 0」になる）。
 * 列の印の札（mark）は、予告の mark がプレーンなオブジェクトなら出す（済んだ印でも出す。ほかの側の判定とは独立）。
 * 溜め（gain）は、予告の stock がプレーンなオブジェクトで足した量 gain が 0 より大きいとき（防御の側に「+量」を添える。ほかの側の判定とは独立）。
 * @param {{ kind: string, amount: number, variant?: string, defense: number, minions?: number, mark?: object, stock?: { gain: number, spent: number } }} action 敵の予告
 * @returns {{ attack: boolean, defense: boolean, minions: boolean, mark: boolean, gain: boolean }} 各側を出すか
 */
export function intentParts(action) {
  const minions = typeof action.minions === 'number' && action.minions > 0;
  const mark = typeof action.mark === 'object' && action.mark !== null;
  const gain = typeof action.stock === 'object' && action.stock !== null && action.stock.gain > 0;
  if (action.kind === 'guard') return { attack: false, defense: true, minions, mark, gain };
  const defense = action.defense > 0;
  const noAttackSide = action.kind === 'attack' && action.amount <= 0 && typeof action.variant !== 'string';
  return { attack: !(noAttackSide && defense), defense, minions, mark, gain };
}
