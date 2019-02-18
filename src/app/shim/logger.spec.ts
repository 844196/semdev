import { default as signale } from 'signale';
import { SignaleLogger } from './logger';

let inner: jest.Mocked<typeof signale>;
let subject: SignaleLogger;

beforeEach(() => {
  inner = jest.fn(() => {
    return {
      info: jest.fn(() => undefined),
      Signale: jest.fn(),
    };
  })();
  subject = new SignaleLogger(inner);
});

describe('SignaleLogger', () => {
  it('log()', () => {
    subject.log('info', 'foo').run();
    expect(inner.info).toHaveBeenCalledWith('foo');
  });

  it('logInteractive()', () => {
    const s = jest.fn(() => {
      return {
        debug: jest.fn(),
      };
    })();
    inner.Signale.mockImplementation(() => s);

    subject.logInteractive('debug', 'foo').run();
    expect(inner.Signale).toHaveBeenCalledWith({ interactive: true });
    expect(s.debug).toHaveBeenCalledWith('foo');
  });
});
