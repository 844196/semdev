import { ExecaStatic } from 'execa';
import { fromLeft } from 'fp-ts/lib/TaskEither';
import { SimpleGit } from 'simple-git/promise';
import { versionStringParser } from '../../core/model/version-string-parser';
import { ReleaseVersion } from '../../core/use-case/release-version';
import { ConfigAdapter } from '../adapter/config-adapter';
import { ReadonlySimpleGitAdapter, SimpleGitAdapter } from '../adapter/git-adapter';
import { SignaleMessageAdapter } from '../adapter/message-adapter';
import { EmptyShellAdapter, ExecaShellAdapter } from '../adapter/shell-adapter';
import { Base } from './base';

export interface ReleaseCommandDependency {
  simpleGit: SimpleGit;
  execa: ExecaStatic;
  env: NodeJS.ProcessEnv;
}

export interface ReleaseCommandOption {
  dryRun: boolean;
}

export class ReleaseCommand extends Base<ReleaseCommandDependency, [string], ReleaseCommandOption> {
  protected build({ dryRun }: ReleaseCommandOption, versionStr: string) {
    const useCase = new ReleaseVersion(
      new ConfigAdapter(this.deps.config),
      dryRun ? new ReadonlySimpleGitAdapter(this.deps.simpleGit) : new SimpleGitAdapter(this.deps.simpleGit),
      new SignaleMessageAdapter(this.deps.signale),
      dryRun ? new EmptyShellAdapter() : new ExecaShellAdapter(this.deps.execa, this.deps.env),
    );

    const parsed = versionStringParser.parse(versionStr);
    if (parsed.isRight()) {
      return useCase.byVersion(parsed.value.toWipVersion());
    }

    return fromLeft(new Error(`invalid version given: ${versionStr}`));
  }
}
