const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function game() {
  const app = { innerHTML: '', inert: false, querySelectorAll: () => [], querySelector: () => null };
  const context = vm.createContext({document: {getElementById: id => ({app, modal:{innerHTML:''}, view:{scrollTop:0}}[id] || null)}, clearTimeout(){}, setTimeout(){}});
  const run = code => vm.runInContext(code, context);
  run(script);
  run('wire=()=>{}; timeTransition=()=>{}; S=newState(1)');
  return {run};
}

test('Pudding replies reveal one at a time and grant evidence only when the attachment is read', () => {
  const {run}=game();
  run('S.day=2;go("mhs","msg","m2")');
  assert.match(run('mhs()'), /回复，索取约稿过程记录/);
  assert.equal(run('S.evidence.length'), 0);
  assert.equal(run('replyMhs("m2")'), true);
  assert.equal(run('replyMhs("m2")'), false);
  assert.match(run('mhs()'), /谢谢你愿意作证/);
  assert.doesNotMatch(run('mhs()'), /我把两次约稿留下的过程记录整理给你/);
  run('readPhone()');
  assert.match(run('mhs()'), /我把两次约稿留下的过程记录整理给你/);
  assert.doesNotMatch(run('mhs()'), /和这次争议的订单要分开看/);
  assert.equal(run('S.evidence.length'), 0);
  run('readPhone()');
  assert.equal(run('S.evidence.length'), 0);
  run('readPhone()');
  assert.equal(run('S.evidence[0].id'), 'e5');
  assert.equal(run('S.evidence[0].from'), '咪画师 · 客户布丁');
  assert.match(run('mhs()'), /客户布丁的两次约稿过程记录/);
  assert.equal(run('unreadMhsDialogue()'), false);
  assert.equal(run('S.day'), 2);
  assert.equal(run('S.slot'), 1);
  assert.equal(run('S.pendingTime'), 0);
  assert.equal(run('S.po'), 55);
  assert.equal(run('S.stress'), 35);
  assert.equal(run('S.money'), 100);
  run('go("mhs","msg");go("mhs","msg","m2");readPhone()');
  assert.doesNotMatch(run('mhs()'), /data-mhs-reply/);
  assert.equal(run('S.evidence.length'), 1);
  run('rebut("e5")');
  assert.equal(run('S.po'), 65);
});

test('reply requests require an available current customer conversation', () => {
  const {run}=game();
  assert.equal(run('replyMhs("m2")'), false);
  run('go("mhs","msg","m2")');
  assert.equal(run('replyMhs("m2")'), false);
  assert.doesNotMatch(run('mhs()'), /data-mhs-reply/);
  run('S.day=2;go("mhs","msg","m1")');
  assert.equal(run('replyMhs("m2")'), false);
  run('S.pendingTime=1');
  assert.equal(run('replyMhs("m1")'), false);
  run('S.pendingTime=0');
  assert.equal(run('replyMhs("m0")'), false);
  assert.equal(run('replyMhs("missing")'), false);
  assert.equal(run('Object.keys(S.mhsReplies).length'), 0);
});

test('the order timeline is shared with the existing feed evidence and cannot duplicate', () => {
  const {run}=game();
  run('collectPost("n3");go("mhs","msg","m1");replyMhs("m1");readPhone();readPhone()');
  assert.equal(run('S.evidence.length'), 1);
  assert.equal(run('S.evidence[0].id'), 'e2');
  assert.equal(run('S.slot'), 1);
});

test('later customer conversations support replies, with material only where available', () => {
  const {run}=game();
  run('S.day=4;go("mhs","msg","m3");replyMhs("m3");readPhone()');
  assert.equal(run('S.evidence.length'), 0);
  assert.match(run('mhs()'), /谢谢你，我先缓一缓/);
  run('go("mhs","msg","m4");replyMhs("m4");readPhone();readPhone()');
  assert.equal(run('S.evidence[0].id'), 'e6');
  assert.equal(run('S.slot'), 1);
});

test('tutorial reply previews remain usable after real replies without changing conversations', () => {
  const {run}=game();
  run('go("mhs","msg","m1");replyMhs("m1");readPhone();readPhone();startTour()');
  const before=run('JSON.stringify([S.mhsReplies,S.evidence,S.day,S.slot])');
  for (const id of ['m1','m2']) {
    run(`S.tutorial.step=tutorialSteps().findIndex(s=>s.action==='[data-mhs-reply="${id}"]');showTourStep()`);
    assert.match(run('mhs()'), /data-mhs-reply/);
    assert.equal(run(`replyMhs("${id}")`), false);
    assert.equal(run('JSON.stringify([S.mhsReplies,S.evidence,S.day,S.slot])'), before);
  }
  run('finishTutorial();go("mhs","msg","m1")');
  assert.doesNotMatch(run('mhs()'), /data-mhs-reply/);
});
