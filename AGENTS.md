# AGENTS.md · Prove It, Picasso!

本文件是任何 AI 或新成员开始工作的入口。完整背景、规格、决定和历史见 `PROJECT_MEMORY.md`。
本文写于 2026-11-18，2026-11-19 按用户确认更新，依据是仓库 `main` 分支 commit `245b2a1` 的文件和命令结果。

## 项目简介

- 一句话：CCT405 课程的网页游戏原型。一位画师被指控用 AI 作画，玩家作为她的「案件代理人」，在五天内帮她回应，最后由社区投票决定结局。
- 游戏类型：单人、叙事向的模拟经营 / 选择类游戏，界面模拟一部手机（小粉书、咪画师、MiChat、外卖等 App），粉紫色像素风。
- 核心玩法：每天分早上、下午、晚上三个时段，每个时段做一件事（回复评论、收集证据、陪画师聊天、点外卖、转发帖子、做过程视频、发起直播对赌等）。行动改变「舆论」「画师压力」「余额」三个数值；第 5 天可直播回应弹幕，之后社区投票，按数值进入 7 个结局之一。
- 两个可选 Case：画师 1（当前名为 Iris）和画师 2，开局数值和偏好不同。目前只做画师 1，画师 2 暂缓（用户确认（2026-11-19））。
- 最终交付语言：英文。只翻译交付给玩家看到的内容；代码、剧本管理器界面、内部文档可以保持中文（用户确认（2026-11-19））。
- 线上地址：https://xinruilu24-art.github.io/cct405-prototype/ （游戏），`script-manager.html`（剧本管理器）。最终交付给玩家的就是这个游戏链接，不是 `index.html` 文件（用户确认（2026-11-19））。
- 当前状态：2026-11-19：玩家界面已英文化；导览整合为 10 步。评论演练从当前帖子选择回复按钮，每步可用 Next，最后一步为 Finish。管理器继续使用原有剧本，旧中文文案在游戏显示时翻译。 本轮测试 14/29 通过，导览测试 4/4 通过；需验收实际设备效果。

## 技术栈和版本

- 纯静态网页：HTML + CSS + 原生 JavaScript，没有框架、没有构建工具、没有 `package.json`、没有依赖要安装。
- 图片以 base64 内嵌在 `index.html` 里。
- 剧本数据：`data/script.json`（文件内 `version: 3`，游戏发布包 `game.version: 1`）。
- 测试：Node.js 内置的 `node:test`，用 `node:vm` 载入 `index.html` 里的脚本。本机验证用的是 Node v24.16.0，最低版本「待确认」。
- 部署：GitHub Pages，提供 `main` 分支根目录（AI 推断：线上的 `data/script.json` 与 `main` 最新提交一致；Pages 设置本身没有看过）。

## 目录地图

| 路径 | 用途 |
| --- | --- |
| `index.html` | 游戏本体，HTML、CSS、JS、图片和一份内嵌的剧本备用版本（`GAME_FALLBACK`）都在里面。 |
| `script-manager.html` | 单文件剧本管理器：按 Case 编辑帖子、评论、聊天和 Action，编译后通过 GitHub API 提交 `data/script.json`。 |
| `data/script.json` | 已发布的剧本数据，网页版游戏每次新开时读取它。 |
| `tests/` | 5 个 `*.test.cjs` 测试文件，覆盖聊天节奏、第三天事件、证据收藏、咪画师消息、新手导览。 |
| `README.md` | 玩法和剧本管理器的使用说明（中文，最详细的现有文档）。 |
| `EVIDENCE_COLLECTION.md` | 证据收藏规则。 |
| `LIVESTREAM_RULES_SOURCE.md` | 直播对赌公告的参考来源和改编说明。 |
| `PROJECT_MEMORY.md` | 完整项目记忆：现状、术语、规格、决定、坑、待确认问题、历史。 |
| `CLAUDE.md` | 只有一行 `@AGENTS.md`，让 Claude 读到同一套规则。 |

## 开始工作时的阅读顺序

1. 本文件。
2. `PROJECT_MEMORY.md` 的「项目快照」和「待确认问题」。
3. `README.md`（玩法和剧本管理器怎么用）。
4. 要动哪部分，再读对应的代码：游戏逻辑在 `index.html` 第 283 行起的 `<script>`；剧本语法看 `PROJECT_MEMORY.md` 的「核心规格」。
5. 运行 `git fetch origin` 和 `git status`，确认本地与 `origin/main` 一致后再动手。

## 常用命令

| 用途 | 命令 | 状态 |
| --- | --- | --- |
| 获取代码 | `git clone https://github.com/xinruilu24-art/cct405-prototype.git` | 已验证（2026-11-18）。Windows 路径过长时会失败，改用 `git -c core.longpaths=true clone https://github.com/xinruilu24-art/cct405-prototype.git`。 |
| 同步检查 | `git fetch origin` 然后 `git status` | 已验证（2026-11-18） |
| 安装 | 无需安装，没有依赖。只需浏览器；跑测试需要 Node.js。 | 已验证（仓库内没有依赖声明文件） |
| 在线试玩 | 浏览器打开 https://xinruilu24-art.github.io/cct405-prototype/ | 已验证（2026-11-18：开始页正常显示，控制台无报错） |
| 本地试玩（内嵌版剧本） | 用浏览器直接打开 `index.html` | 未验证：本轮工具无法打开本地文件。注意此方式不读 `data/script.json`。 |
| 本地试玩（读 `data/script.json`） | 在仓库根目录运行 `python -m http.server 8000`，再打开 http://localhost:8000/ | 未验证：本轮没有启动服务器。本机有 Python 3.11 / 3.12。 |
| 构建 | 无构建步骤。 | 已验证（没有构建配置） |
| 测试 | `node --test tests/*.test.cjs` | 已验证可运行（2026-11-18、2026-11-19）：29 个测试，11 通过，18 失败。失败的主要是测试过时，不是游戏坏了，详见 `PROJECT_MEMORY.md`「已知的阻塞」。 |
| 部署 | 推送到 `main`，GitHub Pages 自动发布。 | 未验证：会改动远程仓库；Pages 设置未查看。 |
| 发布剧本 | 在 `script-manager.html` 里点「提交并发布」 | 未验证：会直接向 `main` 提交 `data/script.json`。 |

## 执行和授权边界

可以直接做：
- 阅读任何文件，运行只读命令和 `node --test tests/*.test.cjs`。
- 在当前任务明确要求的范围内修改 `index.html`、`script-manager.html`、测试和文档。
- 在本地浏览器里试玩、检查控制台。

必须先问用户（abbyabbyZzz）：
- 删除或重命名任何文件；新增文件（除非任务就是要新增它）。
- 修改数据格式：`data/script.json` 的结构、字段名、`version`，剧本文本语法，或 `localStorage` 键名。
- 修改部署相关内容：GitHub Pages 设置、`data/script.json` 的路径、管理器里默认的 owner / repo / branch / path。
- 提交（commit）和推送到 `main`：只有任务里明确要求时才做；用户说「先不要 commit」时一律不提交。
- 修改已定稿的剧本：以 `data/script.json` 中 `status: final` 的 block 为准（用户确认（2026-11-19）），以及游戏里对应的文案、数值。
- 改动需求之外的玩法、数值和文字；需求不清楚的地方。
- 在 `main` 上 rebase 冲突、或本地与 `origin/main` 历史对不上时：停下来报告，不要自己合并。

绝对不做：
- `git push --force` 或任何改写远程历史的操作。
- 把 token、密码、个人邮箱写进仓库或提交信息。
- 把 git 作者设成 AI（例如 Codex），或在提交信息里加 `Co-Authored-By` 等 AI 署名。

## 修改规范

- 单文件：游戏只在 `index.html` 里改，不拆分文件，不引入构建工具或框架（`script-manager.html` 同样是单文件）。这条规则对 `script-manager.html` 和 `data/script.json` 的适用范围还待确认（`PROJECT_MEMORY.md` Q2）。
- 视觉：沿用 `index.html` 中 `:root` 里的颜色变量（`--accent`、`--ink`、`--px-p` 等）和已有组件写法，不直接写新的颜色值。
- 语言：最终交付给玩家的内容是英文（剧本台词、帖子、评论、按钮、提示、结局等玩家能看到的文字）。内部内容（变量名、注释、剧本管理器界面、剧本里的说话者 key 如 `玩家`、`系统`、内部文档）可以保持中文。翻译属于单独的任务，没被要求时不要顺手翻译（用户确认（2026-11-19））。
- 剧本的权威来源：用户在剧本管理器里发布的 `data/script.json`；管理器的修改优先于 `index.html` 里已有的剧本内容。`index.html` 里内嵌的 `GAME_FALLBACK` 只是备用副本，不是权威来源，不要以它为准去改剧本（用户确认（2026-11-19））。
- 画师 2：暂缓，不主动修改它的剧本（用户确认（2026-11-19））。
- 只改要求的内容，其他玩法、数值、文字保持原样。
- 数值：Action 的时段消耗和效果写在 `data/script.json` 的共用 `actions` 和各 Case 的 `preferences` 中，在管理器里编辑；不要在游戏代码里另写一份。
- 剧本：按 `PROJECT_MEMORY.md`「核心规格」的语法写；移动 `@action` 位置来调整结算时机，不要复制指令（会执行两次）。
- 命名：剧本 block ID 沿用 `chat.*`、`post:*`、`system.*`、`action.*` 前缀；证据 ID 为 `e1`–`e6` 和 `livestream-announcement`。
- Commit 信息：一句中文，写清改了什么（例如 `为错误证据增加评论楼中楼回复并在直播中先展示后继续`）。管理器自动生成的形如 `修改 画师 1 Day 1 对话 ×2、…` 的信息保持原样。
- Git 作者：`user.name` 为 `abbyabbyZzz`，`user.email` 为该账号的 GitHub noreply 邮箱（格式 `数字ID+用户名@users.noreply.github.com`，可用 `git log --author=abbyabbyZzz -1 --format=%ae` 查到）。本机全局 `user.email` 不是 noreply 地址，提交前在仓库内用 `git config user.email` 核对。

## 完成标准

一个任务算完成，需要同时满足：
1. 只改了任务要求的文件和内容，用 `git diff --stat` 自查。
2. `node --test tests/*.test.cjs` 的结果不比改动前更差；改动涉及的功能有对应测试时，那些测试要通过。
3. 用浏览器打开游戏，从开始页一路点到结局，控制台没有报错，没有点不动的按钮。
4. 如果改了剧本或数据，在网页版（读 `data/script.json`）和本地打开（内嵌版）都看一遍，或说明只验证了哪一种。
5. 需要提交时：先 `git pull --rebase origin main`，有冲突就停下报告；再用一句中文提交，普通推送到 `main`。
6. 向用户汇报：改了哪些地方、怎么测试的、哪些没做完或没验证。用户验收前，状态只能写「已完成待验收」。

## 何时、怎么更新 PROJECT_MEMORY.md

- 什么时候更新：完成或中止一个任务后；用户确认了新决定；发现新的坑；测试结果、阶段或下一步发生变化。
- 怎么更新：
  - 先改「项目快照」（当前阶段、阻塞、下一个任务）。
  - 新决定加进「已确认的决定」，写明内容、原因、日期、来源、状态；被取代的旧决定保留，标「已失效」并写明被哪条取代。
  - 功能状态表只按事实改；用户没验收的不写「已验收」。
  - 在「制作历史」顶部加一条，附 commit 哈希或文件。
  - 日期写 YYYY-MM-DD；只用文中统一的来源和状态标签；不写 token 等敏感信息。
- `PROJECT_MEMORY.md` 和本文件的修改跟随该任务一起提交，除非用户另有要求。
