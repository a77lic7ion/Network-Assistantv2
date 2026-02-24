import { ProviderType } from '../../types';
import { AIAdapter } from './aiGateway';
import { GeminiAdapter } from './GeminiAdapter';
import { OpenAIAdapter } from './OpenAIAdapter';
import { AnthropicAdapter } from './AnthropicAdapter';
import { MistralAdapter } from './MistralAdapter';
import { OllamaAdapter } from './OllamaAdapter';

export class AdapterFactory {
    private static adapters: Record<ProviderType, AIAdapter> = {
        gemini: new GeminiAdapter(),
        openai: new OpenAIAdapter(),
        anthropic: new AnthropicAdapter(),
        mistral: new MistralAdapter(),
        ollama: new OllamaAdapter(),
    };

    static getAdapter(provider: ProviderType): AIAdapter {
        const adapter = this.adapters[provider];
        if (!adapter) {
            throw new Error(`Unsupported AI provider: ${provider}`);
        }
        return adapter;
    }

    static async fetchAvailableModels(provider: ProviderType, apiKey: string): Promise<string[]> {
        try {
            const adapter = this.getAdapter(provider);
            if (adapter.fetchModels) {
                return await adapter.fetchModels(apiKey);
            }
            return [];
        } catch (error) {
            console.error(`Failed to fetch models for ${provider}:`, error);
            return [];
        }
    }
}
