// eslint-disable-next-line import/no-unresolved
import { initializeApp } from 'firebase-admin/app';

export function authConfiguration() {
  const _app = initializeApp();
  console.log('After calling initalizeApp');

  return {};
}
