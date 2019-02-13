import { left } from 'fp-ts/lib/Either';
import { IO } from 'fp-ts/lib/IO';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { SimpleGit } from 'simple-git/promise';
import { isReleaseType } from '../../core/model/release-type';
import { Version } from '../../core/model/version';
import { PrepareNextVersion } from '../../core/use-case/prepare-next-version';
import { PrepareNextVersionAdapter } from '../adapter/prepare-next-version-adapter';
import { Base } from './base';

export class PrepareCommand extends Base<{ git: SimpleGit }, [string], { verbose: boolean }> {
  protected build({ verbose }: { verbose: boolean }, releaseTypeOrVersionStr: string) {
    const adapter = new PrepareNextVersionAdapter(this.deps.config, this.deps.git, {
      log: verbose ? this.deps.logger.log.bind(this.deps.logger) : () => new IO(() => undefined),
      note: verbose ? this.deps.logger.note.bind(this.deps.logger) : () => new IO(() => undefined),
      info: verbose ? this.deps.logger.info.bind(this.deps.logger) : () => new IO(() => undefined),
      start: this.deps.logger.start.bind(this.deps.logger),
      complete: this.deps.logger.complete.bind(this.deps.logger),
      success: this.deps.logger.success.bind(this.deps.logger),
      error: this.deps.logger.error.bind(this.deps.logger),
    });
    const useCase = new PrepareNextVersion(adapter);

    if (isReleaseType(releaseTypeOrVersionStr)) {
      return useCase.byReleaseType(releaseTypeOrVersionStr);
    }

    const version = Version.wipFromString(releaseTypeOrVersionStr);
    if (version.isRight()) {
      return useCase.byVersion(version.value);
    }

    return fromEither(left(new Error(`invalid release type or version given: ${releaseTypeOrVersionStr}`)));
  }
}
