import { default as signale } from 'signale';
import { SignaleLogger } from './logger';

let inner: jest.Mocked<typeof signale>;
let subject: SignaleLogger;

beforeEach(() => {
  inner = jest.fn(() => ({ info: jest.fn(() => undefined) }))();
  subject = new SignaleLogger(inner);
});

describe('SignaleLogger', () => {
  it('log()', () => {
    subject.log('info', 'foo').run();
    expect(inner.info).toHaveBeenCalledWith('foo');
  });
});
