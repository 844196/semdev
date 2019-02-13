import { findLast } from 'fp-ts/lib/Array';
import { toArray } from 'fp-ts/lib/Set';
import { fromEither, TaskEither } from 'fp-ts/lib/TaskEither';
import { ReleaseBranch } from '../model/release-branch';
import { ReleaseType } from '../model/release-type';
import { ordVersion, Version } from '../model/version';
import { NotifiablePort } from './notifiable-port';

interface NotificationType {
  detectedLatest: Version;
  computedNext: Version;
  createdBranch: ReleaseBranch;
}

export interface PrepareNextVersionPort extends NotifiablePort<NotificationType> {
  fetchAllVersion(): TaskEither<Error, Set<Version>>;
  checkoutBranch(branch: ReleaseBranch): TaskEither<Error, ReleaseBranch>;
}

export class PrepareNextVersion {
  public constructor(private readonly port: PrepareNextVersionPort) {}

  public byReleaseType(releaseType: ReleaseType) {
    const detectLatestVersion = this.port
      .fetchAllVersion()
      .map(toArray(ordVersion))
      .map((vers) => findLast(vers, (ver) => ver.released).getOrElse(Version.initial()))
      .chain((latest) => this.port.notify.detectedLatest(latest).map(() => latest));

    const computeNextVersion = detectLatestVersion
      .map((latest) => latest.increment(releaseType))
      .chain((latest) => this.port.notify.computedNext(latest).map(() => latest));

    const checkoutBranch = computeNextVersion
      .map(ReleaseBranch.of)
      .chain(fromEither)
      .chain((branch) => this.port.checkoutBranch(branch))
      .chain((branch) => this.port.notify.createdBranch(branch));

    return checkoutBranch;
  }

  public byVersion(version: Version) {
    return fromEither(ReleaseBranch.of(version))
      .chain((branch) => this.port.checkoutBranch(branch))
      .chain((branch) => this.port.notify.createdBranch(branch));
  }
}
