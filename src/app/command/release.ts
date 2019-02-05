import { left } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { Version } from '../../core/model/version';
import { ReleaseVersion } from '../../core/use-case/release-version';

export class ReleaseCommand {
  public constructor(private readonly releaseVersion: ReleaseVersion) {}

  public run(versionStr: string) {
    const version = Version.wipFromString(versionStr);
    if (version.isRight()) {
      return this.releaseVersion.byVersion(version.value);
    }

    return fromEither(left(`invalid version given: ${versionStr}`));
  }
}
