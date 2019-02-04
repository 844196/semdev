import { Version } from './version';
import { VersionDevelopmentBranch } from './version-development-branch';

describe('VersionDevelopmentBranch', () => {
  it('of()', () => {
    expect(() => VersionDevelopmentBranch.of(Version.released(1, 2, 3))).toThrow(
      new Error('given version was already released: 1.2.3'),
    );
  });

  it('toString()', () => {
    const branch = VersionDevelopmentBranch.of(Version.wip(1, 2, 3));

    expect(branch.toString()).toBe('1.2.3');
    expect(branch.toString({ branchPrefix: 'release/', versionPrefix: 'v' })).toBe('release/v1.2.3');
  });
});
