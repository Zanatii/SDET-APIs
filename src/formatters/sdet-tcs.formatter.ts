import * as fs from 'fs';
import * as path from 'path';
import { SdetTcsResponse } from '../types';

export function formatTcsMessage(ticketId: string, requirementsAnalysis: any, hlsList: any[]): string {
  const template = fs.readFileSync(path.join(process.cwd(), 'prompts', 'tcs.txt'), 'utf-8');

  const hlsLines = hlsList
    .filter((h: any) => h.id !== 'HLS-EXP')
    .map((h: any) => `  ${h.id} (${h.type}): ${h.title} — links: ${(h.linked_requirements ?? []).join(', ')}`)
    .join('\n');
  const hlsBlock = hlsLines + '\n  HLS-EXP: Exploratory Testing (catch-all)';

  const formatted = template
    .replace('{hls_list}', hlsBlock);

  return '<<<PASTE>>>' + formatted;
}

export function parseTcsResponse(rawResponse: string): SdetTcsResponse {
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(parsed.tc_list)) {
    throw new Error('Invalid response: tc_list array is missing');
  }

  return { tc_list: parsed.tc_list };
}
