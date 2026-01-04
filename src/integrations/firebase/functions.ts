// Firebase Cloud Functions utilities
import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { firebaseApp } from './client';

// Initialize Firebase Functions
const functions = getFunctions(firebaseApp);

// Set region if needed (default is us-central1)
// const functions = getFunctions(firebaseApp, 'europe-west1');

/**
 * Generic function to call Firebase Cloud Functions
 */
export const callFunction = async <T = any, R = any>(
  functionName: string,
  data?: T
): Promise<R> => {
  const callable = httpsCallable<T, R>(functions, functionName);
  const result: HttpsCallableResult<R> = await callable(data);
  return result.data;
};

/**
 * Example: Send notification via Firebase Function
 */
export const sendNotification = async (data: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}) => {
  return await callFunction('sendNotification', data);
};

/**
 * Example: Process event creation
 */
export const processEvent = async (eventData: {
  title: string;
  description: string;
  location: string;
  startDate: string;
}) => {
  return await callFunction('processEvent', eventData);
};

/**
 * Example: Send email via Firebase Function
 */
export const sendEmail = async (data: {
  to: string;
  subject: string;
  body: string;
  template?: string;
}) => {
  return await callFunction('sendEmail', data);
};

/**
 * Get all available functions (for debugging)
 */
export const getAvailableFunctions = () => {
  return functions;
};
