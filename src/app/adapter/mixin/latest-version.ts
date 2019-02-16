import { findLast } from 'fp-ts/lib/Array';
import { identity } from 'fp-ts/lib/function';
import { filter, map, toArray } from 'fp-ts/lib/Set';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { initialVersion, isVersionString, ordVersion, ReleasedVersion, Version } from '../../../core/model/version';

const pickLatestReleased = (vs: Set<Version>) => findLast(toArray(ordVersion)(vs), (v) => v.isReleased());

export const latestVersion = <L>(tags: () => TaskEither<L, Set<string>>) => (): TaskEither<L, Version> =>
  tags().map((ts) => {
    const vs = map(ordVersion)(filter(ts, isVersionString), ReleasedVersion.fromString);
    return pickLatestReleased(vs).fold<Version>(initialVersion, identity);
  });
