import { toError } from 'fp-ts/lib/Either';
import { taskEither, tryCatch } from 'fp-ts/lib/TaskEither';
import { SimpleGit } from 'simple-git/promise';
import { GitPort } from '../../core/port/git-port';

export class SimpleGitAdapter implements GitPort {
  public constructor(private readonly simpleGit: SimpleGit) {}

  public tags() {
    return tryCatch(() => this.simpleGit.tags(), toError).map(({ all }) => all);
  }

  public localBranches() {
    return tryCatch(() => this.simpleGit.branchLocal(), toError).map(({ all }) => all);
  }

  public checkout(branch: string) {
    return tryCatch(() => this.simpleGit.checkout(branch), toError);
  }

  public createBranch(branch: string, from: string) {
    return tryCatch(() => this.simpleGit.checkoutBranch(branch, from), toError);
  }

  public createTag(name: string) {
    return tryCatch(() => this.simpleGit.addTag(name), toError).map((): void => undefined);
  }

  public merge(branch: string, mergeType: '--ff' | '--no-ff') {
    return tryCatch(() => this.simpleGit.merge([branch, mergeType]), toError).map((): void => undefined);
  }
}

export class ReadonlySimpleGitAdapter extends SimpleGitAdapter implements GitPort {
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
