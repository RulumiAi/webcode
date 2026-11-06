import { ApiError, type ApiWizardNameAvailability } from '../api';

export function isNameTaken(result: ApiWizardNameAvailability) {
  return !result.available && result.code === 'NAME_TAKEN';
}

export function isTransientNameCheckFailure(reason: unknown) {
  if (reason instanceof ApiError) {
    if (reason.code === 'NAME_TAKEN' || reason.status === 401) return false;
    return true;
  }
  return true;
}
