/**
 * 責務: 敵の予告の「攻撃の側」「防御の側」を出すかどうかの判定（予告の札と始まりの文字が共用する）。
 * 純粋な判定だけで、何も import しない。
 */

/**
 * 予告に出す側を決める。防御の側は防御の量が 0 より大きいとき。
 * 攻撃の側は、攻撃の量が 0 以下で中の種類（variant）がなく、かつ防御の側が出るときだけ出さない（札が空にならない）。
 * @param {{ kind: string, amount: number, variant?: string, defense: number }} action 敵の予告
 * @returns {{ attack: boolean, defense: boolean }} 各側を出すか
 */
export function intentParts(action) {
  const defense = action.defense > 0;
  const noAttackSide = action.kind === 'attack' && action.amount <= 0 && typeof action.variant !== 'string';
  return { attack: !(noAttackSide && defense), defense };
}
