import { fromLeft } from 'fp-ts/lib/TaskEither';
import { isReleaseType } from '../../core/model/release-type';
import { versionStringParser } from '../../core/model/version-string-parser';
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

    const parsed = versionStringParser.parse(releaseTypeOrVersionStr);
    if (parsed.isRight()) {
      return useCase.byVersion(parsed.value.toWipVersion());
    }

    return fromLeft(new Error(`invalid release type or version given: ${releaseTypeOrVersionStr}`));
  }
}
