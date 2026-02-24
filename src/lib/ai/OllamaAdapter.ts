import { AIRequest, AIResponse } from '../../types';
import { AIAdapter } from './aiGateway';

export class OllamaAdapter implements AIAdapter {
    private baseUrl = 'http://localhost:11434/api';

    async generateResponse(request: AIRequest, _apiKey: string): Promise<AIResponse> {
        const modelId = request.model || 'llama3';
        const url = `${this.baseUrl}/chat`;

        const body = {
            model: modelId,
            messages: [{ role: 'user', content: request.prompt }],
            stream: false,
            options: {
                temperature: request.temperature ?? 0.7,
                num_predict: request.maxTokens ?? 2048,
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`Ollama error: ${response.status}. Ensure Ollama is running with OLLAMA_ORIGINS="*"`);
            }

            const data = await response.json();
            const content = data.message?.content || '';

            return {
                content,
                usage: {
                    promptTokens: data.prompt_eval_count || 0,
                    completionTokens: data.eval_count || 0,
                    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                }
            };
        } catch (error: any) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Could not connect to Ollama. Ensure it is running locally and OLLAMA_ORIGINS="*" is set.');
            }
            throw error;
        }
    }

    async fetchModels(): Promise<string[]> {
        try {
            const url = `${this.baseUrl}/tags`;
            const response = await fetch(url);
            if (!response.ok) return ['llama3', 'mistral', 'codellama'];

            const data = await response.json();
            return data.models.map((m: any) => m.name);
        } catch (e) {
            return ['llama3', 'mistral', 'codellama', 'phi3'];
        }
    }
}
