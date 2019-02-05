import { left } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { isReleaseType } from '../../core/model/release-type';
import { Version } from '../../core/model/version';
import { PrepareNextVersion } from '../../core/use-case/prepare-next-version';

export class PrepareCommand {
  public constructor(private readonly prepareNextVersion: PrepareNextVersion) {}

  public run(releaseTypeOrVersionStr: string) {
    if (isReleaseType(releaseTypeOrVersionStr)) {
      return this.prepareNextVersion.byReleaseType(releaseTypeOrVersionStr);
    }

    const version = Version.wipFromString(releaseTypeOrVersionStr);
    if (version.isRight()) {
      return this.prepareNextVersion.byVersion(version.value);
    }

    return fromEither(left(`invalid release type or version given: ${releaseTypeOrVersionStr}`));
  }
}
