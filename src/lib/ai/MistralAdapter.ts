import { AIRequest, AIResponse } from '../../types';
import { AIAdapter } from './aiGateway';

export class MistralAdapter implements AIAdapter {
    private baseUrl = 'https://api.mistral.ai/v1';

    async generateResponse(request: AIRequest, apiKey: string): Promise<AIResponse> {
        const modelId = request.model || 'mistral-large-latest';
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
            throw new Error(errorData.error?.message || `Mistral API error: ${response.status}`);
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
        if (!response.ok) return ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'open-mixtral-8x22b'];

        const data = await response.json();
        return data.data
            .map((m: any) => m.id);
    }
}
