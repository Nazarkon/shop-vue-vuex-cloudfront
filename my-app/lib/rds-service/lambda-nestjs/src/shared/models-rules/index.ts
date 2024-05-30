// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { AppRequest } from '../models';

/**
 * @param {AppRequest} request
 * @returns {string}
 */
export function getUserIdFromRequest(request: AppRequest): string {
  return request.user && request.user.id;
}
