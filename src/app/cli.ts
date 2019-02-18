import { default as cac } from 'cac';
import { default as cosmiconfig } from 'cosmiconfig';
import { default as execa } from 'execa';
import { exit } from 'process';
import { default as signale } from 'signale';
import { default as simpleGit } from 'simple-git/promise';
import { name as ME, version as VERSION } from '../../package.json';
import { PrepareCommand, PrepareCommandOption } from './command/prepare';
import { ReleaseCommand, ReleaseCommandOption } from './command/release';
import { defaultConfig, encode } from './config';
import { EmptyCommandRunner, ExecaCommandRunner } from './shim/command-runner';
import { ReadonlyGitClient, SimpleGitClient } from './shim/git';
import { SignaleLogger } from './shim/logger';

// config
const found = cosmiconfig(ME).searchSync();
const config = found ? encode(found.config as any) : defaultConfig;

// logger
const logger = new SignaleLogger(signale);

// git
const git = new SimpleGitClient(simpleGit().silent(true));
const readonlyGit = new ReadonlyGitClient(simpleGit().silent(true));

// command runner
const commandRunner = new ExecaCommandRunner(execa, process.env);
const emptyCommandRunner = new EmptyCommandRunner();

// cli
const cli = cac(ME)
  .version(VERSION)
  .help();

cli.on('command:*', () =>
  logger
    .log('error', `unknown sub command: ${cli.args.join(' ')}`)
    .chain(() => exit(1))
    .run(),
);

cli
  .command('prepare <major|minor|patch|new-version>', 'Prepare for next version development')
  .option('--dry-run', 'Dry run', { default: false })
  .example(`${ME} prepare major`)
  .example(`${ME} prepare v1.2.3`)
  .action((releaseTypeOrVersion: string, opts: PrepareCommandOption) =>
    new PrepareCommand({ config, logger, git, readonlyGit }).run(opts, releaseTypeOrVersion).then(exit),
  );

cli
  .command('release <version>', 'Merge version development branch & create tag')
  .option('--dry-run', 'Dry run', { default: false })
  .example(`${ME} release v1.2.3`)
  .action((version: string, opts: ReleaseCommandOption) =>
    new ReleaseCommand({ config, logger, git, readonlyGit, commandRunner, emptyCommandRunner })
      .run(opts, version)
      .then(exit),
  );

export { cli };
