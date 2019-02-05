import { fromEither, TaskEither } from 'fp-ts/lib/TaskEither';
import { ReleaseBranch } from '../model/release-branch';
import { Version } from '../model/version';
import { NotifiablePort } from './notifiable-port';

interface NotificationType {
  merged: ReleaseBranch;
  tagged: Version;
}

export interface ReleaseVersionPort extends NotifiablePort<NotificationType> {
  mergeBranch(branch: ReleaseBranch): TaskEither<string, ReleaseBranch>;
  createTag(version: Version): TaskEither<string, Version>;
}

export class ReleaseVersion {
  public constructor(private readonly port: ReleaseVersionPort) {}

  public byVersion(version: Version) {
    return fromEither(ReleaseBranch.of(version))
      .chain(this.port.mergeBranch.bind(this.port))
      .chain(this.port.notify.merged.bind(this.port))
      .map((branch) => branch.version)
      .chain(this.port.createTag.bind(this.port))
      .chain(this.port.notify.tagged.bind(this.port));
  }
}
