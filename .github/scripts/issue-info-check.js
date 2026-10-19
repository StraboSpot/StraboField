// Flags newly opened issues that are missing the details we need to triage them, and asks the
// reporter for them in a single bot comment that is updated (not re-posted) as they add info.
// Issues left in that state with no activity for STALE_DAYS are closed by closeStale().
// Runs from .github/workflows/issue-info-check.yml and issue-stale-close.yml via actions/github-script.

const NEEDS_INFO_LABEL = 'needs more info';
const MARKER = '<!-- issue-info-check -->';
const SKIP_LABELS = ['testing', 'question', 'documentation'];
const MIN_DESCRIPTION_WORDS = 15;
const STALE_DAYS = 45;

// Template boilerplate that would otherwise satisfy the checks, e.g. "[e.g. iPhone6]".
const stripTemplate = text => (text || '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\[e\.g\.[^\]]*\]/gi, '')
  .replace(/^\*\*.*\*\*\s*$/gm, '')
  .replace(/^.*(A clear and concise description|If applicable, add screenshots|Add any other context|Steps to reproduce the behavior|Go to '\.\.\.'|Click on '\.\.\.\.'|Scroll down to '\.\.\.\.'|See error|Yes\/No|Are you able to reproduce).*$/gim, '')
  .replace(/^\s*-\s*(Device|OS|StraboSpot Version)\s*:?\s*$/gim, '');

const wordCount = text => (text.match(/[A-Za-z0-9']+/g) || []).length;

const CHECKS = [
  {
    id: 'version',
    bugOnly: true,
    prompt: '**StraboField app version** (Home Menu → bottom of the menu, e.g. `2.31.8`)',
    test: t => /\b(?:version|ver|v)\s*[:#]?\s*\d+\.\d+/i.test(t) || /\b\d+\.\d+\.\d+\b/.test(t),
  },
  {
    id: 'device',
    bugOnly: true,
    prompt: '**Device and OS version** (e.g. `iPad A16, iPadOS 26.5` or `Pixel 8, Android 15`)',
    test: t => /\b(i\s?phone|i\s?pad|ios|ipados|android|pixel|samsung|galaxy|tablet|chromebook)\b/i.test(t),
  },
  {
    id: 'steps',
    bugOnly: true,
    prompt: '**Steps to reproduce** — what you tapped, in order, leading up to the problem',
    test: t => /(^|\s)\d+[.)]\s+[A-Za-z]/m.test(t)
      || /\b(steps?|reproduce|when i|after i|then i|i (tapped|clicked|opened|pressed|selected|went|tried))\b/i.test(t),
  },
  {
    id: 'description',
    bugOnly: false,
    prompt: '**A fuller description** — what you expected to happen vs. what actually happened (a screenshot or screen recording helps a lot)',
    test: t => wordCount(t) >= MIN_DESCRIPTION_WORDS,
  },
];

function findMissing({title, body, labels, extraText = ''}) {
  const isEnhancement = labels.includes('enhancement');
  const text = [title, stripTemplate(body), extraText].join('\n');
  const descriptionText = [stripTemplate(body), extraText].join('\n');
  return CHECKS
    .filter(c => !(c.bugOnly && isEnhancement))
    .filter(c => !c.test(c.id === 'description' ? descriptionText : text));
}

function buildComment(author, missing) {
  if (missing.length === 0) {
    return `${MARKER}\nThanks @${author} — this issue now has the details we need. 👍`;
  }
  return [
    MARKER,
    `Thanks for the report, @${author}! To help us track this down, could you add the following?`,
    '',
    ...missing.map(c => `- [ ] ${c.prompt}`),
    '',
    'You can edit the issue description or reply in a comment — this note will update automatically once the details are in.',
  ].join('\n');
}

module.exports = async ({github, context, core}) => {
  const {owner, repo} = context.repo;
  const issue = context.payload.issue;
  if (!issue || issue.pull_request) return;
  if (issue.user.type === 'Bot') return;

  // Our own label changes shouldn't re-trigger a check.
  if (context.payload.action === 'labeled' && context.payload.label?.name === NEEDS_INFO_LABEL) return;

  const labels = issue.labels.map(l => (typeof l === 'string' ? l : l.name));
  if (labels.some(l => SKIP_LABELS.includes(l))) return;

  const comments = await github.paginate(github.rest.issues.listComments, {
    owner, repo, issue_number: issue.number, per_page: 100,
  });
  const botComment = comments.find(c => c.user.type === 'Bot' && c.body.includes(MARKER));

  // Only comments from the reporter count toward filling in missing info.
  const authorText = comments
    .filter(c => c.user.login === issue.user.login)
    .map(c => c.body)
    .join('\n');

  // A reporter's reply only matters once we've asked for something.
  if (context.eventName === 'issue_comment' && !botComment) return;

  const missing = findMissing({title: issue.title, body: issue.body, labels, extraText: authorText});
  core.info(`#${issue.number}: missing [${missing.map(c => c.id).join(', ') || 'nothing'}]`);

  if (missing.length === 0) {
    if (botComment) {
      await github.rest.issues.updateComment({
        owner, repo, comment_id: botComment.id, body: buildComment(issue.user.login, missing),
      });
    }
    // Reopen issues closeStale() closed once the reporter fills in what was missing.
    if (issue.state === 'closed' && issue.state_reason === 'not_planned' && labels.includes(NEEDS_INFO_LABEL)) {
      await github.rest.issues.update({owner, repo, issue_number: issue.number, state: 'open'});
    }
    if (labels.includes(NEEDS_INFO_LABEL)) {
      await github.rest.issues.removeLabel({owner, repo, issue_number: issue.number, name: NEEDS_INFO_LABEL})
        .catch(() => {});
    }
    return;
  }

  const body = buildComment(issue.user.login, missing);
  if (botComment) {
    if (botComment.body !== body) {
      await github.rest.issues.updateComment({owner, repo, comment_id: botComment.id, body});
    }
  } else {
    await github.rest.issues.createComment({owner, repo, issue_number: issue.number, body});
  }

  if (!labels.includes(NEEDS_INFO_LABEL)) {
    await github.rest.issues.createLabel({
      owner, repo, name: NEEDS_INFO_LABEL, color: 'fbca04',
      description: 'Waiting on the reporter for version, device, or reproduction details',
    }).catch(() => {}); // already exists
    await github.rest.issues.addLabels({owner, repo, issue_number: issue.number, labels: [NEEDS_INFO_LABEL]});
  }
};

// Any edit, comment, or label change bumps updated_at, so it doubles as "last activity".
async function closeStale({github, context, core}) {
  const {owner, repo} = context.repo;
  const cutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
  const issues = await github.paginate(github.rest.issues.listForRepo, {
    owner, repo, state: 'open', labels: NEEDS_INFO_LABEL, per_page: 100,
  });

  for (const issue of issues) {
    if (issue.pull_request || Date.parse(issue.updated_at) > cutoff) continue;
    core.info(`Closing #${issue.number} (last activity ${issue.updated_at})`);
    await github.rest.issues.createComment({
      owner, repo, issue_number: issue.number,
      body: `Closing this because the details requested above haven't been added in ${STALE_DAYS} days. `
        + `@${issue.user.login}, if you're still seeing this problem, reply with those details and we'll reopen it.`,
    });
    await github.rest.issues.update({
      owner, repo, issue_number: issue.number, state: 'closed', state_reason: 'not_planned',
    });
  }
}

module.exports.findMissing = findMissing;
module.exports.closeStale = closeStale;
