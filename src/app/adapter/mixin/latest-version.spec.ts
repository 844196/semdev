import { right } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { initialVersion, ReleasedVersion } from '../../../core/model/version';
import { latestVersion } from './latest-version';

describe('latestVersion()', () => {
  it('exists', async () => {
    const tags = () => fromEither(right(new Set(['v1.0.0', 'v1.0.1-alpha.1', 'v1.0.1'])));

    const rtn = await latestVersion(tags)().run();
    expect(rtn.value).toEqual(ReleasedVersion.of(1, 0, 1));
  });

  it('not exists', async () => {
    const tags = () => fromEither(right(new Set([])));

    const rtn = await latestVersion(tags)().run();
    expect(rtn.value).toBe(initialVersion);
  });
});
