import { toError } from 'fp-ts/lib/Either';
import { taskEither, tryCatch } from 'fp-ts/lib/TaskEither';
import { SimpleGit } from 'simple-git/promise';
import { FunctionKeys } from 'utility-types';

export class SimpleGitClient {
  public constructor(private readonly inner: SimpleGit) {}

  public tags() {
    return tryCatch(() => this.inner.tags(), toError).map(({ all }) => new Set(all));
  }

  public localBranches() {
    return tryCatch(() => this.inner.branchLocal(), toError).map(({ all }) => new Set(all));
  }

  public checkout(branch: string) {
    return tryCatch(() => this.inner.checkout(branch), toError);
  }

  public createBranch(branch: string, from: string) {
    return tryCatch(() => this.inner.checkoutBranch(branch, from), toError);
  }

  public createTag(name: string) {
    return tryCatch(() => this.inner.addTag(name), toError).map((): void => undefined);
  }

  public merge(branch: string, mergeType: '--ff' | '--no-ff') {
    return tryCatch(() => this.inner.merge([branch, mergeType]), toError).map((): void => undefined);
  }
}

export type Git = { [P in FunctionKeys<SimpleGitClient>]: SimpleGitClient[P] };

export class ReadonlyGitClient extends SimpleGitClient implements Git {
  public checkout() {
    return taskEither.of<Error, void>(undefined);
  }

  public createBranch() {
    return taskEither.of<Error, void>(undefined);
  }

  public createTag() {
    return taskEither.of<Error, void>(undefined);
  }

  public merge() {
    return taskEither.of<Error, void>(undefined);
  }
}
