import { right } from 'fp-ts/lib/Either';
import { fromEither, tryCatch } from 'fp-ts/lib/TaskEither';
import { DefaultMethods, LoggerFunc } from 'signale';
import { SimpleGit } from 'simple-git/promise';
import { ReleaseBranch } from '../../core/model/release-branch';
import { Version } from '../../core/model/version';
import { ReleaseVersionPort } from '../../core/use-case/release-version';
import { Config } from '../config';

export class ReleaseVersionAdapter implements ReleaseVersionPort {
  public readonly notify: ReleaseVersionPort['notify'];

  public constructor(
    private readonly config: Config,
    private readonly repository: SimpleGit,
    private readonly signale: Record<Extract<DefaultMethods, 'success'>, LoggerFunc>,
  ) {
    const tap = <T>(f: (t: T) => void) => (t: T) => {
      f(t);
      return fromEither<string, T>(right(t));
    };
    this.notify = {
      merged: tap((_) => this.signale.success(`merged: ${_.toString(this.config)}`)),
      tagged: tap((_) => this.signale.success(`version tag created: ${_.toString(this.config)}`)),
    };
  }

  public mergeBranch(branch: ReleaseBranch) {
    const { branchPrefix, versionPrefix, masterBranch } = this.config;
    const from = branch.toString({ branchPrefix, versionPrefix });
    const to = masterBranch;

    const checkout = tryCatch(() => this.repository.checkout(to), String);
    const merge = tryCatch(() => this.repository.merge([from, '--no-ff']), String);

    return checkout.chainSecond(merge).map(() => branch);
  }

  public createTag(version: Version) {
    const { versionPrefix, masterBranch } = this.config;
    const versionTag = version.toString({ versionPrefix });

    const checkout = tryCatch(() => this.repository.checkout(masterBranch), String);
    const createTag = tryCatch(() => this.repository.addTag(versionTag), String);

    return checkout.chainSecond(createTag).map(() => version);
  }
}
