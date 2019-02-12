import { ReleaseBranch } from './release-branch';
import { Version } from './version';

describe('ReleaseBranch', () => {
  it('of()', () => {
    expect(ReleaseBranch.of(Version.released(1, 2, 3)).value).toEqual(
      new Error('given version was already released: 1.2.3'),
    );
  });

  it('toString()', () => {
    const branch = ReleaseBranch.of(Version.wip(1, 2, 3)).value as ReleaseBranch;

    expect(branch.toString()).toBe('1.2.3');
    expect(branch.toString({ branchPrefix: 'release/', versionPrefix: 'v' })).toBe('release/v1.2.3');
  });
});
