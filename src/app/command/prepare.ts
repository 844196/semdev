import { left } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { isReleaseType } from '../../core/model/release-type';
import { PrepareNextVersion } from '../../core/use-case/prepare-next-version';

export class PrepareCommand {
  public constructor(private readonly prepareNextVersion: PrepareNextVersion) {}

  public run(releaseTypeStr: string) {
    return isReleaseType(releaseTypeStr)
      ? this.prepareNextVersion.byReleaseType(releaseTypeStr)
      : fromEither(left(`invalid release type given: ${releaseTypeStr}`));
  }
}
