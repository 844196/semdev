import { left } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { SimpleGit } from 'simple-git/promise';
import { isReleaseType } from '../../core/model/release-type';
import { Version } from '../../core/model/version';
import { PrepareNextVersion } from '../../core/use-case/prepare-next-version';
import { PrepareNextVersionAdapter } from '../adapter/prepare-next-version-adapter';
import { Base } from './base';

export class PrepareCommand extends Base<{ git: SimpleGit }, [string], { verbose: boolean }> {
  protected build({ verbose }: { verbose: boolean }, releaseTypeOrVersionStr: string) {
    const adapter = new PrepareNextVersionAdapter(this.deps.config, this.deps.git, {
      info: verbose ? this.deps.logger.info : () => undefined,
      success: this.deps.logger.success,
    });
    const useCase = new PrepareNextVersion(adapter);

    if (isReleaseType(releaseTypeOrVersionStr)) {
      return useCase.byReleaseType(releaseTypeOrVersionStr);
    }

    const version = Version.wipFromString(releaseTypeOrVersionStr);
    if (version.isRight()) {
      return useCase.byVersion(version.value);
    }

    return fromEither(left(`invalid release type or version given: ${releaseTypeOrVersionStr}`));
  }
}
