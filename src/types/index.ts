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

export interface TicketData {
  summary: string;
  description: string;
  acceptance_criteria: string;
  type: string;
  priority: string;
}

export interface SdetAnalyzeRequest {
  ticket_id: string;
  ticket_data: TicketData;
}

export interface REQItem {
  id: string;
  text: string;
  source: string;
  type: string;
}

export interface AmbiguityItem {
  id: string;
  description: string;
  location: string;
}

export interface SimpleItem {
  id: string;
  description: string;
}

export interface RequirementsAnalysis {
  requirements: REQItem[];
  ambiguities: AmbiguityItem[];
  contradictions: SimpleItem[];
  assumptions: SimpleItem[];
}

export interface SdetAnalyzeResponse {
  requirements_analysis: RequirementsAnalysis;
  requirements: string;
}

export interface HLSItem {
  id: string;
  title: string;
  description: string;
  linked_requirements: string[];
  type: string;
}

export interface SdetHlsRequest {
  ticket_id: string;
  requirements_analysis: any;
}

export interface SdetHlsResponse {
  hls_list: HLSItem[];
}

export interface TCStep {
  action: string;
  expected: string;
}

export interface TCItem {
  id: string;
  hls_id: string;
  linked_requirements: string[];
  title: string;
  preconditions: string[];
  steps: TCStep[];
  priority: string;
  type: string;
  test_type: string;
}

export interface SdetTcsRequest {
  ticket_id: string;
  requirements_analysis: any;
  hls_list: any[];
}

export interface SdetTcsResponse {
  tc_list: TCItem[];
}
