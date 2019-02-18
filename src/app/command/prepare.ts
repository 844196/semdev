import { left } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { isReleaseType } from '../../core/model/release-type';
import { isVersionString, WipVersion } from '../../core/model/version';
import { PrepareVersion } from '../../core/use-case/prepare-version';
import { PrepareVersionAdapter } from '../adapter/prepare-version-adapter';
import { Git } from '../shim/git';
import { Base } from './base';

export interface PrepareCommandDependency {
  git: Git;
  readonlyGit: Git;
}

export interface PrepareCommandOption {
  dryRun: boolean;
}

export class PrepareCommand extends Base<PrepareCommandDependency, [string], PrepareCommandOption> {
  protected build({ dryRun }: PrepareCommandOption, releaseTypeOrVersionStr: string) {
    const adapter = new PrepareVersionAdapter(
      this.deps.config,
      dryRun ? this.deps.readonlyGit : this.deps.git,
      this.deps.logger,
    );
    const useCase = new PrepareVersion(adapter);

    if (isReleaseType(releaseTypeOrVersionStr)) {
      return useCase.byReleaseType(releaseTypeOrVersionStr);
    }

    if (isVersionString(releaseTypeOrVersionStr)) {
      return useCase.byVersion(WipVersion.fromString(releaseTypeOrVersionStr));
    }

    return fromEither(left(new Error(`invalid release type or version given: ${releaseTypeOrVersionStr}`)));
  }
}
