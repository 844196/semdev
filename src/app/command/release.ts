import { left } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { SimpleGit } from 'simple-git/promise';
import { Version } from '../../core/model/version';
import { ReleaseVersion } from '../../core/use-case/release-version';
import { ReleaseVersionAdapter } from '../adapter/release-version-adapter';
import { Base } from './base';

export class ReleaseCommand extends Base<{ git: SimpleGit }, [string]> {
  protected build(_: any, versionStr: string) {
    const adapter = new ReleaseVersionAdapter(this.deps.config, this.deps.git, this.deps.logger);
    const useCase = new ReleaseVersion(adapter);

    const version = Version.wipFromString(versionStr);
    if (version.isRight()) {
      return useCase.byVersion(version.value);
    }

    return fromEither(left(`invalid version given: ${versionStr}`));
  }
}
