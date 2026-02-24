import { AIRequest, AIResponse } from '../../types';
import { AIAdapter } from './aiGateway';

export class OpenAIAdapter implements AIAdapter {
    private baseUrl = 'https://api.openai.com/v1';

    async generateResponse(request: AIRequest, apiKey: string): Promise<AIResponse> {
        const modelId = request.model || 'gpt-4o';
        const url = `${this.baseUrl}/chat/completions`;

        const body = {
            model: modelId,
            messages: [{ role: 'user', content: request.prompt }],
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 2048,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        return {
            content,
            usage: {
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0
            }
        };
    }

    async fetchModels(apiKey: string): Promise<string[]> {
        const url = `${this.baseUrl}/models`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!response.ok) return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];

        const data = await response.json();
        return data.data
            .filter((m: any) => m.id.startsWith('gpt-'))
            .map((m: any) => m.id);
    }
}
