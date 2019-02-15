import { reduceWithKey } from 'fp-ts/lib/Record';
import { fromIO } from 'fp-ts/lib/TaskEither';
import { CLIHookAction, CommandRunner } from '../../core/model/cli-hook-action';
import { ReleaseBranch } from '../../core/model/release-branch';
import { Version } from '../../core/model/version';
import { ReleaseVersionPort } from '../../core/use-case/release-version';
import { Config, toStringerConfig } from '../config';
import { Git } from '../shim/git';
import { Logger } from '../shim/logger';
import { latestVersion } from './mixin/latest-version';

export class ReleaseVersionAdapter implements ReleaseVersionPort {
  public readonly hooks: ReleaseVersionPort['hooks'] = { pre: [], post: [] };
  public readonly notify: ReleaseVersionPort['notify'] = {
    merged: (x) => fromIO(this.logger.log('success', `merged: ${x.toString(toStringerConfig(this.config))}`)),
    tagged: (x) => fromIO(this.logger.log('success', `tag created: ${x.toString(toStringerConfig(this.config))}`)),
    runHook: (x) => fromIO(this.logger.log('start', `run: ${x.inspect()}`)),
  };

  public constructor(
    private readonly config: Config,
    private readonly git: Git,
    private readonly logger: Logger,
    private readonly commandRunner: CommandRunner,
  ) {
    this.hooks = reduceWithKey(this.config.hooks.release, { ...this.hooks }, (type, hooks, cmds) => {
      hooks[type] = cmds.map((cmd) => new CLIHookAction(cmd, this.commandRunner, this.config.versionPrefix));
      return hooks;
    });
  }

  public latestVersion = latestVersion(this.git.tags.bind(this.git));

  public mergeBranch(branch: ReleaseBranch) {
    return this.git
      .checkout(this.config.masterBranch)
      .chain(() => this.git.merge(branch.toString(toStringerConfig(this.config)), '--no-ff'));
  }

  public createTag(version: Version) {
    return this.git
      .checkout(this.config.masterBranch)
      .chain(() => this.git.createTag(version.toString(toStringerConfig(this.config))))
      .map((): void => undefined);
  }
}
