import { IO } from 'fp-ts/lib/IO';
import { fromIO } from 'fp-ts/lib/TaskEither';
import { default as _signale, DefaultMethods } from 'signale';
import { MessagePort, MessageType } from '../../core/port/message-port';

const convert = (t: MessageType): DefaultMethods => {
  switch (t) {
    case MessageType.INFO:
      return 'info';
    case MessageType.SUCCESS:
      return 'success';
    case MessageType.START:
      return 'start';
    case MessageType.COMPLETE:
      return 'complete';
  }
};

export class SignaleMessageAdapter implements MessagePort {
  public constructor(private readonly signale: typeof _signale) {}

  public send(type: MessageType, ...messages: any[]) {
    return fromIO<Error, void>(new IO(() => this.signale[convert(type)](...messages)));
  }
}
