import { left } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { isVersionString, WipVersion } from '../../core/model/version';
import { ReleaseVersion } from '../../core/use-case/release-version';
import { ReleaseVersionAdapter } from '../adapter/release-version-adapter';
import { CommandRunner } from '../shim/command-runner';
import { Git } from '../shim/git';
import { Base } from './base';

export interface ReleaseCommandDependency {
  git: Git;
  readonlyGit: Git;
  commandRunner: CommandRunner;
  emptyCommandRunner: CommandRunner;
}

export interface ReleaseCommandOption {
  dryRun: boolean;
}

export class ReleaseCommand extends Base<ReleaseCommandDependency, [string], ReleaseCommandOption> {
  protected build({ dryRun }: ReleaseCommandOption, versionStr: string) {
    const adapter = new ReleaseVersionAdapter(
      this.deps.config,
      dryRun ? this.deps.readonlyGit : this.deps.git,
      this.deps.logger,
      dryRun ? this.deps.emptyCommandRunner : this.deps.commandRunner,
    );
    const useCase = new ReleaseVersion(adapter);

    if (isVersionString(versionStr)) {
      return useCase.byVersion(WipVersion.fromString(versionStr));
    }

    return fromEither(left(new Error(`invalid version given: ${versionStr}`)));
  }
}
