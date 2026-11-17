const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function game() {
  const app = { innerHTML: '', inert: false, querySelectorAll: () => [], querySelector: () => null };
  const modal = { innerHTML: '' };
  const view = { scrollTop: 120 };
  const paints = [];
  const ctx = {
    measureText: text => ({ width: Array.from(text).length * 25 }),
    fillText: text => paints.push(text), fillRect() {}, strokeRect() {}, drawImage() {}
  };
  const sandbox = vm.createContext({
    document: {
      body: {}, getElementById: id => ({ app, modal, view }[id] || null),
      createElement: type => {
        assert.equal(type, 'canvas');
        return { getContext: () => ctx, toDataURL: () => 'data:image/png;base64,c25hcHNob3Q=' };
      }
    },
    Image: class { naturalWidth = 640; naturalHeight = 480; async decode() {} },
    getComputedStyle: () => ({ fontFamily: 'sans-serif' }), clearTimeout() {}, setTimeout() {}
  });
  const run = code => vm.runInContext(code, sandbox);
  run(script);
  // Each fixture chooses its own content, independently of future production list changes.
  run('Object.values(SCREENSHOT_ALLOWLIST).forEach(list => list.length = 0)');
  run('wire = () => {}; timeTransition = () => {}; S = newState(1)');
  return { run, app, modal, view, paints };
}

test('unlisted targets never expose screenshot controls', () => {
  const { run } = game();
  assert.equal(run('screenshotButton("posts", "unlisted-post")'), '');
  assert.equal(run('screenshotAllowed("toString", "n4")'), false);
});

test('save rejects unlisted, nonvisible, and nonexistent posts or comments', async () => {
  const { run } = game();
  run('SCREENSHOT_ALLOWLIST.posts.push("n4"); SCREENSHOT_ALLOWLIST.comments.push("c2", "missing")');
  assert.equal(await run('saveScreenshot("posts", "n4")'), false);
  run('S.app="xhs"; S.view="note"; S.arg="n1"');
  assert.equal(await run('saveScreenshot("posts", "n4")'), false);
  assert.equal(await run('saveScreenshot("comments", "c1")'), false);
  assert.equal(await run('saveScreenshot("comments", "missing")'), false);
  run('S.sheet="reply sheet"');
  assert.equal(await run('saveScreenshot("comments", "c2")'), false);
  assert.equal(run('S.evidence.length'), 0);
});

test('comment capture keeps its original text and context, deduplicates, and costs no time', async () => {
  const { run, paints, view } = game();
  run('SCREENSHOT_ALLOWLIST.comments.push("c2"); S.app="xhs"; S.view="note"; S.arg="n1"');
  const time = run('`${S.day}:${S.slot}:${S.po}:${S.stress}:${S.money}`');
  assert.equal(await run('saveScreenshot("comments", "c2")'), true);
  assert.equal(run('S.evidence.length'), 1);
  assert.equal(run('S.evidence[0].image.startsWith("data:image/png")'), true);
  assert.equal(run('S.evidence[0].capture.text'), '我关注这位画师好几年了，画风对得上。');
  assert.match(run('S.evidence[0].capture.context'), /这张约稿是 AI 描改的吗/);
  assert.ok(paints.join('').includes('我关注这位画师好几年了，画风对得上。'));
  assert.match(run('screenshotButton("comments", "c2")'), /disabled/);
  assert.equal(await run('saveScreenshot("comments", "c2")'), false);
  assert.equal(run('`${S.day}:${S.slot}:${S.po}:${S.stress}:${S.money}`'), time);
  assert.equal(view.scrollTop, 120);
});

test('post capture includes timeline facts and PNG image decoding failures can be retried', async () => {
  const { run } = game();
  run('SCREENSHOT_ALLOWLIST.posts.push("n3", "n4"); S.app="xhs"; S.view="note"; S.arg="n3"');
  assert.equal(await run('saveScreenshot("posts", "n3")'), true);
  assert.match(run('S.evidence[0].capture.text'), /草稿提交：6 月 18 日/);
  run('S.arg="n4"; Image = class { async decode(){ throw Error("decode failed"); } }; var button={};');
  assert.equal(await run('saveScreenshot("posts", "n4", button)'), false);
  assert.equal(run('S.evidence.length'), 1);
  assert.equal(run('button.disabled'), false);
  assert.equal(run('screenshotBusy'), false);
});

test('locked chat cannot be captured early; MiChat captures only messages that actually exist', async () => {
  const { run } = game();
  run('SCREENSHOT_ALLOWLIST.chats.push("mhs:m2:0", "artist:forward-reply:n2"); S.app="mhs"; S.view="msg"; S.arg="m2"');
  assert.equal(await run('saveScreenshot("chats", "mhs:m2:0")'), false);
  run('S.day=2');
  assert.equal(await run('saveScreenshot("chats", "mhs:m2:0")'), true);
  assert.match(run('S.evidence[0].capture.text'), /每次都有过程图/);
  run('S.app="chat"; S.view="thread"; S.arg="artist"');
  assert.equal(await run('saveScreenshot("chats", "artist:forward-reply:n2")'), false);
  run('forward("n2"); S.app="chat"; S.view="thread"; S.arg="artist"');
  assert.equal(await run('saveScreenshot("chats", "artist:forward-reply:n2")'), true);
  assert.equal(run('S.evidence[1].capture.text'), '对，这是我的。');
  assert.match(run('S.evidence[1].capture.context'), /去年的猫猫草稿/);
});

test('screenshots display in evidence list, album, and the exact selected rebuttal', async () => {
  const { run } = game();
  run('SCREENSHOT_ALLOWLIST.comments.push("c2"); S.app="xhs"; S.view="note"; S.arg="n1"');
  await run('saveScreenshot("comments", "c2")');
  assert.match(run('evidenceList()'), /截图/);
  assert.match(run('evidenceList()'), /data:image\/png/);
  assert.match(run('replySheet("c1")'), /data-evidence="capture:comments:c2"/);
  run('S.app="album"; S.view="photo"; S.arg="capture:comments:c2"');
  assert.match(run('album()'), /data:image\/png/);
  assert.match(run('album()'), /墨水瓶的评论截图/);
  run('rebut("capture:comments:c2")');
  assert.equal(run('S.po'), 65);
  assert.match(run('S.last'), /墨水瓶的评论截图/);
  run('rebut("not-owned")');
  assert.equal(run('S.po'), 60);
  run('var liveHtml="", liveDone=0; var liveButton={dataset:{use:"capture:comments:c2"}}; modal=(html, wire)=>{liveHtml=html;wire({querySelectorAll:()=>[liveButton]});}; rebutDialog(()=>liveDone++)');
  assert.match(run('liveHtml'), /data-use="capture:comments:c2"/);
  run('liveButton.onclick()');
  assert.equal(run('S.po'), 70);
  assert.equal(run('liveDone'), 1);
  assert.match(run('S.last'), /墨水瓶的评论截图/);
});

test('pending capture cannot leak into a restarted game and rapid repeated saves deduplicate', async () => {
  const { run } = game();
  run('SCREENSHOT_ALLOWLIST.comments.push("c2"); S.app="xhs"; S.view="note"; S.arg="n1"');
  const pending = run('saveScreenshot("comments", "c2")');
  assert.equal(await run('saveScreenshot("comments", "c2")'), false);
  await pending;
  assert.equal(run('S.evidence.length'), 1);
  run('S.evidence=[]');
  const cancelled = run('saveScreenshot("comments", "c2")');
  run('S=newState(2)');
  assert.equal(await cancelled, false);
  assert.equal(run('S.evidence.length'), 0);
  run('S.app="xhs"; S.view="note"; S.arg="n1"');
  const backToTitle = run('saveScreenshot("comments", "c2")');
  run('start()');
  assert.equal(await backToTitle, false);
  assert.equal(run('S'), null);
});

test('existing file evidence still collects, opens in the album, and can be presented', () => {
  const { run } = game();
  run('act("chat"); collect(FEED_EVIDENCE[0], true)');
  assert.equal(run('S.evidence.length'), 2);
  run('S.app="album"; S.view="photo"; S.arg="e3"');
  assert.match(run('album()'), /分层源文件/);
  assert.ok(!run('album()').includes('src="undefined"'));
  run('rebut("e1")');
  assert.match(run('S.last'), /约稿之前就有的草稿/);
  assert.equal(run('S.po'), 65);
});
