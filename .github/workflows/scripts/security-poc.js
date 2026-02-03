/**
 * GitHub Actions Security Research PoC
 * Demonstrates npm ci LOTP (Living off the Pipeline) vulnerability
 *
 * This script executes during `npm ci` via the preinstall hook.
 * No malicious actions are performed.
 */

const repo = process.env.GITHUB_REPOSITORY || 'unknown';
const runId = process.env.GITHUB_RUN_ID || 'unknown';
const workflow = process.env.GITHUB_WORKFLOW || 'unknown';
const actor = process.env.GITHUB_ACTOR || 'unknown';

console.log('');
console.log('=== GitHub Actions Security Research PoC ===');
console.log('');
console.log('[npm ci LOTP] Arbitrary code execution via preinstall script');
console.log('');
console.log('Repository:', repo);
console.log('Run ID:', runId);
console.log('Workflow:', workflow);
console.log('Triggered by:', actor);
console.log('');
console.log('This demonstrates that an attacker-controlled package.json');
console.log('script executed during the pull_request_target workflow.');
console.log('');
console.log('Workflow run: https://github.com/' + repo + '/actions/runs/' + runId);
console.log('');
console.log('=== PoC Complete ===');
console.log('');
