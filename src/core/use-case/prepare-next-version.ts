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
    const detectLatestVersion = this.port
      .latestVersion()
      .chain((latest) => this.port.notify.detectedLatest(latest).map(() => latest));

    const computeNextVersion = detectLatestVersion
      .map((latest) => latest.increment(releaseType))
      .chain((latest) => this.port.notify.computedNext(latest).map(() => latest));

    const checkoutBranch = computeNextVersion
      .map(ReleaseBranch.of)
      .chain((branch) => this.port.createBranch(branch).chain(() => this.port.notify.createdBranch(branch)));

    return checkoutBranch;
  }

  public byVersion(version: WipVersion) {
    const branch = ReleaseBranch.of(version);
    return this.port.createBranch(branch).chain(() => this.port.notify.createdBranch(branch));
  }
}
