import { AIRequest, AIResponse } from '../../types';
import { AIAdapter } from './aiGateway';

export class AnthropicAdapter implements AIAdapter {
    private baseUrl = 'https://api.anthropic.com/v1/messages';

    async generateResponse(request: AIRequest, apiKey: string): Promise<AIResponse> {
        const modelId = request.model || 'claude-3-5-sonnet-20240620';

        const body = {
            model: modelId,
            max_tokens: request.maxTokens ?? 2048,
            messages: [{ role: 'user', content: request.prompt }],
            temperature: request.temperature ?? 0.7,
        };

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'dangerously-allow-browser': 'true' // In a production app, this would be proxied through a backend
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.content?.[0]?.text || '';

        return {
            content,
            usage: {
                promptTokens: data.usage?.input_tokens || 0,
                completionTokens: data.usage?.output_tokens || 0,
                totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
            }
        };
    }

    async fetchModels(): Promise<string[]> {
        return [
            'claude-3-5-sonnet-20240620',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ];
    }
}
