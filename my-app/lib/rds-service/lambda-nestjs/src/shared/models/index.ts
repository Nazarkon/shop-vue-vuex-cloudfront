// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Request } from 'express';

import { User } from '../../users';

export interface AppRequest extends Request {
  user?: User
}
