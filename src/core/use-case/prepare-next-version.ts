import { constant } from 'fp-ts/lib/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { ReleaseBranch } from '../model/release-branch';
import { ReleaseType } from '../model/release-type';
import { Version, WipVersion } from '../model/version';
import { NotifiablePort } from './notifiable-port';

interface NotificationType {
  detectedLatest: Version;
  computedNext: Version;
  createdBranch: ReleaseBranch;
}

export interface PrepareNextVersionPort extends NotifiablePort<NotificationType> {
  latestVersion(): TaskEither<Error, Version>;
  createBranch(branch: ReleaseBranch): TaskEither<Error, void>;
}

export class PrepareNextVersion {
  public constructor(private readonly port: PrepareNextVersionPort) {}

  public byReleaseType(releaseType: ReleaseType) {
    const detectLatestVersion = () =>
      this.port.latestVersion().chain((latest) => this.port.notify.detectedLatest(latest).map(constant(latest)));
    const computeNextVersion = (latest: Version) => {
      const next = latest.increment(releaseType);
      return this.port.notify.computedNext(next).map(constant(next));
    };

    return detectLatestVersion()
      .chain(computeNextVersion)
      .chain((next) => this.byVersion(next));
  }

  public byVersion(version: WipVersion) {
    const branch = ReleaseBranch.of(version);
    return this.port.createBranch(branch).chain(() => this.port.notify.createdBranch(branch));
  }
}
