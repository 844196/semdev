import { Either, right } from 'fp-ts/lib/Either';
import { insert, union } from 'fp-ts/lib/Set';
import { fromEither, tryCatch } from 'fp-ts/lib/TaskEither';
import { DefaultMethods, LoggerFunc } from 'signale';
import { SimpleGit } from 'simple-git/promise';
import { ReleaseBranch } from '../../core/model/release-branch';
import { ordVersion, Version } from '../../core/model/version';
import { PrepareNextVersionPort } from '../../core/use-case/prepare-next-version';
import { Config } from '../config';

export class PrepareNextVersionAdapter implements PrepareNextVersionPort {
  public readonly notify: PrepareNextVersionPort['notify'];

  public constructor(
    private readonly config: Config,
    private readonly repository: SimpleGit,
    private readonly signale: Record<Extract<DefaultMethods, 'success' | 'info'>, LoggerFunc>,
  ) {
    const tap = <T>(f: (t: T) => void) => (t: T) => {
      f(t);
      return fromEither<string, T>(right(t));
    };
    this.notify = {
      detectedLatest: tap((_) => this.signale.info(`detected latest version: ${_.toString(this.config)}`)),
      computedNext: tap((_) => this.signale.info(`compute next version: ${_.toString(this.config)}`)),
      createdBranch: tap((_) => this.signale.success(`create development branch: ${_.toString(this.config)}`)),
    };
  }

  public fetchAllVersion() {
    const verIntoSet = (v: Either<string, Version>, vs: Set<Version>) =>
      v.isRight() ? insert(ordVersion)(v.value, vs) : vs;
    const releasedVersions = tryCatch(() => this.repository.tags(), String)
      .map(({ all }) => all)
      .map((tags) =>
        tags
          .filter(Version.validString)
          .reduce((xs, x) => verIntoSet(Version.releasedFromString(x), xs), new Set<Version>()),
      );
    const wipVersions = tryCatch(() => this.repository.branchLocal(), String)
      .map(({ all }) => all)
      .map((branches) =>
        branches
          .map((x) => x.replace(new RegExp(String.raw`^${this.config.branchPrefix}`), ''))
          .filter(Version.validString)
          .reduce((xs, x) => verIntoSet(Version.wipFromString(x), xs), new Set<Version>()),
      );
    return releasedVersions.chain((x) => wipVersions.map((y) => union(ordVersion)(x, y)));
  }

  public checkoutBranch(branch: ReleaseBranch) {
    return tryCatch(
      () => this.repository.checkoutBranch(branch.toString(this.config), this.config.masterBranch),
      String,
    ).map(() => branch);
  }
}
