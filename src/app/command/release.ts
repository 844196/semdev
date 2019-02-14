import { left } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { isVersionString, Version } from '../../core/model/version';
import { ReleaseVersion } from '../../core/use-case/release-version';
import { ReleaseVersionAdapter } from '../adapter/release-version-adapter';
import { Git } from '../shim/git';
import { Base } from './base';

export class ReleaseCommand extends Base<{ git: Git }, [string]> {
  protected build(_: any, versionStr: string) {
    const adapter = new ReleaseVersionAdapter(this.deps.config, this.deps.git, this.deps.logger);
    const useCase = new ReleaseVersion(adapter);

    if (isVersionString(versionStr)) {
      return useCase.byVersion(Version.wipFromString(versionStr));
    }

    return fromEither(left(new Error(`invalid version given: ${versionStr}`)));
  }
}
