// @todo/users public API entrypoint
import { type UserSummary } from '@todo/shared';

export const USERS_MODULE_VERSION = '0.1.0';

export interface User extends UserSummary {
  createdAt: string;
}
