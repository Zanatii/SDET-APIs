import { ReviewResponse } from '../types';

export function formatOutputResponse(taskId: string, rawResponse: string): ReviewResponse {
  const getValue = (key: string): string => {
    const regex = new RegExp(`${key}:\\s*(.+)`, 'i');
    const match = rawResponse.match(regex);
    return match ? match[1].trim() : '';
  };

  const approved = getValue('APPROVED').toLowerCase();

  return {
    taskId,
    rawResponse,
    analysis: getValue('ANALYSIS'),
    priority: getValue('PRIORITY'),
    approved: approved === 'yes' || approved === 'true',
    comments: getValue('COMMENTS'),
    receivedAt: new Date().toISOString()
  };
}