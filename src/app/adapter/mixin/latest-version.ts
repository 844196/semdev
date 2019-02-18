import { last, rights, sort } from 'fp-ts/lib/Array';
import { identity } from 'fp-ts/lib/Identity';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { initialVersion, ordVersion, Version } from '../../../core/model/version';
import { versionStringParser } from '../../../core/model/version-string-parser';

export const latestVersion = <L>(tags: () => TaskEither<L, Set<string>>) => (): TaskEither<L, Version> =>
  tags().map(
    (ts) =>
      identity
        .of([...ts])
        .map((xs) => xs.map(versionStringParser.parse))
        .map(rights)
        .map((xs) => xs.map((x) => x.toReleasedVersion()))
        .map(sort(ordVersion))
        .map(last)
        .map((x) => x.getOrElse(initialVersion)).value,
  );
