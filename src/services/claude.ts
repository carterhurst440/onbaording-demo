import Anthropic from '@anthropic-ai/sdk';
import type { OrgProfile } from '../types';
import { SYSTEM_PROMPT } from '../constants';

const UPDATE_PROFILE_TOOL: Anthropic.Tool = {
  name: 'update_org_profile',
  description:
    'Update the organization profile with any newly gathered information. Call this tool immediately whenever you learn any org detail from the conversation — even partial info like just a company name.',
  input_schema: {
    type: 'object' as const,
    properties: {
      companyName: {
        type: 'string',
        description: 'The legal name of the company',
      },
      entityType: {
        type: 'string',
        description:
          'Business entity type (LLC, S-Corp, C-Corp, Sole Proprietor, Partnership, Non-Profit, Other)',
      },
      industry: {
        type: 'string',
        description: 'The industry or sector the company operates in',
      },
      totalEmployees: {
        type: 'string',
        description: 'Total number of employees (as a string, e.g. "42" or "~50")',
      },
      youngestEmployeeAge: {
        type: 'string',
        description: 'Age of the youngest employee (as a string, e.g. "17")',
      },
      operatingYears: {
        type: 'string',
        description: 'How many years the company has been operating (e.g. "5" or "5 years")',
      },
      ptoHandling: {
        type: 'string',
        enum: ['set_amount', 'accrual', 'covers_sick'],
        description:
          'PTO policy: set_amount (fixed days/yr), accrual (time-based accrual), covers_sick (PTO covers sick leave)',
      },
      hrContactName: {
        type: 'string',
        description: 'HR contact full name',
      },
      hrContactEmail: {
        type: 'string',
        description: 'HR contact email address',
      },
      hrContactPhone: {
        type: 'string',
        description: 'HR contact phone number',
      },
      backupContactName: {
        type: 'string',
        description: 'Backup contact full name (for sensitive/harassment reports)',
      },
      backupContactEmail: {
        type: 'string',
        description: 'Backup contact email address',
      },
      backupContactPhone: {
        type: 'string',
        description: 'Backup contact phone number',
      },
      physicalLocations: {
        type: 'array',
        items: { type: 'string' },
        description:
          'List of US states or jurisdictions where the company has employees or offices',
      },
    },
  },
};

export type ConversationMessage = Anthropic.MessageParam;

let clientInstance: Anthropic | null = null;

function getClient(apiKey: string): Anthropic {
  if (!clientInstance) {
    clientInstance = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }
  return clientInstance;
}

export function resetClient() {
  clientInstance = null;
}

export interface SendMessageResult {
  text: string;
  profileUpdate: Partial<OrgProfile> | null;
  updatedHistory: ConversationMessage[];
}

export async function sendMessage(
  userText: string,
  history: ConversationMessage[],
  apiKey: string,
): Promise<SendMessageResult> {
  const client = getClient(apiKey);

  const newHistory: ConversationMessage[] = [
    ...history,
    { role: 'user', content: userText },
  ];

  // First API call
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [UPDATE_PROFILE_TOOL],
    messages: newHistory,
  });

  // Check for tool use
  const toolUseBlock = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
  );
  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === 'text',
  );

  if (toolUseBlock) {
    const profileUpdate = toolUseBlock.input as Partial<OrgProfile>;

    // Build history with the assistant's tool-use turn + tool result
    const historyWithTool: ConversationMessage[] = [
      ...newHistory,
      { role: 'assistant', content: response.content },
      {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: 'Profile updated successfully.',
          },
        ],
      },
    ];

    // Second API call to get the follow-up conversational response
    const finalResponse = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [UPDATE_PROFILE_TOOL],
      messages: historyWithTool,
    });

    const finalText =
      finalResponse.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('') || textBlock?.text || '';

    const finalHistory: ConversationMessage[] = [
      ...historyWithTool,
      { role: 'assistant', content: finalResponse.content },
    ];

    return { text: finalText, profileUpdate, updatedHistory: finalHistory };
  }

  // No tool use — pure text response
  const finalText = textBlock?.text || '';
  const finalHistory: ConversationMessage[] = [
    ...newHistory,
    { role: 'assistant', content: response.content },
  ];

  return { text: finalText, profileUpdate: null, updatedHistory: finalHistory };
}
