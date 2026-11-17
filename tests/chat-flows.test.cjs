const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function game(character = 1) {
  const app = { innerHTML: '', inert: false, querySelectorAll: () => [], querySelector: () => null };
  const modal = { innerHTML: '' }, view = { scrollTop: 0, scrollHeight: 400 };
  const timers = new Map(); let nextTimer = 0;
  const context = vm.createContext({ document: { getElementById: id => ({ app, modal, view }[id] || null) }, clearTimeout(id) { timers.delete(id); }, setTimeout(fn, delay) { timers.set(++nextTimer, { fn, delay }); return nextTimer; } });
  const run = code => vm.runInContext(code, context);
  run(script);
  run(`wire=()=>{}; var transitions=0; timeTransition=()=>transitions++; ending=n=>{S.screen="ending";S.ending=n}; S=newState(${character})`);
  const flushResults = () => { for (const [id, timer] of Array.from(timers)) { if (timer.delay === 1200) { timers.delete(id); timer.fn(); } } };
  return { run, app, timers, flushResults };
}

test('artist replies and evidence reveal one at a time before the slot and day change', () => {
  const { run } = game();
  run('S.slot=2;act("chat")');
  assert.equal(run('S.slot'), 2);
  assert.equal(run('S.day'), 1);
  assert.equal(run('transitions'), 0);
  assert.equal(run('S.evidence.length'), 0);
  assert.match(run('wxThread("artist")'), /今天怎么样/);
  assert.doesNotMatch(run('wxThread("artist")'), /谢谢你来问/);
  run('readPhone()');
  assert.match(run('wxThread("artist")'), /谢谢你来问/);
  assert.equal(run('S.evidence.length'), 0);
  assert.equal(run('transitions'), 0);
  run('readPhone()');
  assert.equal(run('S.evidence[0].id'), 'e3');
  assert.equal(run('S.day'), 1);
  assert.equal(run('transitions'), 0);
  run('readPhone()');
  assert.equal(run('S.day'), 2);
  assert.equal(run('S.slot'), 0);
  assert.equal(run('transitions'), 1);
});

test('video request explains the work and declining costs no time or publication', () => {
  const { run } = game();
  run('act("video")');
  assert.equal(run('S.pendingAction.type'), 'videoDecision');
  assert.doesNotMatch(run('wxThread("artist")'), /data-video-approve/);
  run('readPhone()');
  assert.match(run('wxThread("artist")'), /需要一些时间制作/);
  assert.doesNotMatch(run('wxThread("artist")'), /data-video-approve/);
  run('readPhone()');
  assert.match(run('wxThread("artist")'), /data-video-approve/);
  assert.equal(run('decideVideo(false)'), true);
  run('readPhone();readPhone()');
  assert.equal(run('S.myNotes.length'), 0);
  assert.equal(run('S.po'), 55);
  assert.equal(run('S.slot'), 1);
  assert.equal(run('transitions'), 0);
  assert.equal(run('S.pendingAction'), null);
});

test('approved video publishes once and uses two slots only after all replies are read', () => {
  const { run } = game();
  run('act("video");readPhone();readPhone()');
  assert.equal(run('decideVideo(true)'), true);
  assert.equal(run('decideVideo(true)'), false);
  assert.equal(run('S.myNotes.length'), 0);
  assert.equal(run('S.po'), 55);
  assert.equal(run('S.day'), 1);
  assert.equal(run('S.slot'), 1);
  run('readPhone();readPhone()');
  assert.equal(run('S.myNotes.length'), 1);
  assert.equal(run('S.po'), 65);
  assert.match(run('wxThread("artist")'), /已经发布/);
  assert.equal(run('transitions'), 0);
  assert.equal(run('S.slot'), 1);
  run('readPhone()');
  assert.equal(run('S.day'), 2);
  assert.equal(run('S.slot'), 0);
  assert.equal(run('transitions'), 1);
  assert.equal(run('S.pendingAction'), null);
});

test('evening video and unread artist messages cannot bypass the preparation flow', () => {
  const { run } = game();
  run('S.slot=2;act("video")');
  assert.equal(run('S.pendingAction'), null);
  assert.equal(run('S.myNotes.length'), 0);
  run('S.slot=1;chatMsg("artist",{who:"her",text:"还有一件事"});act("video")');
  assert.equal(run('S.pendingAction'), null);
  assert.equal(run('S.app+":"+S.arg'), 'chat:artist');
  assert.equal(run('S.chatVisible.artist'), 1);
  run('readPhone();act("video")');
  assert.equal(run('S.pendingAction.type'), 'videoDecision');
});

test('non-chat results automatically advance after a brief result display', () => {
  const { run, app, flushResults } = game();
  run('S.slot=2;act("respond")');
  assert.equal(run('S.myNotes.length'), 1);
  assert.equal(run('S.pendingTime'), 1);
  assert.equal(run('S.day'), 1);
  assert.equal(run('transitions'), 0);
  assert.match(app.innerHTML, /action-result/);
  flushResults();
  assert.equal(run('S.day'), 2);
  assert.equal(run('transitions'), 1);
});

test('comment result auto-advance runs once and cannot affect a restarted game', () => {
  const { run, timers, flushResults } = game();
  run('agree();queueTime(1)');
  assert.equal(run('S.slot'), 1);
  const stale = Array.from(timers.values())[0].fn;
  run('readPhone()');
  flushResults(); stale();
  assert.equal(run('S.slot'), 2);
  assert.equal(run('transitions'), 1);
  run('queueTime(1)');
  const cancelled = Array.from(timers.values())[0].fn;
  run('start();S=newState(2)');
  cancelled(); flushResults();
  assert.equal(run('S.slot'), 1);
  assert.equal(run('S.day'), 1);
});

test('livestream eligibility checks the exact balance for each artist without spending it', () => {
  for (const [character, required] of [[1, 50], [2, 80]]) {
    const { run } = game(character);
    run(`S.stress=20;S.money=${required - 1};act("announce")`);
    assert.equal(run('S.scheduleLivestream'), false);
    assert.equal(run('S.pendingTime'), 0);
    assert.equal(run('S.slot'), 1);
    assert.match(run('wxThread("artist")'), /data-a="announce" disabled/);
    run(`S.money=${required};act("announce")`);
    assert.equal(run('S.scheduleLivestream'), false);
    assert.equal(run('S.pendingAction.type'), 'wagerDecision');
    run('readPhone();decideWager(true);readPhone();readPhone()');
    assert.equal(run('S.scheduleLivestream'), true);
    assert.equal(run('S.money'), required);
    assert.equal(run('S.pendingTime'), 1);
    assert.equal(run('S.slot'), 1);
    run('readPhone()');
    assert.equal(run('S.slot'), 2);
  }
});

test('support replies add two opinion points; livestream support still adds five', () => {
  const { run } = game();
  run('agree()');
  assert.equal(run('S.po'), 57);
  run('agree(SMALL)');
  assert.equal(run('S.po'), 62);
});

test('wager confirmation applies artist pressure, then replies, publishes, and spends one slot', () => {
  for (const [character, pressure] of [[1, 20], [2, 30]]) {
    const { run, flushResults } = game(character);
    run('S.stress=20;act("announce")');
    assert.equal(run('decideWager(true)'), false);
    assert.equal(run('S.stress'), 20);
    run('readPhone()');
    assert.match(run('wxThread("artist")'), /压力/);
    assert.equal(run('decideWager(true)'), true);
    assert.equal(run('decideWager(true)'), false);
    assert.equal(run('S.stress'), 20 + pressure);
    assert.equal(run('S.myNotes.length'), 0);
    assert.equal(run('S.slot'), 1);
    run('readPhone()');
    assert.match(run('wxThread("artist")'), /定在第五天/);
    assert.equal(run('S.myNotes.length'), 0);
    run('readPhone()');
    assert.equal(run('S.myNotes[0].id'), 'livestream-announcement');
    assert.equal(run('S.app+":"+S.arg'), 'xhs:livestream-announcement');
    assert.equal(run('S.slot'), 1);
    flushResults();
    assert.equal(run('S.slot'), 2);
    assert.equal(run('transitions'), 1);
  }
});

test('declining a wager leaves pressure, time, and published posts unchanged', () => {
  const { run } = game(2);
  run('act("announce");readPhone();decideWager(false);readPhone();readPhone()');
  assert.equal(run('S.stress'), 75);
  assert.equal(run('S.slot'), 1);
  assert.equal(run('S.myNotes.length'), 0);
  assert.equal(run('S.scheduleLivestream'), false);
  assert.equal(run('S.pendingAction'), null);
});

test('forwarding waits for the reply and spends one slot; food spends money and one slot', () => {
  const { run, flushResults } = game();
  run('forward("n1")');
  assert.equal(run('S.slot'), 1);
  assert.equal(run('S.stress'), 40);
  run('readPhone();readPhone()');
  assert.equal(run('S.slot'), 2);
  run('order(FOODS[0])');
  assert.equal(run('S.money'), 80);
  assert.equal(run('S.stress'), 35);
  assert.equal(run('S.slot'), 2);
  flushResults();
  assert.equal(run('S.day'), 2);
  assert.equal(run('S.slot'), 0);
});

test('day-five livestream eligibility is checked again after later spending', () => {
  for (const [character, required] of [[1, 50], [2, 80]]) {
    const { run } = game(character);
    run(`S.day=4;S.slot=2;S.stress=20;S.scheduleLivestream=true;S.money=${required - 1};consume(1)`);
    assert.equal(run('S.scheduleLivestream'), false);
    assert.equal(run('S.screen'), 'main');
    run(`S.day=4;S.slot=2;S.scheduleLivestream=true;S.money=${required};consume(1)`);
    assert.equal(run('S.screen'), 'live');
    assert.equal(run('S.money'), required);
  }
});

test('album and exact effect scores are absent from player-facing screens', () => {
  const { run } = game();
  assert.equal(run('typeof album'), 'undefined');
  assert.doesNotMatch(run('screen()'), /相册|data-app="album"/);
  assert.doesNotMatch(run('xhsCompose()'), /data-a="video"/);
  assert.doesNotMatch(run('actionGuide()'), /舆论\s*[+\-≥]|压力\s*[+\-≥]/);
  assert.doesNotMatch(run('meters()'), /<span>55<\/span>|<span>35<\/span>/);
});
