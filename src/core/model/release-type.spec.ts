import { isReleaseType, ReleaseType } from './release-type';

describe('isReleaseType()', () => {
  it('valid', () => {
    expect(isReleaseType(ReleaseType.major)).toBe(true);
  });

  it('invalid', () => {
    expect(isReleaseType('foo')).toBe(false);
  });
});
