# RES: 作業計画・作業レポート (Interrupt) : BGMと効果音
* 参照元REQ: `./_log/req/261118_2032_Interrupt_BGMと効果音.md`

## 1. 作業目的
発注者が用意した音のファイル（mp3）で、BGM（タイトル・ゴブリンと巨人のステージ・ドラゴンのステージ）を入れ、効果音の一部（クリア・負け）を差し替え、ゲームスタート・巨人の攻撃・ドラゴンの爪・ドラゴンのブレスの効果音を足す。BGM はタイトル画面で流し、「はじめる」でスタートの音の後にステージの曲へ、敵の HP（負けは城の HP）が 0 になった瞬間に止め、敵を倒した後の案内・結果の板が出るのと同時にクリア・負けの音を鳴らす。ゲームのルール・設定の値（`js/rules/`）と、攻防の演出の時刻・長さ・見た目は変えない。REQ に書いていない効果音は今の仮の合成音のまま変えない。エンジンへの追加の依頼は要らない（`oz/ENGINE_API.md` 20章・21章の `Assets.load`・`Sound.playBgm`・`Sound.stopBgm`・`Sound.bgmVolume` だけで作る）。

## 2. アーキテクチャ設計

### 要件1: 音のファイルを `assets/` へ写す
*   元のファイルは動かさない・消さない（コピーだけ）。BGM は新しいフォルダ `assets/bgm/`、効果音は今の `assets/sounds/` に、REQ の表のとおり ASCII の名前で置く。

    | 元のファイル | 写す先 | 大きさ（バイト） |
    | --- | --- | --- |
    | `D:\ozlab\_attic\assets\魔王魂\maou_bgm_8bit26.mp3` | `assets/bgm/title.mp3` | 6197184 |
    | `D:\ozlab\_attic\assets\魔王魂\maou_bgm_8bit18.mp3` | `assets/bgm/stage.mp3` | 2525958 |
    | `D:\ozlab\_attic\assets\魔王魂\maou_bgm_8bit25.mp3` | `assets/bgm/dragon.mp3` | 1809774 |
    | `D:\ozlab\_attic\assets\Springin' Sound Stock\8bit勝利1.mp3` | `assets/sounds/win.mp3` | 30986 |
    | `…\Springin' Sound Stock\8bit失敗3.mp3` | `assets/sounds/lose.mp3` | 33493 |
    | `…\Springin' Sound Stock\8bit勝利3.mp3` | `assets/sounds/start.mp3` | 30986 |
    | `…\Springin' Sound Stock\8bitゴリラ1.mp3`（名前が NFD） | `assets/sounds/giantAttack.mp3` | 9044 |
    | `…\Springin' Sound Stock\8bitダメージ5.mp3`（名前が NFD） | `assets/sounds/dragonClaw.mp3` | 15947 |
    | `…\Springin' Sound Stock\8bit爆発1.mp3` | `assets/sounds/dragonBreath.mp3` | 29732 |

*   **コピーのやり方**: 使い捨ての Node.js のスクリプト（スクラッチパッドに置き、リポジトリには置かない）で、元のフォルダを `readdirSync` で一覧し、各ファイル名を `name.normalize('NFC')` にして、REQ の名前（NFC で書いた文字列）と一致するものを選んで `copyFileSync` する（NFD の2つも同じやり方で見つかる。`8bitダメージ5.mp3` は「ダメージ」の名前が多いので、ワイルドカードではなく NFC の完全一致で選ぶ）。一致がちょうど1つでなければ止める。コピー後に写した先の `statSync(...).size` が表の大きさと一致することを全9ファイルで確かめる。
*   `assets/sounds/win.wav`・`assets/sounds/lose.wav` を消す（`win`・`lose` は mp3 に替わるため）。
*   `tools/makeSounds.mjs` から `win`・`lose` の生成をやめる: `RECIPES` の `win`・`lose` の項目を消す。それに伴って使われなくなる `MAX_SEC_LONG`・`LONG_NAMES`（勝ち・負けの長さの上限のためだけにあった）と、`main()` の上限の分岐（すべて `MAX_SEC` にする）、`triangle`（`win` だけが使っていた波形）を消す。ほかの仮の音の作り方（式・引数・順序）は変えない。先頭の説明と `RECIPES` の JSDoc の「名前は `SOUND_FILES` と揃える」を「`SOUND_FILES` のうち WAV の仮の音の名前と揃える（`win`・`lose`・`start` などの mp3 は作らない）」に直し、`MAX_SEC` の説明を「音の長さの上限（秒）」に直す。
*   音のファイルの加工（切り詰め・形式の変換・ループ位置の調整）はしない。

### 要件2: 音の一覧と音量（`js/audio/soundConfig.js`・`js/main.js`）
*   **`js/audio/soundConfig.js`**（値だけ。`oz` も `js/` のほかのファイルも import しない）:
    *   `SOUND_FILES`（効果音）: `win` を `./assets/sounds/win.mp3`、`lose` を `./assets/sounds/lose.mp3` に替え、`start: './assets/sounds/start.mp3'`・`giantAttack: './assets/sounds/giantAttack.mp3'`・`dragonClaw: './assets/sounds/dragonClaw.mp3'`・`dragonBreath: './assets/sounds/dragonBreath.mp3'` を足す。ほかの項目は変えない。
    *   新しい `BGM_FILES`（BGM。凍結）: `title: './assets/bgm/title.mp3'`、`stage: './assets/bgm/stage.mp3'`、`dragon: './assets/bgm/dragon.mp3'`。一覧を分けるのは、資料と読み手のために BGM と効果音を見分けるためだけで、エンジンへは同じ `sounds` に合わせて渡す（ENGINE_API 21章: 一覧では SE と BGM を区別しない）。**`SOUND_FILES` と `BGM_FILES` の名前は重ねない**（同じ `sounds` に入るため）。JSDoc にこの決まりを書く。
    *   新しい `BGM_VOLUME = 0.5`（`Sound.bgmVolume` の初期値。試遊で決め直す）。
    *   新しい `STAGE_BGM`（凍結。敵の種類の識別子 → ステージの曲の名前）: `goblins: 'stage'`、`giant: 'stage'`、`dragon: 'dragon'`。識別子はルール層の値（`game.enemy.typeId`）を文字として書いたもので、`js/rules/` は import しない（JSDoc にそう書く）。
    *   新しい `BGM_TIMING`（凍結。試遊で決め直す値）: `titleFadeInMs: 0`（タイトルの曲のフェードイン）、`startFadeOutMs: 300`（「はじめる」でタイトルの曲を止めるフェードアウト）、`startToStageMs: 1200`（スタートの音を鳴らしてから最初のステージの曲を始めるまでの待ち時間。スタートの音の長さ 約 1.2 秒に合わせる）、`stageFadeInMs: 0`（ステージの曲のフェードイン。0 で頭からすぐ）、`knockoutFadeOutMs: 300`（HP が 0 になった瞬間に BGM を止めるフェードアウト）。
    *   先頭の責務のコメント（3行以内）を「効果音と BGM の名前とパスの一覧・SE と BGM の音量の初期値・BGM のフェードと待ち時間・敵の種類 → ステージの曲の表・連鎖の音程の調整値を1か所に凍結して持つ。値だけを持ち、oz も js/ のほかのファイルも import しない。音を鳴らさない」の趣旨に直す。
*   **`js/main.js`**: `BGM_FILES`・`BGM_VOLUME` を import し、起動の前に `Sound.bgmVolume = BGM_VOLUME;` を `Sound.seVolume = SE_VOLUME;` の隣に足し、`await Assets.load({ sounds: { ...SOUND_FILES, ...BGM_FILES } });` にする（`Engine.start` の前に読み終える。読み込みの終わっていない名前で `playBgm` するとエラーになるため）。先頭の責務のコメントと起動の前の準備のコメントを「SE と BGM の音量を設定し、効果音と BGM を読み込み終えてから」に直す。ロードの画面は作らない。
*   **音量・消音を切り替える画面や操作は作らない。** 設定の保存（`Storage`）もしない。

### 要件3〜6: BGM の流れ（新しい音の補助 `js/scenes/bgmCues.js`）
*   **`Sound` を呼ぶのは `js/scenes/soundCues.js`（効果音。`Sound.playSe`）と `js/scenes/bgmCues.js`（BGM。`Sound.playBgm`・`Sound.stopBgm`）の2つだけ**にする（音量の設定は今のまま `js/main.js`）。BGM の扱いを `soundCues.js` に足すと肥大化するので分ける。シーンはこの2つの関数を呼ぶ。
*   **新規 `js/scenes/bgmCues.js`**（`Scene` を継承しない音の補助。ルールの判定はしない。状態は持たない（どの曲が流れているかはエンジンが持つ））:
    *   `TITLE_BGM = 'title'`（タイトルの曲の名前。`BGM_FILES` の名前）。
    *   `stageBgmName(typeId)`（純粋関数）: `STAGE_BGM` を引き、自分の項目（`Object.prototype.hasOwnProperty.call`）があればその名前、なければ `null`。
    *   `playTitleBgm()`: `Sound.playBgm(TITLE_BGM, { fadeMs: BGM_TIMING.titleFadeInMs })`。同じ曲が流れていれば何もしない（エンジンの決まり）ので、遊び方から戻っても途切れず頭に戻らない。止まった後なら頭から流れる。
    *   `stopTitleBgm()`: `Sound.stopBgm({ fadeMs: BGM_TIMING.startFadeOutMs })`。
    *   `playStageBgm(typeId)`: `stageBgmName(typeId)` が `null` なら何もしない。そうでなければ `Sound.playBgm(名前, { fadeMs: BGM_TIMING.stageFadeInMs })`。前の敵を倒したときに BGM は止まっている（止まった後・フェードアウト中のどちらでも、同じ名前の `playBgm` は頭から流れる。ENGINE_API 21章）ので、巨人のステージでも `stage` が頭から流れ直す。
    *   `stopBgmOnKnockout()`: `Sound.stopBgm({ fadeMs: BGM_TIMING.knockoutFadeOutMs })`（流れていなければエンジンが何もしない）。
    *   import は `oz` の `Sound` と `../audio/soundConfig.js` の `STAGE_BGM`・`BGM_TIMING` だけ。
*   **要件3: タイトルの BGM（`js/scenes/TitleScene.js`）**: `init()` の最後で `playTitleBgm()` を呼ぶ（BOOT を離れた後なので `init` で鳴らせる。ENGINE_API 21章「最初の入力まで」。`init` で呼んではならないのはシーンの操作であって、`Sound` ではない）。BOOT（`BootScene.js`）・遊び方（`HowToScene.js`）は変えない（遊び方の画面は効果音を鳴らさず、BGM はそのまま流れ続ける）。決着の後にタイトルへ戻ると、BGM は止まっているので頭から流れる。
*   **要件4: ゲームスタート（`TitleScene.js`）**: 「はじめる」（`onPointer` の `'up'` で `button === 'start'`）と Enter・Space（`onKeyDown`）の両方から呼ぶ小さなメソッド `startGame()` を足し、その中で `stopTitleBgm()` → `playStartSe()`（`soundCues.js`）→ `Engine.changeScene(this.next())` の順に呼ぶ（今の2か所の `Engine.changeScene(this.next())` を `this.startGame()` に置き換える）。「遊び方」へ進むときは音を変えない。
*   **要件4・5: ステージの BGM（`js/scenes/BoardScene.js`）**: 待ち時間の残りと、いまのステージの敵の見分けは盤面のシーンが持つ（ルール層の状態には入れない）。
    *   状態を2つ足す: `stageBgmWaitMs`（スタートの音の後、最初のステージの曲を始めるまでの待ち時間の残り（ms）。`init` で `BGM_TIMING.startToStageMs`）、`stageBgmEnemyIndex`（ステージの曲を始めた敵の番号。`game.enemyIndex` の値。まだ始めていなければ `null`。`init` で `null`）。`BGM_TIMING` は `../audio/soundConfig.js` から import する。
    *   メソッド `updateStageBgm(dt)` を足し、`update(dt)` から1行で呼ぶ: `stageBgmWaitMs = Math.max(0, stageBgmWaitMs − dt)`。残りが 0 で、`stageBgmEnemyIndex !== this.game.enemyIndex` なら、`stageBgmEnemyIndex = this.game.enemyIndex` にして `playStageBgm(this.game.enemy.typeId)` を呼ぶ。
    *   こうすると、最初のステージ（ゴブリン）は新しいゲームの盤面に入って待ち時間が過ぎたところで、2つ目以降（巨人・ドラゴン）は「タップで次へ」で `game.startNextPhase()` が敵を入れ替えて攻防の演出のシーンが外れ、盤面の `update` が再開した最初のティックで、頭から鳴り始める。フェーズが変わっても敵の番号は変わらないので鳴らし直さない（途切れない・頭に戻らない）。
    *   待ち時間は盤面の `update` の `dt` で数える（段取りの間は `Engine.timeScale` が 1）。待っている間も入力は今のまま受け付ける（入力の扱いは変えない）。`setTimeout`・`performance.now()`・`Date.now()` は書かない。
    *   `game.enemyIndex`・`game.enemy.typeId` は読むだけ（ルール層は変えない）。
*   **要件6: HP が 0 になった瞬間に BGM を止める**: 演出の時計の上の「HP が 0 になる時刻」を、時間割が持つ HP の変化の記録（`castleHpChanges`・`enemyHpChanges`）から読む（時刻の式を書き写さない）。
    *   ルール層は城・敵へのダメージを残りの HP で頭打ちにする（`battle.js`）ので、時間割の HP の変化の `to` は 0 ちょうどになり、表示値（`hpTrack.js` の `sampleHp`。途中の値は 0 の向きに切る）が 0 になるのはその変化の終わり（`hpChangeEnd(change)` = `start + duration`）である。ゴブリンの軍勢では最後の1体が弾かれる時刻（`dropHp` の最後の当たり、または最初の当たり + `hpMs`）、巨人・ドラゴンではシールドの後の当たりの段（`enemyHit`）の HP の減りの終わりで、敵の体が倒れ始める時刻（`defeatEnemyBody(…, t + d)`）と同じになる。負けは城の HP の変化の終わり。
    *   **`js/anim/battleCues.js`** に純粋関数 `knockoutTime(castleHpChanges, enemyHpChanges)` を足す: 城の変化の並びから `to <= 0` の最初の変化を探し、あればその `hpChangeEnd`。なければ敵の変化の並びで同じく探し、あればその `hpChangeEnd`。どちらもなければ `null`（決着も敵の撃破もない攻防）。`hpChangeEnd` は `./hpTrack.js` から import する（`hpTrack.js` は変えない）。
    *   **`js/anim/battleDirector.js`** に、時間割から一度だけ求めた `knockoutAt`（`knockoutTime(timeline.castleHpChanges, timeline.enemyHpChanges)`）を持たせ、問い合わせ `isKnockedOut()`（`knockoutAt !== null && clock >= knockoutAt`。状態は変えない）を足す。スキップは時計を終わり（`endTime >= knockoutAt`）へ移すので、HP が 0 になる前にスキップしても、スキップの後はこの問い合わせが `true` になる。
    *   **`js/scenes/BattleShowScene.js`**: 状態 `bgmStopped`（この攻防で BGM を止め済みか。`false` から）を足し、小さなメソッド `stopBgmOnKnockout()`（`!this.bgmStopped && this.director.isKnockedOut()` なら `bgmStopped = true` にして `bgmCues.js` の `stopBgmOnKnockout()` を呼ぶ）を足す。これを `update` の中で `this.director.update(dt)` ときっかけの効果音の直後に、また `onPointer` のスキップ（`this.director.skip()`）の直後に呼ぶ（スキップした時点で止めるため）。ゴブリン・巨人を倒したとき・ドラゴンを倒したとき・負けたときで同じ形になる（HP が 0 になるのはこの3つの攻防だけ）。
*   **要件6: 案内・結果の板と同時のクリア・負けの音**: 案内（`result.defeat !== null`）・結果の板（`result.outcome !== null`）が出るのは今のまま演出の終わり（`look.finished`）。`BattleShowScene.update` の決着の音の条件を「`this.director.isFinished()` で、まだ鳴らしていない」にし、`playOutcomeSe(this.result.outcome, this.result.defeat)` を呼ぶ（鳴らす名前は `soundCues.js` が決める。決着も撃破もない攻防では何も鳴らさない）。鳴らし済みの印 `outcomeSePlayed` は今のまま1回に限るためだけに使う（JSDoc を「決着・敵を倒したときの効果音を…」に直す）。ルール層では、途中の敵を倒したときは `outcome === null` かつ `defeat !== null`、最後の敵（ドラゴン）を倒したときは `outcome === 'win'` かつ `defeat === null` なので、クリアの音は1回の攻防で1回だけ鳴る。
*   BGM が止まってから案内・結果の板が出るまでの効果音（当たり・修理など）は今のまま鳴る（きっかけの扱いは変えない）。

### 要件7: 攻撃の効果音（巨人の攻撃・ドラゴンの爪・ブレス）
*   **きっかけ（`js/anim/battleCues.js`）**: `buildBattleCues(timedSteps)` に、**敵の攻撃の段の始まり**のきっかけを1つ足す。種類は `'enemyAttackStart'`、時刻は、時刻つきの段の並びの中で種類が敵の攻撃の段（`enemyMarch`・`block`・`castleHit`・`strikeBlock`・`strikeCastle`。`BattleStep` の `heavy` の説明と同じ5つ。新しい定数 `ENEMY_ATTACK_STEP_TYPES`（凍結した `Set`）に持つ）である最初の段の `start`。敵の攻撃の段がなければ足さない。
    *   巨人の攻撃・ドラゴンの爪（`strike`）: 最初の段は `strikeBlock`（防御の兵がいなければ `strikeCastle`）で、その `start` は撃つ瞬間（1発目の打撃の時刻（`strikeTimes` の1つ目は `staggerDelay(0, …) = 0` で段の始め）、大きな一撃なら段が光る時刻（`stageFx.js` の `fireTime` は最初の大きな一撃の段の始め））。1発目の当たりの音（`strikeBlock` → 相殺・`strikeCastle` → 城の当たり）は今のきっかけのまま別に鳴る（両方鳴る）。
    *   ブレス（`flames`）: 最初の段は `enemyMarch`（炎が口から出始める）。同時に始まる札が燃える段（`burn`、`parallel`）は敵の攻撃の段ではないので選ばれない。相打ち・城に当たる・札が燃えるのきっかけは今のまま。
    *   ゴブリンの攻撃（`march`）も `enemyMarch` できっかけは出るが、音の表にないので鳴らない。敵の防御・振りかぶり・吸い込む（ための段）には敵の攻撃の段がないので、きっかけは出ない。
    *   時刻は時間割の段の `start` を写すだけで、時刻の式は増やさない。`js/anim/` は音の名前を持たない。`BattleCue` の typedef の種類に `'enemyAttackStart'` を足す。
*   **時刻 0 のきっかけ（`js/anim/battleDirector.js`）**: 今の `cuesInLastUpdate()` は「`prevClock < 時刻 <= clock`」で、最初の `update` の `prevClock` が 0 なので、**時刻 0 のきっかけは一度も答えられていない**。巨人の攻撃・ドラゴンの爪・ブレスの攻防は、敵の攻撃の段が最初の段（時刻 0）なので、このままでは攻撃の音が鳴らない（今の巨人・ドラゴンの爪の1発目の当たりの音（時刻 0）も同じ理由で鳴っていない）。そこで、状態 `firstUpdate`（まだ一度も `update` していないか。`true` から）を足し、`update(ms)` の頭で `this.prevClock = this.firstUpdate ? -Infinity : this.clock; this.firstUpdate = false;` にする（最初の `update` だけ時刻 0 のきっかけを含める）。`skip()` でも `this.firstUpdate = false` にする（今の `prevClock = clock` と合わせ、スキップで飛ばしたきっかけは出さない）。`cuesInLastUpdate()` の式は変えない。これで、REQ の「1発目の当たりの音も鳴る」が満たされる（今より、時刻 0 の1発目の当たりの音が1つ増える。5章に記録）。
*   **音の名前への対応（`js/scenes/soundCues.js`）**: 新しい表 `ENEMY_ATTACK_SE`（凍結。敵の種類の識別子 → 行動の中の種類の引き鍵 → 音の名前）: `giant: { default: 'giantAttack' }`、`dragon: { default: 'dragonClaw', breath: 'dragonBreath' }`（`goblins` は持たない＝鳴らさない）。引き方は `enemyShows.js` の `enemyAttackShow` と同じ（`variant` が文字列で表の自分の項目にあればそれ、なければ `default`）。
    *   純粋関数 `enemyAttackSeName(typeId, variant)`: 種類の項目がなければ `null`。あれば上の引き方の鍵の名前（なければ `null`）。
    *   純粋関数 `battleCueSeName(type, enemyTypeId, variant)`: `type === 'enemyAttackStart'` なら `enemyAttackSeName(enemyTypeId, variant)`、そうでなければ今の `BATTLE_CUE_SE[type] ?? null`。
    *   `playBattleCueSe(type, enemyTypeId, variant)`（引数を2つ足す）: `battleCueSeName` が `null` でなければ `Sound.playSe`。
*   **`BattleShowScene.update`**: きっかけのループを `playBattleCueSe(type, this.before.enemyTypeId, this.result.enemyAction.variant)` にする（この攻防の敵の種類と行動の中の種類はルール層の値を読むだけ）。

### 要件8: 早送り・スキップのとき
*   早送り: 効果音は今と同じく演出の時計のきっかけで鳴る（攻撃の音も同じ）。BGM はエンジンが実時間で流す（`timeScale` の影響を受けない。ENGINE_API 12章・21章）ので、ゲーム側では何もしない。
*   スキップ: `skip()` は今と同じく飛ばしたきっかけを出さない（攻撃の音を含む）。BGM はそのまま流れ、決着・敵の撃破の攻防で HP が 0 になる前にスキップしたときだけ、`onPointer` のスキップの直後の `stopBgmOnKnockout()` で止まる（要件6）。クリア・負けの音は今と同じく案内・結果の板が出るとき（`isFinished()`）に1回だけ。

### 要件9: 今と同じく使えること
*   新しいゲームは毎回新しい `BoardScene`（`init` で待ち時間と敵の番号を初期化）と、毎回新しい `BattleShowScene`（`bgmStopped` は `false` から）で始まるので、何度遊んでも要件3〜6のとおりに鳴る。BGM はエンジンが1曲だけ持ち、別の曲の `playBgm` はクロスフェード、同じ曲は何もしないので、二重に鳴らない。決着した攻防では HP が 0 の瞬間に止まるので、タイトルへ戻ったときに残らない。
*   読み込みに失敗した名前の `playSe`・`playBgm` はエンジンがエラーにせず何もしない（ENGINE_API 20章・21章）。`fadeMs` は 0 以上の有限数の設定値だけを渡す。

### 関連フォルダと論理クラス
*   **対象フォルダ**: `./assets/bgm/`（新規。BGM）、`./assets/sounds/`（効果音）、`./tools/`（仮の効果音の生成）、`./js/audio/`（音の設定）、`./js/`（`main.js`）、`./js/scenes/`（シーンと音の補助）、`./js/anim/`（音を合わせるきっかけ）
*   **関連する論理クラス**:
    *   新規: `js/scenes/bgmCues.js`（`TITLE_BGM`・`stageBgmName`・`playTitleBgm`・`stopTitleBgm`・`playStageBgm`・`stopBgmOnKnockout`。BGM の補助。`Sound.playBgm`・`Sound.stopBgm` を呼ぶのはここだけ）
    *   更新: `js/audio/soundConfig.js`（`SOUND_FILES` の差し替え・追加、`BGM_FILES`・`BGM_VOLUME`・`STAGE_BGM`・`BGM_TIMING`）、`js/main.js`（BGM の音量と読み込み）、`js/scenes/soundCues.js`（`START_SE`・`playStartSe`・`ENEMY_ATTACK_SE`・`enemyAttackSeName`・`battleCueSeName`・`playBattleCueSe` の引数、`DEFEAT_SE`・`outcomeSeName`・`playOutcomeSe` の引数）、`TitleScene`（タイトルの曲・`startGame`）、`BoardScene`（`stageBgmWaitMs`・`stageBgmEnemyIndex`・`updateStageBgm`）、`BattleShowScene`（`bgmStopped`・`stopBgmOnKnockout`・決着の音の条件・きっかけの音の引数）、`js/anim/battleCues.js`（`ENEMY_ATTACK_STEP_TYPES`・`'enemyAttackStart'` のきっかけ・`knockoutTime`）、`BattleDirector`（`knockoutAt`・`isKnockedOut`・`firstUpdate`）、`tools/makeSounds.mjs`（`win`・`lose` の生成をやめる）
    *   変えない: `js/rules/`・`js/view/`・`js/ui/`・`js/scenes/HowToScene.js`・`js/scenes/BootScene.js`・`js/anim/battleTimeline.js`・`js/anim/enemyShows.js`・`js/anim/hpTrack.js`（import して読むだけ）・`js/anim/battleSteps.js`・`oz/`・`index.html`・`_doc/`・`D:\ozlab\_attic\` の元のファイル

### 参照する責務
*   `PROJECT_ARCHITECTURE.md` からの抜粋（以後のタスク実行チャットは、この項目のみを責務情報源とする）:
    *   1章: `js/audio/` は「音の設定（音の名前とパスの一覧・SE の音量）」、`assets/sounds/` は「効果音（WAV。今は `tools/makeSounds.mjs` で作った仮の音）」、`tools/` は「開発用のスクリプト（仮の効果音の生成。ゲームの実行時には読まない）」。
    *   3章「起動と画面の流れ」: `js/main.js` は `Engine.start` の前に、`js/audio/soundConfig.js` の一覧の音を `Assets.load` で読み込み、SE の音量を設定する。BOOT では音を鳴らさず、TITLE と遊び方の画面も今は音を鳴らさない（BGM は後の Phase）。盤面から鳴らす。画面の流れは BOOT → TITLE（「はじめる」・Enter・Space で盤面へ、「遊び方」で HOWTO）→ 盤面 →（決着の表示のタップ）→ TITLE。BOOT へは戻らない。
    *   3章「1フェーズの流れ」5: 途中の敵を倒したフェーズは、演出の終わりに倒した敵と次の敵の案内を出し、タップで次のフェーズへ進んで次の敵と戦う。最後の敵（ドラゴン）を倒すとクリア、城の HP が 0 で負けとして決着し、演出の終わりに暗幕と結果の板を出し、そのタップで TITLE（`Engine.changeScene`）へ戻る。
    *   3章「1ティックの中での役割」: `update(dt)` でシーンが `anim` の時間を進める（`timeScale` の掛け算はしない）。攻防の演出の管理は、`dt` を足す壁の時計からヒットストップの並びで演出の時計を求め、見た目・HP・音のきっかけは演出の時計で答える。時計を進めた直後に、`anim` が答える直前の進みの間のきっかけを見て効果音を鳴らす（`draw` では鳴らさない）。
    *   4章 `js/main.js`: 書いてよい＝`Engine.start` の設定、起動時に1回だけ行う準備、起動の前の音の読み込み（`Assets.load`）と音量の設定／責務違反＝ルール、描画、シーンの中身。
    *   4章 `js/scenes/`: 書いてよい＝シーン（`Scene` の継承）。シーンの入力を補助するモジュール（`Scene` を継承しない）も置いてよい。入力を受けてルール層の操作を呼ぶこと、`anim` の時間を進めること、`view` を呼んで描くこと、シーンの切り替え、効果音を鳴らすこと（`Sound.playSe` は音の補助モジュール `js/scenes/soundCues.js` の中でだけ呼ぶ）／責務違反＝ルールの判定や計算を書くこと、細かい描画の処理。
    *   4章 `js/anim/`: 書いてよい＝時間で進む見た目の動き、ルール層の操作の結果を受けて見た目の値を作る、音を合わせるきっかけ（いつ・何が起きたか）を答えること／責務違反＝ゲームの状態を変えること、ゲームの結果を決めること、描画そのもの、`Sound` の import・音の名前を持つこと。
    *   4章 `js/audio/`: 書いてよい＝音の名前とパスの一覧と音量の設定／責務違反＝`oz` や `js/` のほかのフォルダの import、音を鳴らすこと。
    *   4章 `tools/`: 開発用のスクリプト（Node.js、外部パッケージなし。ゲームの実行時には読まない）／責務違反＝ゲームの実行時に読まれるコード、外部パッケージの使用。
    *   4章 `assets/`: 画像・音・スプライトJS、`tools/makeSounds.mjs` が書き出した仮の音。
    *   `js/audio/soundConfig.js`: 音の名前とパスの一覧（`SOUND_FILES`）、SE の音量の初期値（`SE_VOLUME`）、連鎖の音程の上がり方（`CHAIN_PITCH`）を1か所に凍結して持つ。
    *   `js/scenes/soundCues.js`: 段取りの操作・連鎖・行動終了・攻防のきっかけ（敵の回復・燃える札・打撃の段（`strikeBlock`→相殺の音、`strikeCastle`→城の当たりの音）を含む）・決着から鳴らす効果音を決め、`Sound.playSe` で鳴らす（シーンから呼ばれる音の補助）。
    *   `js/scenes/TitleScene.js`: タイトル画面のシーン。「はじめる」ボタンと Enter・Space キーで盤面へ、「遊び方」ボタン（どちらもこのシーンで押して同じボタンの中で離したとき）で遊び方の画面へ、渡された関数で作った新しいシーンへ進む。描くのは `titleView.js`。
    *   `js/scenes/HowToScene.js`: 遊び方の画面のシーン。…効果音は鳴らさない（変えない）。
    *   `js/scenes/BoardScene.js`: 盤面のシーン。入力を受けてルール層の操作を呼び、結果を `anim` に渡して進め、盤面を描く。放つ演出・敵の待機の動きの時計を進め、連鎖の音を鳴らす。行動終了で攻防の演出のシーンを積む。効果音は `soundCues.js` で鳴らす。
    *   `js/scenes/BattleShowScene.js`: 攻防の演出のシーン。結果を `anim` に渡して進め、早送り・スキップ・決着後・敵を倒した後のタップ（次のフェーズへ）を受け（`Engine.timeScale` を切り替えて戻す）、終わったら次のフェーズへ進めて戻るか、タイトルへ切り替える。決着の表示（結果）を描く。効果音は `soundCues.js` で鳴らす。
    *   `js/anim/battleCues.js`: 時間割が記録したきっかけの時刻（相殺・打撃での相殺（`strikeBlock`）・常時防御力での相殺・当たり・打撃での城の被害（`strikeCastle`）・修理・敵の回復・燃える札の飛び立ち）を読んで、時刻の昇順に並べるだけ（時刻の式は時間割の1か所）。
    *   `js/anim/battleDirector.js`: 攻防の演出全体の管理（壁の時計とヒットストップの並びから演出の時計を求める（スキップは両方を終わりへ移す）、終わったか・次へ進んでよいかを答える、スキップ、見た目の値、直前の進みの間に起きた音のきっかけ（スキップで飛ばした分は除く））。
    *   `js/anim/battleTimeline.js`: 段の並びから、段の時刻・…・HP の変化・…・きっかけの時刻（`cueTimes`）を組み立てる（読むだけ。変えない）。
    *   `js/anim/hpTrack.js`: HP の表示値の変わり方（整数の表示値）（`hpChangeEnd` を import して読むだけ。変えない）。
    *   `js/anim/enemyShows.js`: 敵の種類ごとの攻防の見せ方の表（行動の中の種類ごとの攻撃の見せ方）を持ち、引くだけ（引き方を写すだけ。変えない）。
    *   `tools/makeSounds.mjs`: 仮の効果音（WAV 16bit モノラル）を合成して `assets/sounds/` に書き出す（Node.js、外部パッケージなし）。
    *   憲法3章: `js/` に `requestAnimationFrame`・`addEventListener`・`getContext` を書かない。経過時間は `update(dt)` の `dt` と `draw` の `time` だけを使う。`update` の中で描画しない・`draw` の中で状態を変えない（`draw` で音を鳴らさない・止めない）。エンジンは `import { … } from 'oz'` でだけ使う。

### 開発資料（`PROJECT_ARCHITECTURE.md`）の更新予定
*   1章のフォルダ構造: `assets/bgm/`（BGM（mp3。発注者が用意した音））を足す。`assets/sounds/` の説明を「効果音（WAV は `tools/makeSounds.mjs` で作った仮の音、mp3 は発注者が用意した音）」に直す。`js/audio/` の説明を「音の設定（効果音と BGM の名前とパスの一覧・音量・BGM のフェードと待ち時間・敵の種類 → ステージの曲）」に直す。
*   3章「起動と画面の流れ」: 「`js/main.js` は … SE の音量を設定する」を「SE と BGM の音量を設定する（効果音と BGM を同じ `Assets.load` の `sounds` で読む）」に、「TITLE と遊び方の画面も今は音を鳴らさない（BGM は後の Phase）」を BGM の流れの説明に書き直す: BOOT では音を鳴らさない。TITLE に入るとタイトルの曲をループで流す（遊び方の画面との行き来では途切れず頭に戻らない。遊び方の画面は効果音を鳴らさない）。「はじめる」でタイトルの曲を短いフェードアウトで止めてスタートの音を鳴らし、待ち時間（`BGM_TIMING.startToStageMs`）の後に最初のステージの曲を流す。ステージ（敵1体ごと）の曲は敵の種類の表（`STAGE_BGM`。ゴブリン・巨人は `stage`、ドラゴンは `dragon`）で決め、ステージの始まり（最初はスタートの待ち時間の後、2つ目以降は倒した後の案内のタップで次の敵に入ったところ）で頭から流し、ステージの間はループで流れ続ける（フェーズ・演出・早送り・スキップで途切れない）。攻防の演出で敵の HP（負けは城の HP）が 0 になった瞬間（HP が 0 になる前にスキップしたらスキップした時点）に BGM を短いフェードアウトで止め、敵を倒した後の案内・結果の板が出るのと同時にクリアの音（ゴブリン・巨人・ドラゴンで同じ）・負けの音を鳴らす。決着の後にタイトルへ戻ると、タイトルの曲が頭から流れる。
*   3章「1フェーズの流れ」4: 「巨人の攻撃・ドラゴンの爪は撃つ瞬間（敵の攻撃の最初の段の始め）、ブレスは炎が口から出始めるときに、敵ごとの攻撃の音を鳴らす（ゴブリンの攻撃・ための段は鳴らさない）」を書き足す。
*   3章「1ティックの中での役割」: BGM を流す・止めるのもシーンの `update`・入力・`init`（タイトル）で行い、`draw` では行わないこと、盤面のシーンはスタートの後の待ち時間を `update` の `dt` で数えること、攻防の演出の管理は「HP が 0 になったか」を演出の時計で答えることを書き足す。
*   4章の表 `js/scenes/` の行: 「効果音を鳴らすこと（`Sound.playSe` は音の補助モジュール `js/scenes/soundCues.js` の中でだけ呼ぶ）」を「効果音・BGM を鳴らすこと（`Sound.playSe` は `js/scenes/soundCues.js`、`Sound.playBgm`・`Sound.stopBgm` は `js/scenes/bgmCues.js` の中でだけ呼ぶ。`Sound` を呼ぶのはこの2つだけ）」に直す。
*   4章の表 `js/audio/` の行: 「音の名前とパスの一覧と音量の設定」を「効果音と BGM の名前とパスの一覧、音量・BGM のフェードと待ち時間・敵の種類 → ステージの曲の表などの音の設定の値」に直す。`assets/` の行に「発注者が用意した音（mp3）」を足す。
*   4章「作成済みのファイル」の表:
    *   新規 `js/scenes/bgmCues.js`: タイトルの曲・ステージの曲（敵の種類の識別子から `STAGE_BGM` で引く）を流し、「はじめる」と HP が 0 になった瞬間に止める BGM の補助（`Sound.playBgm`・`Sound.stopBgm` で鳴らす。シーンから呼ばれる。状態は持たない（どの曲が流れているかはエンジンが持つ））。
    *   更新 `js/scenes/soundCues.js`: 鳴らす効果音にゲームスタート（`start`）と、敵の攻撃の始まりのきっかけ（`'enemyAttackStart'`）から敵の種類と行動の中の種類の表（`ENEMY_ATTACK_SE`。巨人の攻撃・ドラゴンの爪・ブレス。引き方は `enemyShows.js` と同じ）で引く攻撃の音、敵を倒したとき（途中の敵）のクリアの音を足す。
    *   更新 `js/audio/soundConfig.js`: 効果音の名前とパスの一覧（`SOUND_FILES`。`win`・`lose`・`start`・`giantAttack`・`dragonClaw`・`dragonBreath` は mp3）、BGM の名前とパスの一覧（`BGM_FILES`。名前は `SOUND_FILES` と重ねない）、SE・BGM の音量の初期値（`SE_VOLUME`・`BGM_VOLUME`）、BGM のフェードとスタートの後の待ち時間（`BGM_TIMING`）、敵の種類の識別子 → ステージの曲の名前（`STAGE_BGM`）、連鎖の音程の上がり方（`CHAIN_PITCH`）。
    *   更新 `js/scenes/TitleScene.js`: タイトル画面に入るとタイトルの曲を流し、「はじめる」・Enter・Space ではタイトルの曲を止めてスタートの音を鳴らしてから盤面へ進む。
    *   更新 `js/scenes/BoardScene.js`: スタートの後の待ち時間の残りと、ステージの曲を始めた敵の番号を持ち、待ち時間の後・敵が入れ替わったところでステージの曲を流す（`bgmCues.js`）。
    *   更新 `js/scenes/BattleShowScene.js`: HP が 0 になった瞬間（スキップならその時点）に BGM を止め（攻防ごとに1回）、敵を倒した後の案内・決着の結果の板が出るときにクリア・負けの音を鳴らす。きっかけの音に敵の種類と行動の中の種類を渡す。
    *   更新 `js/anim/battleCues.js`: 段のきっかけに加えて、敵の攻撃の始まり（敵の攻撃の最初の段の始め。`'enemyAttackStart'`）のきっかけを足すこと、時間割の HP の変化の記録から城・敵の HP が 0 になる時刻（`knockoutTime`）を求めること。
    *   更新 `js/anim/battleDirector.js`: 直前の進みの間に起きた音のきっかけ（最初の進みは時刻 0 を含む。スキップで飛ばした分は除く）と、HP が 0 になったか（`isKnockedOut`。スキップの後も答える）を答えることを足す。
    *   更新 `tools/makeSounds.mjs`: 書き出すのは仮の効果音（WAV）のうち `win`・`lose` を除いたもの（`win`・`lose` は発注者が用意した mp3）。
*   4章「土台から残したファイル」の `js/main.js`: 「`Engine.start` の前に音を読み込み、SE の音量を設定する」を「`Engine.start` の前に効果音と BGM を読み込み、SE と BGM の音量を設定する」に直す。

## 3. タスクリスト
*   [x] タスク1: 音のファイルの写しと、仮の音の `win`・`lose` の廃止
    *   **対象ファイル** :
        *   `./assets/bgm/title.mp3`・`./assets/bgm/stage.mp3`・`./assets/bgm/dragon.mp3` :（新規。コピー）
        *   `./assets/sounds/win.mp3`・`lose.mp3`・`start.mp3`・`giantAttack.mp3`・`dragonClaw.mp3`・`dragonBreath.mp3` :（新規。コピー）
        *   `./assets/sounds/win.wav`・`./assets/sounds/lose.wav` :（削除）
        *   `./tools/makeSounds.mjs` :（更新）
    *   **作業内容** :
        *   2章 要件1の表のとおり、使い捨ての Node.js のスクリプト（スクラッチパッドに置き、リポジトリには置かない）で、元のフォルダのファイル名を NFC に正規化して完全一致で選び（一致がちょうど1つでなければ止める）、`assets/bgm/`（なければ作る）・`assets/sounds/` へコピーする。元のファイルは動かさない・消さない・書き換えない。
        *   写した9ファイルの大きさ（バイト数）が表のとおりか確かめ、結果を「4. 詳細作業内容」に書く。
        *   `assets/sounds/win.wav`・`assets/sounds/lose.wav` を消す。
        *   `tools/makeSounds.mjs`: `RECIPES` の `win`・`lose` を消し、使われなくなる `MAX_SEC_LONG`・`LONG_NAMES`・`triangle` と `main()` の上限の分岐（`MAX_SEC` だけにする）を消す。先頭の説明・`RECIPES`・`MAX_SEC`・`main()` の JSDoc を2章 要件1のとおりに直す。ほかの音の作り方は変えない。
        *   `node --input-type=module --check < tools/makeSounds.mjs` で構文を確かめる（スクリプトは実行しない。実行すると今の WAV が書き直されるため）。
*   [x] タスク2: 音の一覧・音量・BGM の設定値と、起動の前の読み込み
    *   **対象ファイル** :
        *   `./js/audio/soundConfig.js` :（更新）
        *   `./js/main.js` :（更新）
    *   **作業内容** :
        *   `soundConfig.js`: 2章 要件2のとおり `SOUND_FILES` を直し・足し、`BGM_FILES`・`BGM_VOLUME`・`STAGE_BGM`・`BGM_TIMING` を凍結して足す。それぞれに JSDoc（型・単位・試遊で決め直す値であること・`SOUND_FILES` と `BGM_FILES` の名前を重ねない決まり・`STAGE_BGM` の識別子はルール層の値を文字として書いたもので `js/rules/` を import しないこと）を書く。先頭の責務のコメントを3行以内で直す。
        *   `main.js`: `BGM_FILES`・`BGM_VOLUME` を import し、`Sound.bgmVolume = BGM_VOLUME;` を足し、`Assets.load({ sounds: { ...SOUND_FILES, ...BGM_FILES } })` にする。先頭の責務のコメントと準備のコメントを直す。シーンの作り方・`Engine.start` の設定は変えない。
        *   2ファイルの構文チェック。
*   [x] タスク3: 攻撃の始まりのきっかけ・HP が 0 になる時刻・時刻 0 のきっかけ（anim）
    *   **対象ファイル** :
        *   `./js/anim/battleCues.js` :（更新）
        *   `./js/anim/battleDirector.js` :（更新）
    *   **作業内容** :
        *   `battleCues.js`: 2章 要件7のとおり `ENEMY_ATTACK_STEP_TYPES`（凍結した `Set`。JSDoc 付き）を足し、`buildBattleCues` で敵の攻撃の最初の段の `start` に種類 `'enemyAttackStart'` のきっかけを1つ足す（なければ足さない。並べ替えは今のまま）。`BattleCue` の typedef の種類に `'enemyAttackStart'` を足す。2章 要件6のとおり `knockoutTime(castleHpChanges, enemyHpChanges)`（`./hpTrack.js` の `hpChangeEnd` を import）を足す。JSDoc（引数・戻り値・時刻の式を持たず記録を読むだけであること）を書き、先頭の責務のコメントを3行以内で直す（音の名前を持たない・`Sound` を import しないことは今のまま）。
        *   `battleDirector.js`: `knockoutAt`（コンストラクタで `knockoutTime(timeline.castleHpChanges, timeline.enemyHpChanges)`）と `isKnockedOut()` を足す。`firstUpdate` を足し、`update` の頭の `prevClock` の設定と `skip()` を2章 要件7「時刻 0 のきっかけ」のとおりに直す（`cuesInLastUpdate()` の式・時計・ヒットストップ・見た目は変えない）。フィールドとメソッドの JSDoc を書き、先頭の責務のコメントに「HP が 0 になったか」を足す（3行以内）。
        *   2ファイルの構文チェック。
*   [x] タスク4: 音の補助（BGM の補助の新規と、効果音の補助の追加）
    *   **対象ファイル** :
        *   `./js/scenes/bgmCues.js` :（新規）
        *   `./js/scenes/soundCues.js` :（更新）
    *   **作業内容** :
        *   `bgmCues.js` を新規に作る。先頭に3行以内の責務の JSDoc（BGM の補助。`Sound.playBgm`・`Sound.stopBgm` を呼ぶのはここだけ。状態は持たない。ルールの判定はしない）。2章 要件3〜6のとおり `TITLE_BGM`・`stageBgmName`・`playTitleBgm`・`stopTitleBgm`・`playStageBgm`・`stopBgmOnKnockout` を JSDoc 付きで置く。import は `oz` の `Sound` と `../audio/soundConfig.js` の `STAGE_BGM`・`BGM_TIMING` だけ。
        *   `soundCues.js`: `START_SE = 'start'` と `playStartSe()` を足す。2章 要件7のとおり `ENEMY_ATTACK_SE`（凍結）・`enemyAttackSeName`・`battleCueSeName` を足し、`playBattleCueSe(type, enemyTypeId, variant)` にする（`'enemyAttackStart'` の鍵の文字列は `battleCues.js` のきっかけの種類と同じであることを JSDoc に書く。`js/anim/` は import しない）。`DEFEAT_SE = 'win'`（途中の敵を倒したときの音）と純粋関数 `outcomeSeName(outcome, defeat)`（`outcome` が `null` でなければ今の `OUTCOME_SE[outcome] ?? null`、そうでなく `defeat` が `null`・`undefined` でなければ `DEFEAT_SE`、どちらでもなければ `null`）を足し、`playOutcomeSe(outcome, defeat)` にする。`Sound.playSe` 以外の `Sound` は呼ばない。今の `BATTLE_CUE_SE`・`OUTCOME_SE`・段取り・連鎖・行動終了の音は変えない。先頭の責務のコメントを3行以内で直す（スタート・攻撃の音・敵を倒したときの音を足す）。
        *   2ファイルの構文チェック。
*   [x] タスク5: タイトル画面の BGM とゲームスタート
    *   **対象ファイル** :
        *   `./js/scenes/TitleScene.js` :（更新）
    *   **作業内容** :
        *   2章 要件3・4のとおり、`init()` の最後で `playTitleBgm()` を呼び、`startGame()`（JSDoc 付き。`stopTitleBgm()` → `playStartSe()` → `Engine.changeScene(this.next())`）を足して、「はじめる」と Enter・Space の2か所から呼ぶ。「遊び方」へ進むところは変えない。先頭の責務のコメント（3行以内）と `onPointer`・`onKeyDown`・`init` の JSDoc に音のことを足す。
        *   構文チェック。
*   [ ] タスク6: ステージの BGM（盤面のシーン）
    *   **対象ファイル** :
        *   `./js/scenes/BoardScene.js` :（更新）
    *   **作業内容** :
        *   2章 要件4・5のとおり、`stageBgmWaitMs`・`stageBgmEnemyIndex`（コンストラクタで JSDoc 付きで宣言し、`init` で初期化）と `updateStageBgm(dt)`（JSDoc 付き）を足し、`update(dt)` から1行で呼ぶ。`playStageBgm` を `./bgmCues.js` から、`BGM_TIMING` を `../audio/soundConfig.js` から import する。入力・攻防への入り方・描画は変えない。先頭の責務のコメント（3行以内）と `update` の JSDoc にステージの曲のことを足す。
        *   構文チェック。
*   [ ] タスク7: 攻防の演出のシーンの音（攻撃の音・HP 0 で BGM を止める・クリアの音）
    *   **対象ファイル** :
        *   `./js/scenes/BattleShowScene.js` :（更新）
    *   **作業内容** :
        *   2章 要件6〜8のとおり、きっかけの音を `playBattleCueSe(type, this.before.enemyTypeId, this.result.enemyAction.variant)` にし、`bgmStopped`（JSDoc 付き）と `stopBgmOnKnockout()`（JSDoc 付き。`./bgmCues.js` の `stopBgmOnKnockout` を呼ぶ）を足して `update` ときっかけの音の直後とスキップの直後から呼び、決着の音の条件を「終わっていて、まだ鳴らしていない」にして `playOutcomeSe(this.result.outcome, this.result.defeat)` を呼ぶ。早送り・スキップ・`timeScale`・次のフェーズへの進み方・描画は変えない。先頭の責務のコメント（3行以内）と `update`・`onPointer`・`outcomeSePlayed` の JSDoc を直す。
        *   構文チェック。
*   [ ] タスク8: JSDoc の記載漏れと決まりの確認
    *   **対象ファイル** :
        *   タスク1〜7で作成・変更したファイル（確認のみ。漏れがあれば、そのファイルの JSDoc だけを足す）
    *   **作業内容** :
        *   新しく作った・変えたファイルの先頭の責務のコメント（3行以内）、関数・メソッド・フィールド・typedef・定数の JSDoc（引数・戻り値・責務）に漏れがないか確かめ、漏れがあれば足す。
        *   grep で確かめる: `Sound` を import しているのが `js/main.js`（音量の設定だけ）・`js/scenes/soundCues.js`・`js/scenes/bgmCues.js` だけであること、`playBgm`・`stopBgm` が `bgmCues.js` だけ・`playSe` が `soundCues.js` だけにあること、`js/anim/`・`js/view/` が `Sound` を import せず音の名前を持たないこと、`js/audio/` が何も import しないこと、`js/rules/` に変更がないこと、`js/` に `setTimeout`・`setInterval`・`performance.now`・`Date.now`・`AudioContext`・`new Audio`・`addEventListener`・`requestAnimationFrame`・`getContext`・`Math.random`（`main.js` の今の受け渡しを除く）を書いていないこと、`draw` の中で音を呼んでいないこと。
        *   変更した .js ファイルすべての構文チェックをもう一度行う。
*   [ ] タスク9: 作業レポートの完成
    *   **対象ファイル** :
        *   `./_log/res/261118_2042_RES_Interrupt_BGMと効果音.md` :（更新）
    *   **作業内容** :
        *   「4. 詳細作業内容」の各タスクの記載がそろっているか確かめ、足りなければ書き足す。各タスクで判明した『開発資料の更新予定』の追記が2章の欄にあるか確かめる。懸念事項を整理する。
*   [ ] タスク10: 開発資料への反映
    *   **対象ファイル** :
        *   `./PROJECT_ARCHITECTURE.md` :（更新）
    *   **作業内容** :
        *   2章『開発資料（`PROJECT_ARCHITECTURE.md`）の更新予定』の内容（1章のフォルダ構造の `assets/bgm/`・`assets/sounds/`・`js/audio/` の説明、3章の「TITLE と遊び方の画面も今は音を鳴らさない（BGM は後の Phase）」の書き直しと BGM の流れ（タイトル・スタート・ステージ・敵を倒したとき・決着）、攻撃の音、1ティックの中での役割、4章の `js/scenes/`・`js/audio/`・`assets/` の行と、新しく作る・責務の変わったファイルの表、`js/main.js` の説明）を開発資料に反映する。
        *   ※ 実装AIによる開発資料の書き換えは本ワークフローにおいて原則禁止であるが、**この最終タスクのみ明示的な例外とする**（後続タスクが存在せず、資料の変更によって他タスクの前提が動く危険がないため）。個別の実装タスク内で資料を書き換えてはならない。

## 4. 詳細作業内容
※ 「3. タスクリスト」と同数の見出しを立て、タスク実行時にそれぞれ記入する。

### タスク1: 音のファイルの写しと、仮の音の `win`・`lose` の廃止
*   **作業内容** :
    *   スクラッチパッドの使い捨て Node スクリプトで、元のフォルダを `readdirSync` し NFC 完全一致（ちょうど1件）で選んで 9 ファイルを `assets/bgm/`（新規作成）・`assets/sounds/` へコピーした。元のファイルは未変更。
    *   写した先の大きさは全9ファイルが表と一致（title 6197184・stage 2525958・dragon 1809774・win 30986・lose 33493・start 30986・giantAttack 9044・dragonClaw 15947・dragonBreath 29732）。
    *   `assets/sounds/win.wav`・`lose.wav` を削除した。
    *   `tools/makeSounds.mjs`: `RECIPES` の `win`・`lose`、`MAX_SEC_LONG`・`LONG_NAMES`・`triangle`、`main()` の上限の分岐を削除（`MAX_SEC` のみ）。先頭の説明・`RECIPES` の JSDoc・`MAX_SEC` の説明を要件1のとおり直した。構文チェック OK。
    *   注意: `js/audio/soundConfig.js` はまだ `win.wav`・`lose.wav` を指している（タスク2で差し替える）ので、タスク2まで起動すると読み込みに失敗する。

### タスク2: 音の一覧・音量・BGM の設定値と、起動の前の読み込み
*   **作業内容** :
    *   `js/audio/soundConfig.js`: `SOUND_FILES` の `win`・`lose` を mp3 に替え、`start`・`giantAttack`・`dragonClaw`・`dragonBreath` を足した。`BGM_FILES`・`BGM_VOLUME`(0.5)・`STAGE_BGM`・`BGM_TIMING` を凍結して JSDoc 付きで追加。先頭の責務コメントを直した。
    *   `js/main.js`: `BGM_FILES`・`BGM_VOLUME` を import、`Sound.bgmVolume = BGM_VOLUME;` を追加、`Assets.load({ sounds: { ...SOUND_FILES, ...BGM_FILES } })` に変更。責務・準備のコメントを直した。
    *   2ファイルとも構文チェック OK。これでタスク1の後の読み込み失敗（旧 wav 参照）は解消。

### タスク3: 攻撃の始まりのきっかけ・HP が 0 になる時刻・時刻 0 のきっかけ（anim）
*   **作業内容** :
    *   `js/anim/battleCues.js`: `ENEMY_ATTACK_STEP_TYPES`（凍結 Set）、`buildBattleCues` で敵の攻撃の最初の段の `start` に `'enemyAttackStart'` を1つ足す処理、`knockoutTime`（`hpChangeEnd` を import）を追加。typedef・先頭の責務コメントを直した。
    *   `js/anim/battleDirector.js`: `firstUpdate`・`knockoutAt`・`isKnockedOut()` を追加。`update` の頭を `prevClock = firstUpdate ? -Infinity : clock` に、`skip()` に `firstUpdate = false` を追加。`cuesInLastUpdate()` の式・時計・見た目は変更なし。先頭の責務コメントを直した。
    *   2ファイルとも構文チェック OK。

### タスク4: 音の補助（BGM の補助の新規と、効果音の補助の追加）
*   **作業内容** :
    *   `js/scenes/bgmCues.js` を新規作成: `TITLE_BGM`・`stageBgmName`・`playTitleBgm`・`stopTitleBgm`・`playStageBgm`・`stopBgmOnKnockout`（JSDoc 付き。import は `oz` の `Sound` と `soundConfig.js` の `STAGE_BGM`・`BGM_TIMING` のみ）。
    *   `js/scenes/soundCues.js`: `START_SE`・`DEFEAT_SE`・`playStartSe`・`ENEMY_ATTACK_SE`・`enemyAttackSeName`・`battleCueSeName` を追加、`playBattleCueSe(type, enemyTypeId, variant)`・`outcomeSeName(outcome, defeat)`・`playOutcomeSe(outcome, defeat)` に変更。先頭の責務コメントを直した。既存の表・段取り・連鎖・行動終了の音は未変更。
    *   呼び出し側（BattleShowScene）は旧シグネチャのままなので、タスク7まで `playOutcomeSe`・`playBattleCueSe` の引数が不足した状態（タスク7で直す）。
    *   2ファイルとも構文チェック OK。

### タスク5: タイトル画面の BGM とゲームスタート
*   **作業内容** :
    *   `js/scenes/TitleScene.js`: `bgmCues.js` の `playTitleBgm`・`stopTitleBgm` と `soundCues.js` の `playStartSe` を import。`init()` の最後で `playTitleBgm()`、新メソッド `startGame()`（`stopTitleBgm()` → `playStartSe()` → `Engine.changeScene(this.next())`）を足し、「はじめる」の `'up'` と Enter・Space から呼ぶ。「遊び方」は変更なし。責務コメント・`init`・`onPointer`・`onKeyDown` の JSDoc を直した。構文チェック OK。

### タスク6: ステージの BGM（盤面のシーン）
*   **作業内容** :
    *   (未着手)

### タスク7: 攻防の演出のシーンの音（攻撃の音・HP 0 で BGM を止める・クリアの音）
*   **作業内容** :
    *   (未着手)

### タスク8: JSDoc の記載漏れと決まりの確認
*   **作業内容** :
    *   (未着手)

### タスク9: 作業レポートの完成
*   **作業内容** :
    *   (未着手)

### タスク10: 開発資料への反映
*   **作業内容** :
    *   (未着手)

## 5. 懸念事項・要確認ポイント
### テストプレイで確かめること（発注者が見る点）
*   BOOT（TAP SCREEN）では音が鳴らず、タイトル画面でタイトルの曲が流れる。遊び方を開いて戻っても、曲が途切れず頭に戻らない。
*   「はじめる」（Enter・Space）で、タイトルの曲が短く消えてスタートの音が鳴り、鳴り終わってからゴブリンのステージの曲が始まる。その間も盤面を操作できる。
*   ステージの曲がフェーズをまたいでも、攻防の演出・早送り・スキップでも途切れず、曲の終わりまで来たら頭に戻ってくり返す。早送りで BGM が速くならない。
*   ゴブリンの最後の1体が弾かれて HP が 0 になった瞬間に BGM が止まり、演出が終わって案内が出るのと同時にクリアの音が鳴る。タップで巨人のステージに入ると、同じ曲が頭から流れる。
*   巨人の攻撃で、撃つ瞬間に巨人の攻撃の音が鳴る（当たりの音も鳴る）。巨人を倒したときもゴブリンと同じく、HP 0 で BGM が止まり、案内と同時にクリアの音。タップでドラゴンのステージに入ると、ドラゴンの曲が流れる。
*   ドラゴンの爪で爪の音、ブレスで炎が口から出るときにブレスの音が鳴る（相打ち・城に当たる音・札が燃える音は今のまま）。
*   ドラゴンの HP が 0 になった瞬間に BGM が止まり、結果の板が出るのと同時にクリアの音が鳴る。負けは、城の HP が 0 になった瞬間に BGM が止まり、結果の板と同時に負けの音が鳴る。
*   決着の攻防を、HP が 0 になる前にスキップすると、スキップした時点で BGM が止まり、結果の板と同時にクリア・負けの音が鳴る。
*   結果の板のタップでタイトルへ戻ると、タイトルの曲が頭から流れ、もう一度遊んでも同じように鳴る。BGM が二重に鳴ったり、残ったりしない。
*   BGM と効果音の音量の釣り合い（BGM の初期値 0.5・SE 0.7）。フェードの長さ・スタートの後の待ち時間（`BGM_TIMING`）も試遊で決め直す。

### 計画時の懸念・決めたこと
*   **起動の前の空の時間**: BGM は合わせて約 10MB あり、`Engine.start` の前の `Assets.load` で読み終えるまで画面が空の時間が延びる。ロードの画面は作らない（REQ のとおり記録だけ）。
*   **デコード後のメモリ**: BGM はデコードした後のメモリが大きい（タイトルの曲は約 5 分）。スマホで重い・鳴らないなどの様子があれば発注者に伝える。
*   **ループのつなぎ目**: mp3 はファイルの頭と終わりにわずかな無音を持つことがあり、ループのつなぎ目で一瞬途切れて聞こえる場合がある（ファイルの加工・エンジンの回避策はしない）。
*   **時刻 0 のきっかけ（今の音が1つ増える）**: 今の `BattleDirector.cuesInLastUpdate()` は時刻 0 のきっかけを一度も答えていない（最初の `update` の `prevClock` が 0 で、条件が `prevClock < 時刻`）。巨人の攻撃・ドラゴンの爪で敵の攻撃の段が最初の段のとき、今は1発目の当たりの音（時刻 0 の `strikeBlock` → 相殺の音、防御の兵がいなければ `strikeCastle` → 城の当たりの音）が鳴っていない。攻撃の音（同じく時刻 0）を鳴らすため、最初の `update` だけ時刻 0 のきっかけを含めるように直すので、**この1発目の当たりの音も今より新しく鳴るようになる**（REQ の「この時刻には1発目の当たりの音も鳴るが、両方鳴らす」のとおりになる）。ブレスの攻防でも時刻 0 のきっかけはブレスの音だけ（相打ち・城・札が燃えるの音は後の時刻）。聞こえ方を試遊で確かめてほしい。
*   **スタートの待ち時間の間に攻防に入ったとき**: 待ち時間（1.2 秒）の間に行動を使い切って攻防に入ると、盤面の `update` が止まるので待ち時間の数えも止まり、ステージの曲は攻防の演出から戻った後、残りの待ち時間の後に始まる（実際には 1.2 秒で行動を使い切ることはまずない）。
*   **ステージの始まりの見分け**: ルール層の `game.enemyIndex`（いま戦っている敵の番号。`startNextPhase` で敵が入れ替わると増える）を読むだけで見分ける。ルール層は変えない。
*   **素材の利用規約**: 魔王魂・Springin' Sound Stock の利用規約（クレジット表記の要否など）は、計画の範囲外として発注者が確かめる。画面への表記は作らない。

### 実装時に判明した点
*   タスク3: 最初の `update` で `prevClock = -Infinity` にするため、時刻 0 のきっかけ（1発目の当たりの音を含む）が最初の `update` で出る。同じ `update` で出るきっかけの並びは時刻の昇順で、同時刻のときは cueTimes のきっかけ → `'enemyAttackStart'` の順ではなく、`sort`（安定）により push した順（段の cueTimes が先、`enemyAttackStart` は同じ段の cueTimes の後）になる。同時刻の2つの音の順は聞き分けられない程度のため問題なしと判断。
