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

test('the new accusation appears on day three, applies effects once, and opens the artist chat', () => {
  const {run}=game();
  assert.equal(run('findNote("n5")'), undefined);
  assert.doesNotMatch(run('xhsFeed()'), /data-note="n5"/);
  run('S.day=2;S.slot=2;S.app="eat";consume(1)');
  assert.equal(run('S.day'), 3);
  assert.equal(run('S.slot'), 0);
  assert.equal(run('S.po'), 35);
  assert.equal(run('S.stress'), 45);
  assert.equal(run('S.money'), 100);
  assert.equal(run('S.app+":"+S.view+":"+S.arg'), 'chat:thread:artist');
  assert.match(run('wxThread("artist")'), /又在小粉书发了新的鉴定帖/);
  assert.doesNotMatch(run('wxThread("artist")'), /data-note="n5"/);
  run('readPhone()');
  assert.match(run('wxThread("artist")'), /data-note="n5"/);
  assert.equal(run('availableNotes()[0].id'), 'n5');
  assert.equal(run('findNote("n5").author'), run('findNote("n1").author'));
  assert.equal(run('S.slot'), 0);
  run('go("xhs","note","n5")');
  assert.match(run('xhsNote("n5")'), /补充鉴定/);
  assert.match(run('xhsNote("n5")'), /第 3 天发布/);
  run('go("xhs");newDay();S.day=4;newDay()');
  assert.equal(run('S.po'), 35);
  assert.equal(run('S.stress'), 45);
  assert.equal(run('availableNotes().filter(n=>n.id==="n5").length'), 1);
  assert.equal(run('S.chat.artist.filter(m=>m.id==="day3:new-accusation").length'), 1);
});

test('third-day event waits until the previous artist action has finished showing its replies', () => {
  const {run}=game();
  run('S.day=2;S.slot=2;act("chat")');
  assert.equal(run('S.day3Accusation'), false);
  run('readPhone();readPhone()');
  assert.equal(run('S.evidence[0].id'), 'e3');
  assert.equal(run('S.day'), 2);
  assert.equal(run('S.day3Accusation'), false);
  run('readPhone()');
  assert.equal(run('S.day'), 3);
  assert.equal(run('S.day3Accusation'), true);
  assert.equal(run('S.pendingAction'), null);
  assert.equal(run('S.po'), 35);
  assert.equal(run('S.stress'), 40);
});

test('comments on the new post use the existing support and evidence reply flows', () => {
  const {run}=game();
  assert.equal(run('replySheet("c7")'), '');
  run('S.day=3;newDay()');
  assert.match(run('replySheet("c8")'), /data-rp="agree"/);
  assert.match(run('replySheet("c7")'), /data-rp="noev"/);
  run('S.evidence.push({id:"e5",...EVIDENCE.e5})');
  assert.match(run('replySheet("c9")'), /data-evidence="e5"/);
  assert.equal(run('postEvidence("n5")'), null);
  run('S=newState(2)');
  assert.equal(run('S.day3Accusation'), false);
  assert.equal(run('findNote("n5")'), undefined);
});
