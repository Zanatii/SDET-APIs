import { Router, Request, Response } from 'express';
import { PlaywrightService } from '../automation/playwright.service';
import { formatInputMessage } from '../formatters/input.formatter';
import { formatOutputResponse } from '../formatters/output.formatter';
import { ReviewRequest, ServiceResponse, ReviewResponse } from '../types';

const router = Router();
const playwrightService = new PlaywrightService();

router.post('/review', async (req: Request, res: Response) => {
  const request: ReviewRequest = req.body;

  if (!request.taskId || !request.userStory || !request.requirements) {
    return res.status(400).json({
      success: false,
      error: 'taskId, userStory and requirements are required'
    } as ServiceResponse<null>);
  }

  try {
    // Format the message
    const formattedMessage = formatInputMessage(request);

    // Initialize browser and send message
    await playwrightService.initialize();
    await playwrightService.sendMessage(formattedMessage, parseInt(process.env.TAB_COUNT || '3'));

    // Wait for tester response
    const rawResponse = await playwrightService.waitForResponse(formattedMessage);

    // Format the response
    const structured = formatOutputResponse(request.taskId, rawResponse);

    await playwrightService.close();

    return res.status(200).json({
      success: true,
      data: structured
    } as ServiceResponse<ReviewResponse>);

  } catch (error: any) {
    await playwrightService.close();
    return res.status(500).json({
      success: false,
      error: error.message
    } as ServiceResponse<null>);
  }
});

export default router;