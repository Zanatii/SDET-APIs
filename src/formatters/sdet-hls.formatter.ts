import * as fs from 'fs';
import * as path from 'path';
import { SdetHlsResponse } from '../types';

export function formatHlsMessage(ticketId: string, requirementsAnalysis: any): string {
  const template = fs.readFileSync(path.join(process.cwd(), 'prompts', 'hls.txt'), 'utf-8');
  const reqs = requirementsAnalysis.requirements || [];
  const reqLines = reqs.map((r: any) => `  ${r.id}: ${r.text}`).join('\n');
  const formatted = template.replace('{requirements_analysis}', reqLines);
  return '<<<PASTE>>>' + formatted;
}

export function parseHlsResponse(rawResponse: string): SdetHlsResponse {
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(parsed.hls_list)) {
    throw new Error('Invalid response: hls_list array is missing');
  }

  return { hls_list: parsed.hls_list };
}
