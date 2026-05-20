import * as fs from 'fs';
import * as path from 'path';
import { TicketData, SdetAnalyzeResponse, RequirementsAnalysis } from '../types';

export function formatAnalyzeMessage(ticketId: string, ticket: TicketData): string {
  const template = fs.readFileSync(path.join(process.cwd(), 'prompts', 'analyze.txt'), 'utf-8');

  const ticketData = `Title: ${ticket.summary}
Type: ${ticket.type}
Priority: ${ticket.priority}

Table Content:
${ticket.acceptance_criteria}

Description:
${ticket.description}`;

  return '<<<PASTE>>>' + template.replace('{ticket_data}', ticketData);
}

export function parseAnalyzeResponse(rawResponse: string): SdetAnalyzeResponse {
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const parsed: RequirementsAnalysis = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(parsed.requirements)) {
    throw new Error('Invalid response: requirements array is missing');
  }

  const lines: string[] = [];

  lines.push('## Requirements\n');
  for (const req of parsed.requirements) {
    lines.push(`- **${req.id}** [${req.type}] *(${req.source})*: ${req.text}`);
  }

  if (parsed.ambiguities?.length) {
    lines.push('\n## Ambiguities\n');
    for (const amb of parsed.ambiguities) {
      lines.push(`- **${amb.id}** *(${amb.location})*: ${amb.description}`);
    }
  }

  if (parsed.contradictions?.length) {
    lines.push('\n## Contradictions\n');
    for (const con of parsed.contradictions) {
      lines.push(`- **${con.id}**: ${con.description}`);
    }
  }

  if (parsed.assumptions?.length) {
    lines.push('\n## Assumptions\n');
    for (const ass of parsed.assumptions) {
      lines.push(`- **${ass.id}**: ${ass.description}`);
    }
  }

  return {
    requirements_analysis: parsed,
    requirements: lines.join('\n')
  };
}
