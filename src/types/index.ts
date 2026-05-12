export interface ReviewRequest {
  taskId: string;
  userStory: string;
  requirements: string;
  formattedMessage: string;
}

export interface ReviewResponse {
  taskId: string;
  rawResponse: string;
  analysis: string;
  priority: string;
  approved: boolean;
  comments: string;
  receivedAt: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}