const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function game(character = 1) {
  const app = { innerHTML: '', inert: false, querySelectorAll: () => [], querySelector: () => null };
  const modal = { innerHTML: '' };
  const view = { scrollTop: 0, scrollHeight: 400 };
  const context = vm.createContext({ document: { getElementById: id => ({ app, modal, view }[id] || null) }, clearTimeout() {}, setTimeout() {} });
  const run = code => vm.runInContext(code, context);
  run(script);
  run(`wire=()=>{}; beginCase(${character})`);
  const budget = () => run('JSON.stringify([S.day,S.slot,S.money,S.po,S.stress,S.evidence,S.bills,S.scheduleLivestream,S.usedComments,S.myNotes,S.chat.artist,S.forwarded,S.noteLikes,S.votes,S.replies,S.mhsReplies])');
  return { run, budget, app };
}

test('opening reveals exactly one new chat message per click, then starts the tour', () => {
  const { run, budget } = game();
  const before = budget();
  assert.equal(run('S.chat.friend.length'), 1);
  assert.equal(run('S.app+":"+S.arg'), 'chat:friend');
  assert.equal(run('S.tutorial.phase'), 'intro');
  run('continueIntro()');
  assert.equal(run('S.chat.friend.length'), 2);
  run('continueIntro()');
  assert.equal(run('S.chat.friend.length'), 3);
  assert.equal(run('S.tutorial.phase'), 'intro');
  run('continueIntro()');
  assert.equal(run('S.tutorial.phase'), 'tour');
  assert.equal(run('S.app'), 'xhs');
  assert.equal(budget(), before);
});

test('both characters can tour every real page and metric without spending resources', () => {
  for (const character of [1, 2]) {
    const { run, budget } = game(character);
    const before = budget();
    run('startTour(); act=consume=order=collect=()=>{throw Error("tour performed a game action")};');
    const visited = [];
    const count = run('tutorialSteps().length');
    for (let i = 0; i < count; i++) {
      assert.equal(run('S.tutorial.step'), i);
      visited.push(run('S.app+":"+S.view'));
      assert.equal(budget(), before);
      run('advanceTour()');
    }
    assert.equal(count, 10);
    assert.ok(visited.includes('xhs:note'));
    assert.ok(visited.includes('xhs:'));
    assert.ok(visited.includes('mhs:msg'));
    assert.ok(!visited.includes('album:'));
    assert.ok(visited.includes('chat:thread'));
    assert.equal(run('S.tutorial.phase'), 'outro');
    assert.equal(run('S.app+":"+S.arg'), 'chat:friend');
    run('readPhone(); readPhone()');
    assert.equal(run('S.tutorial.phase'), 'done');
    assert.equal(run('S.app+":"+S.arg'), 'chat:friend');
    assert.equal(budget(), before);
    assert.equal(run('S.chat.friend.filter(m=>m.type==="guide").length'), 1);
  }
});

test('previous, skip, replay, and restart preserve the intended tutorial lifecycle', () => {
  const { run, budget } = game();
  const before = budget();
  run('finishTutorial()');
  assert.equal(run('S.tutorial.phase'), 'outro');
  run('readPhone(); readPhone()');
  assert.equal(run('S.tutorial.phase'), 'done');
  assert.equal(budget(), before);
  run('startTour();advanceTour();advanceTour(-1)');
  assert.equal(run('S.tutorial.step'), 0);
  assert.equal(run('S.app'), 'xhs');
  run('advanceTour(-1)');
  assert.equal(run('S.tutorial.step'), 0);
  run('finishTutorial();startTour();finishTutorial()');
  assert.equal(run('S.chat.friend.filter(m=>m.type==="guide").length'), 1);
  assert.equal(budget(), before);
  run('start()');
  assert.equal(run('S'), null);
});

test('the final tour steps highlight opinion, stress, budgets, and collected evidence', () => {
  const { run } = game(2);
  const steps = JSON.parse(run('JSON.stringify(tutorialSteps())'));
  assert.equal(steps.length, 10);
  assert.deepEqual(steps.slice(-3).map(step => step.target), ['.hud .meters', '[data-tour-target="resources"]', '[data-tour-target="evidence"]']);
  assert.doesNotMatch(steps.map(step => step.text).join(' '), /\d|[≥≤]|(?:舆论|压力)\s*[+\-]/);
  assert.match(steps.find(step => step.target === '.hud .meters').text, /Public Opinion/);
  assert.match(steps.find(step => step.target === '.hud .meters').text, /quit/);
});
