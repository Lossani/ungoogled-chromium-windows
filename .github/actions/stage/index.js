const core = require('@actions/core');
const io = require('@actions/io');
const exec = require('@actions/exec');
const artifact = require('@actions/artifact');
const glob = require('@actions/glob');

async function run() {
    process.on('SIGINT', function() {
    })
    const finished = core.getBooleanInput('finished', {required: true});
    const from_artifact = core.getBooleanInput('from_artifact', {required: true});
    
    console.log(`finished: ${finished}, artifact: ${from_artifact}`);
    if (finished) {
        core.setOutput('finished', true);
        return;
    }

    const artifactClient = artifact.create();
    const artifactName = 'build-artifact';

    if (from_artifact) {
        await artifactClient.downloadArtifact(artifactName, 'C:\\ungoogled-chromium-windows\\build');
        await exec.exec('7z', ['x', 'C:\\ungoogled-chromium-windows\\build\\artifacts.zip',
            '-oC:\\ungoogled-chromium-windows\\build', '-y']);
        await io.rmRF('C:\\ungoogled-chromium-windows\\build\\artifacts.zip');
    }

    const args = ['build.py', '--ci']
    
    const retCode = await exec.exec('python', args, {
        cwd: 'C:\\ungoogled-chromium-windows',
        ignoreReturnCode: true
    });
    if (retCode === 0) {
        core.setOutput('finished', true);
        const globber = await glob.create('C:\\ungoogled-chromium-windows\\build\\ungoogled-chromium*',
            {matchDirectories: false});
        let packageList = await globber.glob();
        packageList = await Promise.all(packageList.map(async x => {
            const part1 = x.substr(0, x.length - 4);
            const part2 = '_x64';
            const part3 = x.substr(x.length - 4, 4);
            const newPath = part1 + part2 + part3;
            await io.mv(x, newPath);
            return newPath;
        }));
        await artifactClient.uploadArtifact('chromium', packageList,
            'C:\\ungoogled-chromium-windows\\build', {retentionDays: 1});
    } else {
        await new Promise(r => setTimeout(r, 5000));
        await exec.exec('7z', ['a', '-tzip', 'C:\\ungoogled-chromium-windows\\artifacts.zip',
            'C:\\ungoogled-chromium-windows\\build\\src', '-mx=3', '-mtc=on'], {ignoreReturnCode: true});
        await artifactClient.uploadArtifact(artifactName, ['C:\\ungoogled-chromium-windows\\artifacts.zip'],
            'C:\\ungoogled-chromium-windows', {retentionDays: 1});
        core.setOutput('finished', false);
    }
}

run().catch(err => core.setFailed(err.message));
