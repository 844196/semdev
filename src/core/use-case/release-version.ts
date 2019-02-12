import { fromEither, TaskEither } from 'fp-ts/lib/TaskEither';
import { ReleaseBranch } from '../model/release-branch';
import { Version } from '../model/version';
import { NotifiablePort } from './notifiable-port';

interface NotificationType {
  merged: ReleaseBranch;
  tagged: Version;
}

export interface ReleaseVersionPort extends NotifiablePort<NotificationType> {
  mergeBranch(branch: ReleaseBranch): TaskEither<Error, ReleaseBranch>;
  createTag(version: Version): TaskEither<Error, Version>;
}

export class ReleaseVersion {
  public constructor(private readonly port: ReleaseVersionPort) {}

  public byVersion(version: Version) {
    const mergeBranch = fromEither(ReleaseBranch.of(version))
      .chain(this.port.mergeBranch.bind(this.port))
      .chain(this.port.notify.merged.bind(this.port));

    const createTag = this.port.createTag(version).chain(this.port.notify.tagged.bind(this.port));

    return mergeBranch.chainSecond(createTag);
  }
}
