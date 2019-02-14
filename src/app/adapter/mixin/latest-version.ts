import { findLast } from 'fp-ts/lib/Array';
import { identity } from 'fp-ts/lib/function';
import { filter, map, toArray } from 'fp-ts/lib/Set';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { isReleasedVersion, isVersionString, ordVersion, Version } from '../../../core/model/version';

const pickLatestReleased = (vs: Set<Version>) => findLast(toArray(ordVersion)(vs), isReleasedVersion);

export const latestVersion = <L>(tags: () => TaskEither<L, Set<string>>) => (): TaskEither<L, Version> =>
  tags().map((ts) => {
    const vs = map(ordVersion)(filter(ts, isVersionString), Version.releasedFromString);
    return pickLatestReleased(vs).fold<Version>(Version.initial(), identity);
  });
