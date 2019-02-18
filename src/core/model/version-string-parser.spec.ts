import { ReleasedVersion, WipVersion } from './version';
import { ParseResult, versionStringParser } from './version-string-parser';

describe('VersionStringParser', () => {
  describe('parse()', () => {
    it('valid', () => {
      expect(versionStringParser.parse('1.2.3').value).toEqual(new ParseResult(1, 2, 3, ''));
      expect(versionStringParser.parse('v1.2.3').value).toEqual(new ParseResult(1, 2, 3, ''));
      expect(versionStringParser.parse('1.2.3-alpha.1').value).toEqual(new ParseResult(1, 2, 3, 'alpha.1'));
      expect(versionStringParser.parse('v1.2.3-alpha.1').value).toEqual(new ParseResult(1, 2, 3, 'alpha.1'));
    });

    it('invalid', () => {
      const parsed = versionStringParser.parse('foo');
      expect(parsed.value).toEqual(new Error('invalid version string: foo'));
    });
  });
});

describe('ParseResult', () => {
  let result: ParseResult;

  beforeEach(() => {
    result = new ParseResult(1, 2, 3, 'alpha.1');
  });

  it('toWipVersion()', () => {
    expect(result.toWipVersion()).toEqual(WipVersion.of(1, 2, 3));
  });

  it('toReleasedVersion', () => {
    expect(result.toReleasedVersion()).toEqual(ReleasedVersion.of(1, 2, 3, 'alpha.1'));
  });
});
