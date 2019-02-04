import { findLast } from 'fp-ts/lib/array';
import { toArray } from 'fp-ts/lib/Set';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { ReleaseType } from '../model/release-type';
import { ordVersion, Version } from '../model/version';
import { VersionDevelopmentBranch } from '../model/version-development-branch';

export interface NotificationType {
  detectedLatest: Version;
  computedNext: Version;
  createdBranch: VersionDevelopmentBranch;
}

export interface PrepareNextVersionPort {
  notify: { [K in keyof NotificationType]: (present: NotificationType[K]) => TaskEither<string, NotificationType[K]> };
  fetchAllVersion(): TaskEither<string, Set<Version>>;
  checkoutBranch(branch: VersionDevelopmentBranch): TaskEither<string, VersionDevelopmentBranch>;
}

export class PrepareNextVersion {
  public constructor(private readonly port: PrepareNextVersionPort) {}

  public byReleaseType(releaseType: ReleaseType) {
    const detectLatestVersion = this.port
      .fetchAllVersion()
      .map(toArray(ordVersion))
      .map((vers) => findLast(vers, (ver) => ver.released).getOrElse(Version.initial()))
      .chain(this.port.notify.detectedLatest.bind(this.port));

    const computeNextVersion = detectLatestVersion
      .map((latest) => latest.increment(releaseType))
      .chain(this.port.notify.computedNext.bind(this.port));

    const checkoutBranch = computeNextVersion
      .map(VersionDevelopmentBranch.of)
      .chain(this.port.checkoutBranch.bind(this.port))
      .chain(this.port.notify.createdBranch.bind(this.port));

    return checkoutBranch;
  }
}
