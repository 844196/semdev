import { TaskEither } from 'fp-ts/lib/TaskEither';

export interface GitPort {
  tags(): TaskEither<Error, string[]>;
  localBranches(): TaskEither<Error, string[]>;
  checkout(branch: string): TaskEither<Error, void>;
  createBranch(branch: string, from: string): TaskEither<Error, void>;
  createTag(name: string): TaskEither<Error, void>;
  merge(branch: string, mergeType: '--ff' | '--no-ff'): TaskEither<Error, void>;
}
