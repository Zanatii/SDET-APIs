import { Router, Request, Response } from 'express';
import { PlaywrightService } from '../automation/playwright.service';
import { formatAnalyzeMessage, parseAnalyzeResponse } from '../formatters/sdet.formatter';
import { formatHlsMessage, parseHlsResponse } from '../formatters/sdet-hls.formatter';
import { formatTcsMessage, parseTcsResponse } from '../formatters/sdet-tcs.formatter';
import { SdetAnalyzeRequest, SdetAnalyzeResponse, SdetHlsRequest, SdetHlsResponse, SdetTcsRequest, SdetTcsResponse, ServiceResponse } from '../types';

const router = Router();

router.post('/analyze', async (req: Request, res: Response) => {
  const { ticket_id, ticket_data }: SdetAnalyzeRequest = req.body;

  if (!ticket_id || !ticket_data) {
    return res.status(400).json({
      success: false,
      error: 'ticket_id and ticket_data are required'
    } as ServiceResponse<null>);
  }

  const playwrightService = new PlaywrightService();

  try {
    const formattedMessage = formatAnalyzeMessage(ticket_id, ticket_data);

    await playwrightService.initialize();
    await playwrightService.sendMessage(formattedMessage, parseInt(process.env.TAB_COUNT || '3'));

    const rawResponse = await playwrightService.waitForResponse(formattedMessage);

    const structured = parseAnalyzeResponse(rawResponse);

    await playwrightService.deleteCurrentChat();
    await playwrightService.close();

    return res.status(200).json({
      success: true,
      data: structured
    } as ServiceResponse<SdetAnalyzeResponse>);

  } catch (error: any) {
    console.error('[SDET Analyze Error]', error.message);
    await playwrightService.close();
    return res.status(500).json({
      success: false,
      error: error.message
    } as ServiceResponse<null>);
  }
});

router.post('/hls', async (req: Request, res: Response) => {
  const { ticket_id, requirements_analysis }: SdetHlsRequest = req.body;

  if (!ticket_id || !requirements_analysis) {
    return res.status(400).json({
      success: false,
      error: 'ticket_id and requirements_analysis are required'
    } as ServiceResponse<null>);
  }

  const playwrightService = new PlaywrightService();

  try {
    const formattedMessage = formatHlsMessage(ticket_id, requirements_analysis);

    await playwrightService.initialize();
    await playwrightService.sendMessage(formattedMessage, parseInt(process.env.TAB_COUNT || '3'));

    const rawResponse = await playwrightService.waitForResponse(formattedMessage);

    const structured = parseHlsResponse(rawResponse);

    await playwrightService.deleteCurrentChat();
    await playwrightService.close();

    return res.status(200).json({
      success: true,
      data: structured
    } as ServiceResponse<SdetHlsResponse>);

  } catch (error: any) {
    console.error('[SDET HLS Error]', error.message);
    await playwrightService.close();
    return res.status(500).json({
      success: false,
      error: error.message
    } as ServiceResponse<null>);
  }
});

router.post('/tcs', async (req: Request, res: Response) => {
  const { ticket_id, requirements_analysis, hls_list }: SdetTcsRequest = req.body;

  if (!ticket_id || !requirements_analysis || !hls_list) {
    return res.status(400).json({
      success: false,
      error: 'ticket_id, requirements_analysis, and hls_list are required'
    } as ServiceResponse<null>);
  }

  const playwrightService = new PlaywrightService();

  try {
    const formattedMessage = formatTcsMessage(ticket_id, requirements_analysis, hls_list);

    await playwrightService.initialize();
    await playwrightService.sendMessage(formattedMessage, parseInt(process.env.TAB_COUNT || '3'));

    const rawResponse = await playwrightService.waitForResponse(formattedMessage);

    const structured = parseTcsResponse(rawResponse);

    await playwrightService.deleteCurrentChat();
    await playwrightService.close();

    return res.status(200).json({
      success: true,
      data: structured
    } as ServiceResponse<SdetTcsResponse>);

  } catch (error: any) {
    console.error('[SDET TCS Error]', error.message);
    await playwrightService.close();
    return res.status(500).json({
      success: false,
      error: error.message
    } as ServiceResponse<null>);
  }
});

export default router;
