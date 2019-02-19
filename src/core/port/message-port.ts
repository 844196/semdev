import { TaskEither } from 'fp-ts/lib/TaskEither';

export enum MessageType {
  INFO,
  SUCCESS,
  START,
  COMPLETE,
}

export interface MessagePort {
  send(type: MessageType, ...messages: any[]): TaskEither<Error, void>;
}
