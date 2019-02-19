import { ExecaStatic } from 'execa';
import { fromLeft } from 'fp-ts/lib/TaskEither';
import { SimpleGit } from 'simple-git/promise';
import { isReleaseType } from '../../core/model/release-type';
import { versionStringParser } from '../../core/model/version-string-parser';
import { PrepareVersion } from '../../core/use-case/prepare-version';
import { ConfigAdapter } from '../adapter/config-adapter';
import { ReadonlySimpleGitAdapter, SimpleGitAdapter } from '../adapter/git-adapter';
import { SignaleMessageAdapter } from '../adapter/message-adapter';
import { Base } from './base';

export interface PrepareCommandDependency {
  simpleGit: SimpleGit;
  execa: ExecaStatic;
}

export interface PrepareCommandOption {
  dryRun: boolean;
}

export class PrepareCommand extends Base<PrepareCommandDependency, [string], PrepareCommandOption> {
  protected build({ dryRun }: PrepareCommandOption, releaseTypeOrVersionStr: string) {
    const useCase = new PrepareVersion(
      new ConfigAdapter(this.deps.config),
      dryRun ? new ReadonlySimpleGitAdapter(this.deps.simpleGit) : new SimpleGitAdapter(this.deps.simpleGit),
      new SignaleMessageAdapter(this.deps.signale),
    );

    if (isReleaseType(releaseTypeOrVersionStr)) {
      return useCase.byReleaseType(releaseTypeOrVersionStr);
    }

    const parsed = versionStringParser.parse(releaseTypeOrVersionStr);
    if (parsed.isRight()) {
      return useCase.byVersion(parsed.value.toWipVersion());
    }

    return fromLeft(new Error(`invalid release type or version given: ${releaseTypeOrVersionStr}`));
  }
}
