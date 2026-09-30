import { useCallback } from 'react';
import { openRecordFile } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';

/** Returns a handler that opens a record's attachment and reports failures (e.g. access denied) as a toast */
export function useOpenRecordFile() {
  const { showToast } = useToast();
  return useCallback(
    async (recordId: string) => {
      try {
        await openRecordFile(recordId);
      } catch (err: any) {
        showToast(err?.message || 'Could not open this file', 'error');
      }
    },
    [showToast]
  );
}
