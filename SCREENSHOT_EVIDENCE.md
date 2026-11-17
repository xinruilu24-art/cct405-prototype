# 限定截图取证

玩家只能在指定内容旁点击「截图取证」。截图保存为当前游戏内的 PNG 证据，进入证据清单，可用于评论回复与直播反驳。保存不消耗时段；出示证据沿用原来的反驳规则。重新开局会清空证据。

`index.html` 中的 `SCREENSHOT_ALLOWLIST` 是唯一的可截图名单。目前三组名单均为空，等待确认具体内容；不会默认开放任何内容。

配置格式示例（以下只是格式说明，不代表这些内容已获准作为证据）：

```js
const SCREENSHOT_ALLOWLIST = {
  posts: ["n4"],
  comments: ["c2"],
  chats: ["artist:forward-reply:n2", "mhs:m2:0"]
};
```

名单中的内容必须已经出现在玩家当前查看的帖子或聊天中才可保存。点屏幕尚未展开的聊天也不能提前保存。不能通过保存函数提前获得未出现的聊天、其他页面的评论或未指定的内容。每项内容只能保存一次。

## 内容 ID

| 类型 | ID 格式 | 说明 |
| --- | --- | --- |
| 小粉书帖子 | `n1`–`n4` | `NOTES` 中的帖子 ID；玩家自己发布的帖子不开放截图 |
| 小粉书评论 | `c1`–`c6` | `NOTES` 内的评论 ID |
| 咪画师聊天 | `mhs:m2:0` | `mhs:会话ID:消息序号`；消息序号从 0 开始，仍受会话出现天数限制 |
| MiChat 开场消息 | `artist:greeting`、`friend:greeting` | 画师、阿紫的开场消息 |
| MiChat 转发回复 | `artist:forward-reply:n2` | 画师对指定帖子的回复；`n2` 可替换为相应帖子 ID |
| MiChat 转发卡片 | `artist:forward:n2` | 代理人转发的帖子卡片 |
| MiChat 每日问候 | `artist:morning:2`、`friend:morning:2` | 第 2 天的问候；角色、舆论和压力可能影响实际文案 |
| MiChat 聊天问答 | `artist:check-in-reply:1:1` | 第 1 天下午的画师回复；最后两项是天数和时段索引（早上 0、下午 1、晚上 2） |
| MiChat 玩家提问 | `artist:check-in:1:1` | 同一时点代理人发出的提问 |
| MiChat 画师附件 | `artist:file:e3` | 收到的指定附件 |
| MiChat 外卖回复 | `artist:order:f1` | 指定外卖的感谢消息；同种外卖只保留一份截图 |
| MiChat 委托费 | `artist:commission` | 开局转账记录 |

截图保留被选内容的原文、作者、来源上下文和保存时点。帖子截图也保留帖图；聊天截图针对指定的单条消息，转发回复会注明对应帖子。系统日期提示不开放截图。

运行检查：`node --test tests/screenshot-evidence.test.cjs`。
