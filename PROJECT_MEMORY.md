# PROJECT_MEMORY.md · Prove It, Picasso!

完整项目记忆。入口和规则见 `AGENTS.md`。

- 本文依据：仓库 `main` 分支 commit `245b2a1`（2026-11-18 23:38），2026-11-18 至 2026-11-19 实际运行的命令结果，以及 2026-11-19 在线上游戏里实际跑通的流程。
- 用户：GitHub 账号 `abbyabbyZzz`。仓库所有者：`xinruilu24-art`（显示名 PennyLLL），两人都向 `main` 提交。
- 标签只用以下几种。来源：用户确认（日期）、文件（路径）、命令结果、对话（日期）、AI 推断。状态：已确认、进行中、已完成待验收、已验收、待确认、已失效。

---

## a. 项目快照

### 当前阶段

原型迭代期（CCT405 课程项目）。游戏五天流程、两个 Case、7 个结局都能玩到；最近两天（2026-11-17 至 2026-11-18）主要在做「剧本管理器」：把游戏文案和数值从代码移到 `data/script.json`，让作者在网页里编辑、编译并直接发布到 GitHub。

### 最近在做什么、做到哪一步

- 2026-11-17：新建 `script-manager.html`，支持本地编辑、备份和 GitHub 同步（commit `cfe2cf1`）。
- 2026-11-18 上午到下午：按画师 Case 管理剧本；帖子 / 评论 / 聊天分别编译成 block；把两位画师五天的现有文案导入 `data/script.json`；游戏改为开局读取 `data/script.json`（commit `03541bd`、`1f05e4c`、`6ca0363`）。
- 2026-11-18 晚上：所有玩家行动按剧本中 `@action` 的位置结算（`9734bbb`）；评论和直播加入逐条证据相关性判定（`f0876a4`）；错误证据会触发评论者的楼中楼回复「这完全是 bs。」（`a392fe3`）；同步最新剧本备份（`245b2a1`）。
- 画师 1 的 Day 1 文案正在通过管理器逐条修改，部分已改成英文，画师名改为 Iris（`a7ad42a`、`ef284b1`、`293df17`、`b08dbc7`）。来源：文件（`data/script.json`）。
- 最终交付语言定为英文（只限玩家看到的内容）；画师 2 暂缓。来源：用户确认（2026-11-19）。
- 目前玩家看到的内容中英混杂（AI 推断，依据 2026-11-19 线上实测）：画师 1 的开场、Day 1 帖子和部分聊天是英文；开始页、按钮（同意 / 反驳 / 查看结果）、状态栏（舆论、画师压力、第 N 天）、第三天新帖 `n5`、系统提示、结局标题仍是中文。

### 已知的阻塞与问题

1. **测试失败，但游戏本身能玩通。** 来源：命令结果（2026-11-18、2026-11-19 运行 `node --test tests/*.test.cjs`）：29 个测试，11 通过，18 失败。逐个 commit 回测（把每个 commit 的 `index.html` 和 `tests/` 复制到临时目录运行）的结果：

   | commit | 通过 / 失败 |
   | --- | --- |
   | `03541bd` 及更早 | 29 / 0 |
   | `1f05e4c` | 28 / 1 |
   | `6ca0363` 至 `b08dbc7` | 25 / 6 |
   | `9734bbb` 至 `a392fe3` | 12 / 17 |
   | `245b2a1`（当前） | 11 / 18 |

   2026-11-19 的判定（来源：命令结果 + 在线上游戏里用真实计时器跑同样的流程）：失败的绝大多数是**测试过时**，玩家实际看到的结果符合 `README.md` 的规则。过时的原因：
   - 测试里写死了旧的中文文案，而剧本已改成英文或改了措辞（例如 `谢谢你来问`、`压力`、`谢谢你，我先缓一缓`）。
   - 测试在新手导览结束前就调用行动；现在 `act()` 要求 `S.tutorial.phase === 'done'`，所以什么都不发生。
   - 测试调用旧的内部函数和旧的数值规则，例如 `agree(SMALL)` 期望 +5（现在直播同意按弹幕立场结算）、出示公告固定 +10（现在按证据相关性结算，D14）、开场固定 3 条消息（现在是 4 条）、转发后立刻加压力（现在在剧本 `@action` 处结算，D13）。
   - 测试引用的帖子 `n3` 在画师 1 中已不存在（见第 3 条）。

   线上实测通过的流程（画师 1，2026-11-19，控制台无报错）：过程视频确认（舆论 +10，用 2 个时段，发布视频帖）和拒绝（不扣时段、不发帖）；直播对赌确认（画师 1 压力 +20、画师 2 +30，发布公告，用 1 个时段）；陪伴画师（压力 −5，获得 `e3`）；外卖奶茶（−¥20、压力 −5）；转发指控帖（压力 +5）；休息；第三天事件（舆论 −20、压力 +10，自动打开画师聊天并发来 `n5` 卡片）；咪画师小葵 `e2`、布丁 `e5`、青柠 `e6`；第 5 天直播三轮弹幕 → 投票 → 结局 03。
2. **测试里的 `ReferenceError: location is not defined`**：`location` 是浏览器自带的「当前网页地址」。游戏用它判断是在线打开（读取剧本管理器发布的 `data/script.json`）还是双击本地文件打开（用内嵌备用版本）。浏览器里永远有它，游戏需要它，不用改；只有测试用的模拟环境里没有，所以报错。2026-11-19 在临时副本的测试环境里补上 `location` 后，这些报错消失，失败数不变（仍是 18），说明它不影响结果。来源：命令结果。
3. **两处玩家能看到的、和文档不一致的地方**（来源：2026-11-19 线上实测），已按用户决定处理：
   - 画师 1 的小粉书里已经没有「约稿时间线」帖子（`n3`，证据 `e2`），它在 commit `245b2a1` 中从画师 1 的 `data/script.json` 里消失。用户确认不需要这条帖子（D22），不恢复。`e2` 仍可通过咪画师小葵的回复拿到。`README.md` 和 `EVIDENCE_COLLECTION.md` 里「可在小粉书收藏约稿时间线」的说法对画师 1 已过时，尚未修改。
   - 第三天的新鉴定帖 `n5` 原来排在信息流最后。2026-11-19 已改为排在最顶部（D23），改动在 `index.html` 的 `availableNotes()`，2026-11-19 已推送到 `main`。

### 下一个任务

**暂停，等用户把剧本修改完毕再定。** 来源：用户确认（2026-11-19）。

- 用户正在剧本管理器里修改剧本。在用户说「剧本改完了」之前，不要主动开始新任务，也不要改 `data/script.json`。
- 第三天新帖置顶（D23）和 `AGENTS.md`、`PROJECT_MEMORY.md`、`CLAUDE.md` 已于 2026-11-19 推送到 `main`，等用户验收。
- 剧本改完后可选的任务（AI 推断，由用户选）：
  1. 把玩家看到的内容翻译成英文（D17）：`index.html` 里写死的开始页、按钮、状态栏、系统提示，加上剧本里还没翻译的部分。验收：画师 1 从开始页到结局，玩家能看到的文字全部是英文；数值和流程不变；控制台无报错。
  2. 更新过时的测试，让 `node --test tests/*.test.cjs` 重新全部通过（测试里补 `location`、先结束新手导览、改用当前的剧本文案和结算规则）。验收：29 个测试全部通过，没有 unhandledRejection；不为了让测试通过而改游戏行为。
  3. 更新 `README.md`、`EVIDENCE_COLLECTION.md` 中已过时的说法（画师 1 的约稿时间线帖子）。

---

## b. 术语表

| 术语 | 含义 | 来源 |
| --- | --- | --- |
| Case | 一局游戏所跟的画师案件。目前有 `case_artist_1`（画师 1，现名 Iris）和 `case_artist_2`（画师 2），开局数值、偏好、角色表各自独立。 | 文件（`data/script.json`） |
| 代理人 / 玩家 | 玩家扮演画师的案件代理人。剧本中说话者写作「玩家」。 | 文件（`README.md`、`data/script.json`） |
| Chloe | 玩家的朋友，负责开场介绍和新手导览，每天早上按舆论给出提示。原名阿紫，2026-11-17 改名。 | 文件（`data/script.json`）、制作历史 |
| Day | 游戏中的一天，共 5 天（Day 1–Day 5）。 | 文件（`index.html`） |
| 时段（slot） | 每天三个：`morning`（早上）、`afternoon`（下午）、`evening`（晚上）。每个时段做一件事。剧本中另有 `any`（任意）和 `live`（直播）。 | 文件（`data/script.json`） |
| 数值（stat） | 三个：舆论 `opinion`（0–100，网友对画师的信任）、画师压力 `stress`（0–100）、余额 `money`（元）。 | 文件（`data/script.json` 的 `stats`） |
| Action | 一种玩家行动或系统事件，定义时段消耗（`timeCost`）、可用天数、可用时段、条件和数值效果。共 33 个，在 `data/script.json` 的 `actions` 里，由两个 Case 共用。 | 文件（`data/script.json`） |
| 偏好（preferences） | 某个 Case 对 Action 效果的额外调整，叠加在共用 Action 之上。 | 文件（`README.md`） |
| block / event | 剧本的基本单位：一段带头部字段的文本（帖子、聊天或系统流程），编译后存进 Case 的 `events` 数组。block 类型有 `post`、`chat`、`system`。 | 文件（`data/script.json`、`script-manager.html`） |
| `@action` | 剧本里的指令，表示「执行到这里时结算这个 Action 的数值和时段」。移动它就能改变结算时机。 | 文件（`README.md`） |
| 小粉书 | 游戏里模拟小红书的社区 App，有信息流、帖子、评论、点赞。commit 信息中写作「小红书帖子」，指的是同一类内容。 | 文件（`index.html`、git log） |
| 帖子（note / post） | 小粉书上的帖子。代码里叫 `NOTES`（`n1`…），剧本里是 `post:*` block。`n5` 是第三天指控方的新鉴定帖。 | 文件（`index.html`、`README.md`） |
| 评论 / 楼中楼 | 帖子下的评论；`reply_to` 指向上一层评论即为楼中楼。 | 文件（`script-manager.html`） |
| 咪画师（MHS） | 模拟约稿平台的 App，客户（小葵、布丁、青柠）在这里发消息，可回复取证。 | 文件（`README.md`） |
| MiChat（wx） | 模拟微信的聊天 App，与画师和 Chloe 聊天、转账、提出视频或对赌请求。 | 文件（`index.html`） |
| 证据（evidence） | 可收集的材料：`e1` 约稿前的草稿、`e2` 约稿时间线截图、`e3` 分层源文件、`e4` 未剪辑的绘画录屏、`e5` 客户布丁的两次约稿过程记录、`e6` 客户青柠的订单核对记录，以及对赌公告 `livestream-announcement`。 | 文件（`index.html` 的 `EVIDENCE`） |
| 收藏 | 点帖子底部星星把材料放进证据清单，不消耗时段。 | 文件（`EVIDENCE_COLLECTION.md`） |
| 回应判定 | 给某条评论或直播弹幕设置「哪些证据与它相关」（`relevant_evidence`），决定出示证据时舆论加还是减。 | 文件（`README.md`） |
| 直播对赌 | 玩家在画师聊天中发起，第 5 天直播，依次回应三条弹幕，之后社区投票。需要余额资格（画师 1 至少 ¥50，画师 2 至少 ¥80）。 | 文件（`README.md`、`LIVESTREAM_RULES_SOURCE.md`） |
| 弹幕 / stance | 直播中的观众评论；`stance` 为 `support`、`accuse` 或 `neutral`，决定「同意」的结果。 | 文件（`README.md`） |
| 结局 | 7 个，由投票时的舆论和压力决定，见「核心规格」。 | 文件（`data/script.json`） |
| 新手导览（tour） | 开局 Chloe 聊天后的浮窗引导，练习不改变任何数值。 | 文件（`README.md`） |
| 发布包（game） | `data/script.json` 里的 `game` 字段：管理器编译后给游戏读取的版本。 | 文件（`data/script.json`） |
| `GAME_FALLBACK` | `index.html` 里内嵌的一份发布包，在本地直接打开文件或读取失败时使用。 | 文件（`index.html` 第 426 行） |
| 剧本管理器 | `script-manager.html`，编辑并发布 `data/script.json` 的网页工具。 | 文件（`README.md`） |

---

## c. 核心规格

### 文件结构与游戏对接

- 游戏是 `index.html` 一个文件。`<style>` 在第 11–277 行，`<script>` 在第 283–1611 行。顶部是可调常量（`SMALL`、`MEDIUM`、`LARGE`、`SUPPORT_REPLY`、`COMMISSION`、`RESULT_HOLD_MS` 等）和 `CHARACTERS`（两个 Case 的开局数值）。来源：文件（`index.html`）。
- 读取剧本（`bootGame()`）：
  - 通过 http(s) 打开时，`fetch('./data/script.json', {cache:'no-store'})`，12 秒超时；要求 `game.version === 1` 且有 `cases`、`stats`、`actions` 数组。失败时显示「剧本未能载入」，可重试或「使用随页面保存的版本」。
  - 通过 `file:` 打开时，直接用内嵌的 `GAME_FALLBACK`。
  - 正在进行的一局保持开局时的版本，新开一局才读最新 JSON。
  - 来源：文件（`index.html`、`README.md`）。
- 管理器提交 `data/script.json` 时不会同时更新 `index.html` 里的 `GAME_FALLBACK`（例如 `b08dbc7` 只改了 JSON）。所以本地直接打开的版本可能落后于线上。来源：命令结果（`git log --stat`）、AI 推断。
- 测试从 `index.html` 抽出第一个 `<script>`，放进 `node:vm` 上下文执行，用假的 `document` 和计时器。来源：文件（`tests/chat-flows.test.cjs`）。

### `data/script.json` 数据格式

- 顶层：`version`（当前 3）、`updatedAt`（UTC 时间）、`stats`（3 个数值定义）、`actions`（33 个共用 Action）、`cases`（2 个 Case 的可编辑源）、`game`（编译后的发布包）。
- 每个 Action 的字段：`id`、`key`、`name`、`description`、`category`、`dayStart`、`dayEnd`、`timeCost`、`timeSlots`、`kind`、`conditions`、`effects`（`[{statId, delta}]`）、`status`、`notes`、`requirement`、`updatedAt`。
- 每个 Case 的字段：`id`、`name`、`artist`、`description`、`initialValues`、`preferences`、`days`、`roles`、`events` 及若干 revision 字段。`events` 里每个 block 存原文 `source` 和编译结果 `compiled`。
- `game` 的字段：`version`、`timingVersion`、`responseRulesVersion`、`counterReplyVersion`（目前都是 1）、`updatedAt`、`stats`、`actions`、`cases`（每个含 `roles`、`initialValues`、`preferences`、`commentMetadata`、`posts`、`events`）。
- 来源：命令结果（2026-11-18 用 node 读取 `data/script.json`）。之前没有单独的格式文档。

### 剧本文本语法

完整说明在 `script-manager.html` 的内置帮助里，`README.md` 也有补充。要点如下（来源：文件（`script-manager.html`、`README.md`））：

- block 头部：
  ```
  === block ID
  case: case_artist_1
  type: post | chat | system
  title: "标题"
  day: 1
  through: 5        # 可用范围的最后一天；不写则只属于起始 Day
  slot: any | morning | afternoon | evening | live
  status: draft | review | final
  when: 条件
  trigger: "原游戏触发流程的说明（不会被执行）"
  ```
- 台词：`说话者:` 换行后缩进 2 格写正文。说话者用角色管理中的名称、英文 key 或别名。
- 选项：`* [选项文字]`，选项内的语句缩进 2 格，台词再缩进 2 格。
- 指令：`@action: key`、`@effect: stat_key +2`、`@unlock_evidence: ID`、`@show_post: ID`、`@show_comment: ID`、`-> 事件ID` 或 `-> END`。旧指令 `@line_id`、`@choice_id`、`@emotion`、`@notes`、`@result`、`@legacy_when` 仍可用。
- 条件：数值 key 与数字比较、`day`、`slot == "morning"`、`true` / `false`、`evidence("ID")`、`!`、`&&`、`||`、括号。不执行 JavaScript。
- 帖子 block：头部加 `author`、`likes`，`body:` 下写正文；评论写成 `[comment 评论ID]`，字段有 `author`、`reply_to`（空为顶层）、`day`、`likes`、`status`、`text`。可选 `relevant_evidence: e1, e3`（`none` 表示全部无关；删除整行表示不判定）。
- 直播 block：头部可写 `stance` 和 `relevant_evidence`。
- 结算时机：`@action` 前的消息先逐条显示，执行到该行时结算数值和时段，转场后再显示后面的内容。不要复制 `@action`，否则执行两次。
- 自建的新 block 不会自动出现在游戏里，需要另外接入游戏流程。

### 主要数值（当前 `data/script.json`）

- 时段消耗为 1：回复支持评论（舆论 +2）、陪伴画师（压力 −5）、附证据反驳（舆论 +10）、无证据反驳（−5）、无关证据反驳（−5）、公开回应（+5 / −5）、转发帖子（压力 −5 / +5 / 0）、外卖（奶茶 −¥20 压力 −5，汤面 −¥35 压力 −10，蛋糕 −¥60 压力 −15）、确认对赌（压力 +20；画师 2 的偏好「害怕镜头」再加 +10，共 +30）、休息。
- 时段消耗为 2：确认制作过程视频（舆论 +10）。
- 时段消耗为 0：收藏证据、回复咪画师、直播同意（+5）、同意质疑弹幕（−5）、直播附证据（+20）、直播无证据（−10）、直播无关证据（−10）、开播、点赞 / 点踩、第三天事件（舆论 −20、压力 +10）。
- 开局：画师 1 压力 35、舆论 55；画师 2 压力 75、舆论 30；委托费 ¥100（来源：文件（`index.html` 的 `CHARACTERS`、`COMMISSION`））。
- 结局（按投票时数值）：01 舆论 > 50 且压力 ≥ 50；02 舆论 > 50 且压力 < 50；03 舆论 = 50；04 舆论 < 50 且压力 ≥ 50；05 舆论 < 50 且压力 < 50；06 压力 ≥ 100（画师退出）；07 舆论 ≤ 0 且压力 < 100（信任崩塌）。
- 来源：命令结果（读取 `data/script.json`）。

### 剧本管理器与发布

- 浏览器 `localStorage` 键：`picasso.scriptManager.data.v1`（剧本数据）、`picasso.scriptManager.github.v1`（GitHub 设置，含 token）、`picasso.scriptManager.sync.v1`、`picasso.scriptManager.activeCase.v2`、`picasso.scriptManager.backup.v1`、`picasso.scriptManager.backup.v2`、`picasso.scriptManager.beforeBlocks.v3`。来源：文件（`script-manager.html`）。
- 默认发布目标：owner `xinruilu24-art`、repo `cct405-prototype`、branch `main`、path `data/script.json`。
- 需要的密钥：只有一个 GitHub Personal Access Token，在管理器「GitHub 设置」里填写，只保存在当前浏览器的 `localStorage`，不进入备份或提交文件。优先用只授权本仓库、Contents → Read and write 的 fine-grained token；读取公开仓库的剧本不需要 token。不要把 token 写进任何仓库文件。来源：文件（`README.md`）。

### 视觉规范

- 颜色全部用 `index.html` `:root` 中的变量：`--desk`、`--win`、`--title`、`--ink`、`--line`、`--muted`、`--accent`、`--accent-ink`、`--po`、`--stress`、`--soft`、`--xhs-red`、`--mhs`、`--wx-green`、`--px-*` 像素色、`--tile-*` App 图标底色、`--fog` 等。
- 字体：`--font-ui`（Noto Sans SC 等）、`--font-head`（ZCOOL QingKe HuangYou）。

---

## d. 已确认的决定

| # | 内容 | 原因 | 日期 | 来源 | 状态 |
| --- | --- | --- | --- | --- | --- |
| D1 | git 作者用 `abbyabbyZzz` 和该账号的 GitHub noreply 邮箱；不把作者设成 Codex，提交信息里不加 `Co-Authored-By` 或任何 AI 署名。 | 贡献记录要归到用户本人账号。 | 2026-11-17 | 对话（2026-11-17） | 已确认 |
| D2 | 提交信息用一句中文写清改了什么。 | 便于协作者看懂。 | 2026-11-17 | 对话（2026-11-17） | 已确认 |
| D3 | 提交前运行 `git pull --rebase origin main`，有冲突停下报告；推送到 `main`，不用 `--force`。 | 两人同时向 `main` 提交；仓库在 2026-11-17 改写过一次历史，不能再覆盖远程。 | 2026-11-17 | 对话（2026-11-17） | 已确认 |
| D4 | 开始工作前 `git fetch origin` 和 `git status`；本地与 `origin/main` 历史对不上时停下报告，不自己合并、不强推。 | 同 D3。 | 2026-11-17 | 对话（2026-11-17） | 已确认 |
| D5 | 游戏只在根目录 `index.html` 一个文件里改（HTML、CSS、JS、base64 图片），不拆文件，不引入构建工具或框架。 | 保持单文件原型、可直接打开。 | 2026-11-17 | 对话（2026-11-17） | 对游戏本体 `index.html` 已确认；对 `script-manager.html`、`data/script.json` 的适用范围待确认，见 Q2。 |
| D6 | 粉紫色像素风；新界面沿用 `:root` 颜色变量和已有组件写法，不直接写新颜色值。 | 保持统一风格。 | 2026-11-17 | 对话（2026-11-17） | 已确认（同一条里「画面是中文的」部分见 X3，已失效） |
| D7 | 只改要求的内容，其他玩法、数值、文字保持原样；需求不清楚时先问，不自己发挥。 | 避免改动定稿内容。 | 2026-11-17 | 对话（2026-11-17） | 已确认 |
| D8 | 改完后用浏览器从开始页一路点到结局，确认没有报错、没有点不动的按钮，再提交。 | 原型没有完整的端到端测试。 | 2026-11-17 | 对话（2026-11-17） | 已确认 |
| D9 | 截图取证功能删除，改为点星星收藏；收藏不消耗时段。 | 简化取证。 | 2026-11-17 | 文件（`EVIDENCE_COLLECTION.md`）；截图删除于 commit `1c13f13`，收藏免费于 commit `bf7e3c2` | 已确认（文件记载；是谁确认的未写明） |
| D10 | 正式发布的《第 5 天直播对赌公告与规则》可以收藏为证据；发布前没有可单独收藏的公告。 | 用户指定。 | 2026-11-17 | 文件（`LIVESTREAM_RULES_SOURCE.md`：「用户已指定这条实际发布的帖子可以收藏」） | 已确认 |
| D11 | 对赌只检查余额资格（画师 1 ≥ ¥50，画师 2 ≥ ¥80），不收押金、不按胜负转账；原案 48 小时讨论期、投票门槛等不写进原型。 | 这些机制尚未实现。 | 2026-11-17 | 文件（`LIVESTREAM_RULES_SOURCE.md`） | 已确认 |
| D12 | 朋友角色阿紫改名为 Chloe；游戏改名 Prove It, Picasso!；客户阿青改名为青柠。 | — | 2026-11-17 | commit `91a08bd`、`90c9796`、`65eec1d` | 已确认 |
| D13 | 所有玩家行动按剧本里 `@action` 的位置结算数值和时段；免费操作保持 0 时段。 | 让作者在剧本里控制节奏。 | 2026-11-18 | 文件（`README.md`）、commit `9734bbb` | 已完成待验收 |
| D14 | 证据相关性逐条设置：普通评论相关 +10、无关 −5、无证据 −5；直播相关 +20、无关 −10、无证据 −10；同意支持弹幕 +5、同意质疑 −5；不在游戏里显示具体分值。 | 区分「出示了证据」和「出示了对的证据」。 | 2026-11-18 | 文件（`README.md`）、commit `f0876a4` | 已完成待验收 |
| D15 | 出示错误证据时，原评论者在玩家回复下追加「这完全是 bs。」，不再额外扣时段或舆论。 | — | 2026-11-18 | 文件（`README.md`）、commit `a392fe3` | 已完成待验收 |
| D16 | 画师 1 的名字改为 Iris。 | — | 2026-11-18 | 文件（`data/script.json`）、commit `1f05e4c` | 已完成待验收 |
| D17 | 最终游戏交付是英文。只改交付给玩家看到的内容（台词、帖子、评论、按钮、提示、结局等）；内部内容（代码、注释、剧本管理器界面、说话者 key、内部文档）可以先保持中文。 | 最终交付对象需要英文版本。 | 2026-11-19 | 用户确认（2026-11-19） | 已确认；翻译本身进行中（只完成画师 1 的部分 Day 1） |
| D18 | 「已定稿剧本」以 `data/script.json` 中 `status: final` 的 block 为准，改动前要先问用户。 | 需要一个明确、可查的标准。 | 2026-11-19 | 用户确认（2026-11-19） | 已确认 |
| D19 | 剧本以用户在剧本管理器（`script-manager.html`）里更新并发布的版本为准，即 `data/script.json`。`index.html` 里内嵌的 `GAME_FALLBACK` 只是备用副本。 | 用户只在管理器里维护剧本。 | 2026-11-19 | 用户确认（2026-11-19） | 已确认 |
| D20 | 画师 2 先不管：不翻译、不改剧本、不定名字。 | 先集中做画师 1。 | 2026-11-19 | 用户确认（2026-11-19） | 已确认 |
| D21 | 用户原话：「剧本管理器上做的修改都直接覆盖到 index 上」。即剧本管理器发布的内容优先于 `index.html` 里已有的剧本内容，游戏显示的以管理器为准。 | 与 D19 一致。 | 2026-11-19 | 用户确认（2026-11-19）；「是否要求管理器同时改写 `index.html` 文件本身」是 AI 未能确定的部分，见 Q13 | 已确认 |
| D22 | 画师 1 不需要「约稿时间线」帖子（`n3`），不恢复。 | 用户决定。 | 2026-11-19 | 用户确认（2026-11-19） | 已确认 |
| D23 | 第三天的新鉴定帖 `n5` 在手机的小粉书信息流里排在最顶部（在玩家自己发的帖子之上）。 | 让玩家第一眼看到新指控。 | 2026-11-19 | 用户确认（2026-11-19） | 已完成待验收：`index.html` 的 `availableNotes()` 已改，线上页面替换该函数实测通过，2026-11-19 已推送到 `main` |
| D24 | 最终交付给玩家的是线上链接 https://xinruilu24-art.github.io/cct405-prototype/ ，不是 `index.html` 文件。内嵌的 `GAME_FALLBACK` 不需要为交付而同步。 | 链接会读取剧本管理器发布的最新剧本。 | 2026-11-19 | 用户确认（2026-11-19） | 已确认 |

已失效的决定：

| # | 内容 | 日期 | 来源 | 状态 |
| --- | --- | --- | --- | --- |
| X1 | 用截图功能收集证据（「allowlisted screenshot evidence capture」）。 | 2026-11-17 | commit `8f65879` | 已失效，被 D9 取代 |
| X2 | 开局在「Azi（阿紫）」聊天中打开新游戏。 | 2026-11-17 | commit `2f43881` | 已失效，被 D12（改名 Chloe）取代 |
| X3 | 「画面是中文的」（原属 D6）。 | 2026-11-17 | 对话（2026-11-17） | 已失效，被 D17（交付给玩家的内容为英文）取代 |

---

## e. 功能和验收状态表

用户还没有对任何功能做过正式验收，所以没有「已验收」项。

「线上实测」指 2026-11-19 在 https://xinruilu24-art.github.io/cct405-prototype/ 用画师 1 实际跑过该流程，结果符合 `README.md`，控制台无报错。测试失败的原因见「项目快照 · 已知的阻塞与问题」。

| 功能 | 状态 | 相关文件 | 备注 |
| --- | --- | --- | --- |
| 开始页与选择 Case | 已完成待验收 | `index.html` | 2026-11-18 线上打开正常，无控制台报错 |
| 五天三时段流程与转场 | 已完成待验收 | `index.html` | 线上实测 |
| 开场 Chloe 聊天与新手导览 | 已完成待验收 | `index.html`、`data/script.json` | 本轮没有实测；测试失败因开场改为 4 条消息 |
| 小粉书帖子、评论回复、点赞 | 已完成待验收 | `index.html`、`data/script.json` | 画师 1 不再有约稿时间线帖 `n3`（D22） |
| 证据收藏与证据清单 | 已完成待验收 | `index.html`、`EVIDENCE_COLLECTION.md` | |
| 咪画师客户消息与取证（e2、e5、e6） | 已完成待验收 | `index.html`、`data/script.json` | 线上实测 |
| 画师聊天：陪伴、转发、外卖 | 已完成待验收 | `index.html`、`data/script.json` | 线上实测 |
| 过程视频（2 时段） | 已完成待验收 | `index.html`、`data/script.json` | 线上实测（确认和拒绝） |
| 直播对赌与公告 | 已完成待验收 | `index.html`、`LIVESTREAM_RULES_SOURCE.md` | 线上实测（两个 Case 的压力变化） |
| 第三天新鉴定帖事件（n5） | 已完成待验收 | `index.html` | 线上实测；`n5` 置顶已改（D23），已推送 |
| 第 5 天直播三轮弹幕与投票 | 已完成待验收 | `index.html`、`data/script.json` | 线上实测，一路「同意」到结局 03 |
| 7 个结局 | 已完成待验收 | `data/script.json` | 只实测到结局 03 |
| 证据相关性判定与楼中楼回复 | 已完成待验收 | `index.html`、`script-manager.html`、`data/script.json` | 2026-11-18 晚上新增 |
| 剧本管理器：编辑、编译、角色管理、GitHub 发布 | 已完成待验收 | `script-manager.html` | 没有自动化测试 |
| 游戏读取 `data/script.json` | 已完成待验收 | `index.html`、`data/script.json` | 线上 JSON 的 `updatedAt` 与 `main` 一致（命令结果） |
| 玩家可见内容英文化（D17） | 进行中 | `data/script.json`、`index.html` | 画师 1 只改到部分 Day 1；界面文字和 `n5` 仍是中文 |
| 画师 2 | 待确认 | `data/script.json` | 暂缓（D20） |
| 自动化测试全部通过 | 进行中 | `tests/` | 当前 11 / 29 通过，失败的主要是测试过时 |

---

## f. 踩过的坑

| 现象 | 原因 | 解决方法 | 以后怎么避免 |
| --- | --- | --- | --- |
| Windows 上 `git clone` 报 `Filename too long`，克隆失败。 | 工作目录路径很深，加上 `.git/objects/pack/` 下的长文件名超过 Windows 路径限制。 | `git -c core.longpaths=true clone https://github.com/xinruilu24-art/cct405-prototype.git`，克隆后 `git config core.longpaths true`。 | 在较短的路径下克隆，或始终带 `core.longpaths`。（命令结果，2026-11-18） |
| GitHub 仓库页「Contributors」仍显示 Codex，但所有 commit 的作者、提交者和提交信息里都没有 Codex。 | 2026-11-17 改写历史后，GitHub 的贡献者统计是旧缓存（贡献者接口仍显示旧历史的提交数）。 | 无需改仓库；等 GitHub 重新计算，或联系 GitHub Support 刷新。 | 一开始就按 D1 设置作者，不让 AI 署名进入提交。（命令结果，2026-11-17） |
| 测试大量失败，且每个测试都报 `location is not defined`。 | `location` 报错只是测试环境缺少浏览器自带的网页地址对象，不影响结果；失败本身是因为剧本数据化后，测试里写死的文案、调用方式和数值规则过时了。 | 尚未修改，见「下一个任务」第 3 项。 | 改剧本或流程时同时跑测试；改文案时检查测试里是否写死了该文案；判断游戏是否真坏时，以线上实测为准。（命令结果，2026-11-18、2026-11-19） |
| 用剧本管理器「同步备份」后，帖子悄悄少了一条。 | commit `245b2a1` 同步后，画师 1 的约稿时间线帖 `n3` 不见了。 | 用户确认不需要这条帖子（D22），这次不算问题。 | 发布前对比发布列表里的帖子数量；发布后在线上看一眼小粉书。（命令结果，2026-11-19） |
| 剧本管理器里只看到旧稿、帖子为 0 或内容不完整。 | 浏览器里旧的本机剧本遮住了线上内容。 | commit `fd51d7e` 修复；手动处理：刷新管理器，点「载入已发布剧本」，再选「导出本机备份并载入」。 | 换设备或久未打开时，先载入已发布剧本。（文件（`README.md`）） |
| 本地双击 `index.html` 看不到最新剧本。 | `file:` 方式使用内嵌的 `GAME_FALLBACK`，管理器发布时只更新 `data/script.json`。 | 用网页版或本地 http 服务器打开。 | 验证剧本改动时用网页版。（文件（`README.md`）、AI 推断） |
| 移动 `@action` 时复制了一份，行动执行两次。 | 每条 `@action` 都会结算。 | 移动原有指令，不复制。 | 改完在预览里检查同一 block 内 `@action` 数量。（文件（`README.md`）） |
| 日期看错一天。 | `data/script.json` 的 `updatedAt` 是 UTC（例如 `2026-11-19T04:33:45Z`），对应本地 2026-11-18 晚上（commit 时间 23:38）。 | 以 commit 本地时间为准。 | 写历史时用 `git log --date=short`。（命令结果） |
| 本机全局 git 邮箱不是 GitHub noreply 地址。 | 全局配置与项目要求不同。 | 在仓库内设置 `git config user.email` 为 noreply 地址。 | 提交前运行 `git config user.email` 核对。（命令结果，2026-11-18） |

---

## g. 待确认问题

| # | 问题 | 背景 | 可选方案 | 需要谁来决定 |
| --- | --- | --- | --- | --- |
已解决（保留记录）：Q1 → D17；Q3 → 失败的主要是测试过时（见项目快照）；Q4 → 游戏需要 `location`，不用改，测试里补上即可（随「下一个任务」第 3 项处理）；Q6 → D18；Q7 → D19；Q9 → D20；Q5 → 等用户改完剧本再定（见「下一个任务」）；Q10 → D22；Q11 → D23；Q12 → D24。

| # | 问题 | 背景 | 可选方案 | 需要谁来决定 |
| --- | --- | --- | --- | --- |
| Q2 | 「只在 `index.html` 一个文件里改、不拆成多个文件、不引入构建工具或框架」这条规则，现在还适用吗？范围是什么？ | 2026-11-17 定下这条规则时，仓库只有 `index.html`。之后仓库新增了 `script-manager.html`（剧本管理器）和 `data/script.json`（剧本数据），游戏改为在线读取 `data/script.json`。 | A. 规则只管游戏本体：游戏代码仍只写在 `index.html` 里，管理器和剧本数据是允许的例外；B. 规则作废；C. 其他。 | 用户 |
| Q8 | 测试需要的最低 Node 版本，以及 GitHub Pages 的实际设置（分支、目录）。 | 本机用 Node v24.16.0；Pages 设置需要仓库权限才能查看。 | 由有权限的人查看后写入本文。 | xinruilu24-art（仓库所有者） |
| Q13 | 「剧本管理器上的修改直接覆盖到 index 上」是否要求管理器在发布时，同时把 `index.html` 里内嵌的备用剧本也改写成最新？ | 现在管理器只提交 `data/script.json`；线上链接已经显示管理器发布的内容，内嵌副本只在双击本地文件时使用。交付是链接（D24），所以不改也不影响玩家。 | A. 不需要，链接已满足；B. 需要，让管理器发布时同时更新 `index.html`。 | 用户 |

---

## h. 下一步边界

- 近期要做：
  - 用户验收第三天新帖置顶（D23）和三份文档。
  - 等用户在剧本管理器里改完剧本，再从「下一个任务」的候选中选（用户确认（2026-11-19））。
  - 回答 Q2、Q13，并把结论写进「已确认的决定」。
- 明确不做：
  - 不拆分 `index.html`，不引入框架、构建工具或包管理器（D5，范围见 Q2）。
  - 不实现原案的押金、按胜负转账、48 小时讨论期、投票资格和票数门槛（D11）。
  - 不恢复截图取证（D9）。
  - 不 force push，不改写远程历史（D3）。
  - 不翻译内部内容：代码、注释、剧本管理器界面、内部文档（D17）。
- 暂缓：
  - 画师 2 的全部工作（D20）。
  - 自建 block 自动生成游戏入口（`README.md`：目前需要另外接入游戏流程）。
  - 剧本管理器的自动化测试（目前没有）。

---

## i. 制作历史（按日期倒序）

时间为 commit 本地时间。

### 2026-11-19

- 用户确认 D17–D20（英文交付、定稿以 `status: final` 为准、剧本以管理器为准、画师 2 暂缓）（用户确认（2026-11-19））。
- 在线上游戏里实测画师 1 的主要流程，确认测试失败主要是测试过时；发现约稿时间线帖缺失和第三天新帖排序两处不一致（命令结果）。
- 用户确认 D21–D24：管理器的修改优先于 `index.html`；不需要约稿时间线帖；第三天新帖置顶；交付线上链接；下一步等剧本改完再定（用户确认（2026-11-19））。
- 修改 `index.html` 的 `availableNotes()`，第三天新帖排在信息流最顶部（D23）。测试结果不变（11 / 29），线上页面替换该函数后实测通过，与三份文档一起推送到 `main`。
- 新增 `AGENTS.md`、`PROJECT_MEMORY.md`、`CLAUDE.md`。

### 2026-11-18

- 23:38 `245b2a1` 同步最新剧本备份中的帖子和证据判定（`data/script.json`、`index.html`）。
- 22:58 `a392fe3` 错误证据触发评论者的楼中楼回复，直播中先展示回复再继续。
- 22:33 `f0876a4` 加入逐条证据相关性判定，调整直播回应的舆论变化。
- 22:07 `9734bbb` 所有玩家行动按剧本指令位置结算数值和时段。测试降到 12 / 29 通过。
- 21:28–21:40 `293df17`、`d4e6c33`、`b08dbc7` 修改画师 1 Day 1 文案；视频按指令位置先扣时段再显示完成消息。
- 17:21–17:33 `a7ad42a`、`ef284b1` 通过管理器修改画师 1 Day 1 的帖子、评论、对话和选项。
- 15:46 `fd51d7e` 修复旧本机剧本遮挡线上内容，读取已发布剧本不再需要 token。
- 15:38 `6ca0363` 按画师分开的角色管理，打通剧本提交与游戏更新。测试降到 25 / 31 通过（当时有 31 个测试）。
- 15:05 `1f05e4c` 同步上传剧本，画师 1 改名，更新四组聊天文案；首次新增 `data/script.json`。测试首次出现失败（28 / 29）。
- 12:25 `03541bd` 帖子评论与聊天分别编译成 block，补齐两位画师五天的现有文案。最后一个测试全部通过的 commit。
- 11:11 `4f385ba` 按画师 Case 管理的文本事件编辑、解析与兼容转换。

### 2026-11-17

- 用户在对话中确认 D1–D8；仓库当天改写过一次历史（对话（2026-11-17））。
- 22:53 `70eaf25` 独立画师剧本 Case 管理，补全共用行动与画师偏好。
- 21:37–21:56 `cfe2cf1`、`ab77ff0`、`1f6b5df` 新增单文件剧本管理器 `script-manager.html`（本地编辑、备份、GitHub 同步），调整编辑窗口。
- 21:12–21:26 `2dcdbfc`、`05bcbb4`（xinruilu24-art）换上玩家头像、放慢时段切换提示；新手导览加雾紫色遮罩。
- `65eec1d`、`f8190c3`、`90c9796`、`91a08bd`（xinruilu24-art）客户阿青改名青柠；全部人物换像素头像；游戏改名 Prove It, Picasso!；阿紫改名 Chloe。
- `0f2b27e` 至 `8943fa3`（abbyabbyZzz，11 个 commit）：时段转场、证据清单、截图取证（后删除）、开场聊天与导览、视频确认、直播资格与公告、行动消耗、客户取证、第三天指控事件。

### 2026-11-16

- `144c6dd`（xinruilu24-art）手机 App 界面、像素图标、余额、状态栏。
- `3549859`（xinruilu24-art）首次提交中文游戏原型。
