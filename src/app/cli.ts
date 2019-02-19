import { default as cac } from 'cac';
import { default as cosmiconfig } from 'cosmiconfig';
import { default as execa } from 'execa';
import { env, exit } from 'process';
import { default as signale } from 'signale';
import { default as simpleGit } from 'simple-git/promise';
import { name as ME, version as VERSION } from '../../package.json';
import { PrepareCommand, PrepareCommandOption } from './command/prepare';
import { ReleaseCommand, ReleaseCommandOption } from './command/release';
import { defaultConfig, encode } from './config';

// config
const found = cosmiconfig(ME).searchSync();
const config = found ? encode(found.config as any) : defaultConfig;

// command dependencies
const deps = {
  config,
  simpleGit: simpleGit().silent(true),
  signale,
  execa,
  env,
};

// cli
const cli = cac(ME)
  .version(VERSION)
  .help();

cli.on('command:*', () => {
  signale.error(`unknown sub command: ${cli.args.join(' ')}`);
  exit(1);
});

cli
  .command('prepare <major|minor|patch|new-version>', 'Prepare for next version development')
  .option('--dry-run', 'Dry run', { default: false })
  .example(`${ME} prepare major`)
  .example(`${ME} prepare v1.2.3`)
  .action((releaseTypeOrVersion: string, opts: PrepareCommandOption) =>
    new PrepareCommand(deps).run(opts, releaseTypeOrVersion).then(exit),
  );

cli
  .command('release <version>', 'Merge version development branch & create tag')
  .option('--dry-run', 'Dry run', { default: false })
  .example(`${ME} release v1.2.3`)
  .action((version: string, opts: ReleaseCommandOption) => new ReleaseCommand(deps).run(opts, version).then(exit));

export { cli };
