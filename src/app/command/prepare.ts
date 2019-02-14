import { left } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { isReleaseType } from '../../core/model/release-type';
import { isVersionString, Version } from '../../core/model/version';
import { PrepareNextVersion } from '../../core/use-case/prepare-next-version';
import { PrepareNextVersionAdapter } from '../adapter/prepare-next-version-adapter';
import { Git } from '../shim/git';
import { Base } from './base';

export class PrepareCommand extends Base<{ git: Git }, [string], { verbose: boolean }> {
  protected build(_: any, releaseTypeOrVersionStr: string) {
    const adapter = new PrepareNextVersionAdapter(this.deps.config, this.deps.git, this.deps.logger);
    const useCase = new PrepareNextVersion(adapter);

    if (isReleaseType(releaseTypeOrVersionStr)) {
      return useCase.byReleaseType(releaseTypeOrVersionStr);
    }

    if (isVersionString(releaseTypeOrVersionStr)) {
      return useCase.byVersion(Version.wipFromString(releaseTypeOrVersionStr));
    }

    return fromEither(left(new Error(`invalid release type or version given: ${releaseTypeOrVersionStr}`)));
  }
}
