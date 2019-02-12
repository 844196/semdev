import { TaskEither } from 'fp-ts/lib/TaskEither';

export interface NotifiablePort<T extends {} = {}> {
  notify: { [K in keyof T]: (present: T[K]) => TaskEither<Error, T[K]> };
}
