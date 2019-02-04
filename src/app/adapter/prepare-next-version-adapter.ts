import { findFirst } from 'fp-ts/lib/array';
import { right } from 'fp-ts/lib/Either';
import { insert, union } from 'fp-ts/lib/Set';
import { fromEither, tryCatch } from 'fp-ts/lib/TaskEither';
import * as semver from 'semver';
import { DefaultMethods, LoggerFunc } from 'signale';
import { SimpleGit } from 'simple-git/promise';
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
    const { versionPrefix } = this.config;
    this.notify = {
      detectedLatest: tap((_) => this.signale.info(`detected latest version: ${_.toString(versionPrefix)}`)),
      computedNext: tap((_) => this.signale.info(`compute next version: ${_.toString(versionPrefix)}`)),
      createdBranch: tap((_) => this.signale.success(`create development branch: ${_}`)),
    };
  }

  public fetchAllVersion() {
    const verIntoSet = insert(ordVersion);
    const releasedVersions = tryCatch(() => this.repository.tags(), String)
      .map(({ all }) => all)
      .map((tags) =>
        tags
          .filter((x) => semver.valid(x))
          .reduce((xs, x) => verIntoSet(Version.releasedFromString(x), xs), new Set<Version>()),
      );
    const wipVersions = tryCatch(() => this.repository.branchLocal(), String)
      .map(({ all }) => all)
      .map((branches) =>
        branches
          .map((x) => x.replace(/^release\//, ''))
          .filter((x) => semver.valid(x))
          .reduce((xs, x) => verIntoSet(Version.wipFromString(x), xs), new Set<Version>()),
      );
    return releasedVersions.chain((x) => wipVersions.map((y) => union(ordVersion)(x, y)));
  }

  public existsDevelopmentBranch(version: Version) {
    return tryCatch(() => this.repository.branchLocal(), String)
      .map(({ all }) => all)
      .map((branches) => findFirst(branches, (x) => x === this.toBranchName(version)));
  }

  public createDevelopmentBranch(version: Version) {
    const { mainStreamBranch } = this.config;
    const branchName = this.toBranchName(version);
    return tryCatch(() => this.repository.checkoutBranch(branchName, mainStreamBranch), String).map(() => branchName);
  }

  private toBranchName(version: Version) {
    const { branchPrefix, versionPrefix } = this.config;
    return `${branchPrefix}${version.toString(versionPrefix)}`;
  }
}
