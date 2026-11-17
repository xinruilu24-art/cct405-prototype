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

test('screenshot API and controls are removed', () => {
  const {run}=game();
  assert.equal(run('typeof SCREENSHOT_ALLOWLIST'), 'undefined');
  assert.equal(run('typeof saveScreenshot'), 'undefined');
  assert.doesNotMatch(html, /data-capture|data-screenshot|toDataURL|截图取证/);
});

test('only published rules and designated evidence posts can be collected', () => {
  const {run}=game();
  assert.equal(run('postEvidence("livestream-announcement")'), null);
  assert.equal(run('postEvidence("n1")'), null);
  run('collectPost("n1")');
  assert.equal(run('S.evidence.length'), 0);
  run('collectPost("n2")');
  assert.equal(run('S.evidence[0].id'), 'e1');
  assert.equal(run('S.pendingTime'), 0);
  assert.equal(run('S.slot'), 1);
  assert.equal(run('S.day'), 1);
});

test('collecting a published announcement preserves its complete text and deduplicates', () => {
  const {run}=game();
  run('S.myNotes.push(makeWagerAnnouncement());collectPost("livestream-announcement")');
  assert.equal(run('S.evidence.length'), 1);
  assert.equal(run('S.evidence[0].text'), run('makeWagerAnnouncement().body'));
  assert.match(run('evidenceList()'), /文字／记录/);
  assert.match(run('evidenceMedia(S.evidence[0])'), /公开留存/);
  assert.equal(run('S.pendingTime'), 0);
  assert.equal(run('S.slot'), 1);
  assert.equal(run('S.day'), 1);
  run('S.pendingTime=0;collectPost("livestream-announcement")');
  assert.equal(run('S.evidence.length'), 1);
  assert.equal(run('S.pendingTime'), 0);
  assert.match(run('xhsNote("livestream-announcement")'), /已收藏/);
  run('rebut("livestream-announcement")');
  assert.equal(run('S.po'), 65);
});

test('tutorial announcement preview never publishes or collects actual evidence', () => {
  const {run}=game();
  run('startTour();S.tutorial.step=tutorialSteps().findIndex(s=>s.previewAnnouncement);showTourStep();collectPost("livestream-announcement")');
  assert.match(run('xhsNote("livestream-announcement")'), /收藏证据/);
  assert.equal(run('S.evidence.length'), 0);
  assert.equal(run('S.myNotes.length'), 0);
  assert.equal(run('S.scheduleLivestream'), false);
  run('finishTutorial()');
  assert.equal(run('postEvidence("livestream-announcement")'), null);
});
