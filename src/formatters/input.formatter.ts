import { ReviewRequest } from '../types';

const RESPONSE_DISCLAIMER = `
--------------------------------------------------
IMPORTANT - RESPONSE FORMAT REMINDER:
Please reply strictly in the following format only.
Any response outside this format will not be processed correctly.

ANALYSIS: write your full analysis here
PRIORITY: High or Medium or Low
APPROVED: Yes or No
COMMENTS: write your comments here
--------------------------------------------------
`.trim();

export function formatInputMessage(request: ReviewRequest): string {
  return `
TASK ID: ${request.taskId}

USER STORY:
${request.userStory}

REQUIREMENTS:
${request.requirements}

${RESPONSE_DISCLAIMER}
  `.trim();
}