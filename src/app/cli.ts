import { default as cac } from 'cac';
import { default as cosmiconfig } from 'cosmiconfig';
import { exit } from 'process';
import { default as signale } from 'signale';
import { default as simpleGit } from 'simple-git/promise';
import { PrepareCommand } from './command/prepare';
import { ReleaseCommand } from './command/release';
import { defaultConfig, encode } from './config';
import { SimpleGitClient } from './shim/git';
import { SignaleLogger } from './shim/logger';

const ME = 'semdev';

// config
const found = cosmiconfig(ME).searchSync();
const config = found ? encode(found.config as any) : defaultConfig;

// logger
const logger = new SignaleLogger(signale);

// git
const git = new SimpleGitClient(simpleGit().silent(true));

// cli
const cli = cac(ME)
  .version('0.0.0')
  .help();

cli.on('command:*', () =>
  logger
    .log('error', `unknown sub command: ${cli.args.join(' ')}`)
    .chain(() => exit(1))
    .run(),
);

cli
  .command('prepare <major|minor|patch|new-version>', 'Prepare for next version development')
  .option('--verbose', 'Print progress messages', { default: false })
  .example(() => `${ME} prepare major`)
  .example(() => `${ME} prepare v1.2.3`)
  .action((releaseTypeOrVersion: string, opts: { verbose: boolean }) =>
    new PrepareCommand({ config, logger, git }).run(opts, releaseTypeOrVersion).then(exit),
  );

cli
  .command('release <version>', 'Merge version development branch & create tag')
  .example(() => `${ME} merge v1.2.3`)
  .action((version: string) => new ReleaseCommand({ config, logger, git }).run({}, version).then(exit));

export { cli };
