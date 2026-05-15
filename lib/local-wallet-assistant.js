import { generateLocalAssistantResponse } from "./wallet-copilot";

export function generateLocalAssistantAnswer({ question, context }) {
  return generateLocalAssistantResponse({ question, context }).answer;
}
