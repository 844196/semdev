import { array } from 'fp-ts/lib/Array';
import { sequence_ } from 'fp-ts/lib/Foldable2v';
import { fromIO, taskEitherSeq } from 'fp-ts/lib/TaskEither';
import { ReleaseBranch } from '../../core/model/release-branch';
import { Version, WipVersion } from '../../core/model/version';
import { ReleaseVersionPort } from '../../core/use-case/release-version';
import { Config, toStringerConfig } from '../config';
import { CommandRunner } from '../shim/command-runner';
import { Git } from '../shim/git';
import { Logger } from '../shim/logger';
import { latestVersion } from './mixin/latest-version';

export class ReleaseVersionAdapter implements ReleaseVersionPort {
  public readonly notify: ReleaseVersionPort['notify'] = {
    merged: (x) => fromIO(this.logger.log('success', `merged: ${x.toString(toStringerConfig(this.config))}`)),
    tagged: (x) => fromIO(this.logger.log('success', `tag created: ${x.toString(toStringerConfig(this.config))}`)),
  };

  public constructor(
    private readonly config: Config,
    private readonly git: Git,
    private readonly logger: Logger,
    private readonly commandRunner: CommandRunner,
  ) {}

  public latestVersion = latestVersion(this.git.tags.bind(this.git));

  public ensureReleasable(version: WipVersion) {
    const tagName = version.toString(toStringerConfig(this.config));
    const tagNotExists = this.git
      .tags()
      .filterOrElse((tags) => [...tags].includes(tagName) === false, new Error(`${tagName} already released`));

    const branchName = ReleaseBranch.of(version).toString(toStringerConfig(this.config));
    const branchExists = this.git
      .localBranches()
      .filterOrElse(
        (branches) => [...branches].includes(branchName),
        new Error(`release branch '${branchName}' does not exists`),
      );

    return tagNotExists.chain(() => branchExists).map((): void => undefined);
  }

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

  public runHooks(timing: 'pre' | 'post', next: Version, prev: Version) {
    const env = {
      NEXT_VERSION: next.toString(toStringerConfig(this.config)),
      PREV_VERSION: prev.toString(toStringerConfig(this.config)),
    };
    const hooks = this.config.hooks.release[timing].map((cmd, idx, cmds) => {
      const log = fromIO<Error, void>(this.logger.logInteractive('await', `[${idx + 1}/${cmds.length}] ${cmd}`));
      const run = this.commandRunner.run(cmd, env);
      return log.chain(() => run);
    });
    return sequence_(taskEitherSeq, array)(hooks).chain(() =>
      fromIO(this.logger.logInteractive('success', `complete ${timing} hooks`)),
    );
  }
}
