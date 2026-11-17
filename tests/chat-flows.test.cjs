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
  const context = vm.createContext({ document: { getElementById: id => ({ app, modal, view }[id] || null) }, clearTimeout() {}, setTimeout() {} });
  const run = code => vm.runInContext(code, context);
  run(script);
  run(`wire=()=>{}; var transitions=0; timeTransition=()=>transitions++; ending=n=>{S.screen="ending";S.ending=n}; S=newState(${character})`);
  return { run, app };
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

test('public action results remain visible before the time transition', () => {
  const { run, app } = game();
  run('S.slot=2;act("respond")');
  assert.equal(run('S.myNotes.length'), 1);
  assert.equal(run('S.pendingTime'), 1);
  assert.equal(run('S.day'), 1);
  assert.equal(run('transitions'), 0);
  assert.match(app.innerHTML, /action-result/);
  run('readPhone()');
  assert.equal(run('S.day'), 2);
  assert.equal(run('transitions'), 1);
});

test('livestream eligibility checks the exact balance for each artist without spending it', () => {
  for (const [character, required] of [[1, 50], [2, 80]]) {
    const { run } = game(character);
    run(`S.stress=20;S.money=${required - 1};act("announce")`);
    assert.equal(run('S.scheduleLivestream'), false);
    assert.equal(run('S.pendingTime'), 0);
    assert.equal(run('S.slot'), 1);
    assert.match(run('xhsCompose()'), /disabled/);
    run(`S.money=${required};act("announce")`);
    assert.equal(run('S.scheduleLivestream'), true);
    assert.equal(run('S.money'), required);
    assert.equal(run('S.pendingTime'), 1);
    assert.equal(run('S.slot'), 1);
    run('readPhone()');
    assert.equal(run('S.slot'), 2);
  }
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
