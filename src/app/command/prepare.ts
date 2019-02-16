import { left } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { isReleaseType } from '../../core/model/release-type';
import { isVersionString, WipVersion } from '../../core/model/version';
import { PrepareVersion } from '../../core/use-case/prepare-version';
import { PrepareVersionAdapter } from '../adapter/prepare-version-adapter';
import { Git } from '../shim/git';
import { Base } from './base';

export class PrepareCommand extends Base<{ git: Git }, [string], { verbose: boolean }> {
  protected build(_: any, releaseTypeOrVersionStr: string) {
    const adapter = new PrepareVersionAdapter(this.deps.config, this.deps.git, this.deps.logger);
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
