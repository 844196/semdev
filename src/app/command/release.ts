import { fromLeft } from 'fp-ts/lib/TaskEither';
import { versionStringParser } from '../../core/model/version-string-parser';
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

    const parsed = versionStringParser.parse(versionStr);
    if (parsed.isRight()) {
      return useCase.byVersion(parsed.value.toWipVersion());
    }

    return fromLeft(new Error(`invalid version given: ${versionStr}`));
  }
}
