import { AIRequest, AIResponse } from '../../types';
import { AIAdapter } from './aiGateway';

export class GeminiAdapter implements AIAdapter {
    private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    async generateResponse(request: AIRequest, apiKey: string): Promise<AIResponse> {
        const modelId = request.model || 'gemini-1.5-flash';
        const url = `${this.baseUrl}/${modelId}:generateContent?key=${apiKey}`;

        const body = {
            contents: [{
                parts: [{ text: request.prompt }]
            }],
            generationConfig: {
                temperature: request.temperature ?? 0.7,
                maxOutputTokens: request.maxTokens ?? 2048,
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return {
            content,
            usage: {
                promptTokens: 0, // Gemini v1beta doesn't always return usage in this format
                completionTokens: 0,
                totalTokens: 0
            }
        };
    }

    async fetchModels(apiKey: string): Promise<string[]> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) return ['gemini-1.5-pro', 'gemini-1.5-flash'];

        const data = await response.json();
        return data.models
            .filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
            .map((m: any) => m.name.replace('models/', ''));
    }
}
