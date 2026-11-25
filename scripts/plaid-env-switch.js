import { exec } from 'node:child_process';
import { promisify, parseArgs } from 'node:util';
import { exit, loadEnvFile } from 'node:process';
import fs from 'node:fs';

loadEnvFile();
const execAsync = promisify(exec);

const { values: { env } } = parseArgs({
    options: {
        env: { type: 'string', short: 'e' },
    },
});

const secretId = {
    'sandbox': 'f568c5c6-14a9-4f76-811a-b50d01150cb8',
    'production': '2909b05e-4805-4c61-9854-b50d011c6e90'
}

if (!secretId[env]) {
    const validValues = Object.keys(secretId).join(', ');
    console.warn(`'${env}' is not a valid value for --env. Valid values are ${validValues}.`);
    exit();
}

// bws usage
// https://bitwarden.com/help/secrets-manager-cli/#authentication
const { stdout, stderr } = await execAsync(`bws secret get ${secretId[env]} --access-token=${process.env.BWS_ACCESS_TOKEN}`);

if (stderr)
    console.warn('Command stderr:', stderr);

const data = JSON.parse(stdout);

/*
Structure of data is:
{
    id: 'guid',
    organizationId: guid',
    projectId: 'guid',
    key: 'Plaid Key Name Thing From Bitwarden',
    value: 'the secret value',
    note: 'Notes I put into Bitwarden',
    creationDate: '2026-11-25T17:15:35.084120500Z',
    revisionDate: '2026-11-25T17:15:35.084120500Z'
}
*/

function updateEnvFile(filePath, updates) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File ${filePath} does not exist! (check your current directory)`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    for (const [key, value] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        const newLine = `${key}=${value}`;

        if (regex.test(content)) {
            content = content.replace(regex, newLine);
        } else {
            content += (content.endsWith('\n') || content === '' ? '' : '\n') + newLine + '\n';
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

updateEnvFile('../src/senseui/.env', {
    PLAID_ENV: env,
    PLAID_SECRET: data.value
});

updateEnvFile('../src/transactions/.env', {
    PLAID_ENV: env,
    PLAID_SECRET: data.value
});