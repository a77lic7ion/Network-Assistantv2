import { AIRequest, AIResponse } from '../../types';

export interface AIAdapter {
    generateResponse: (request: AIRequest, apiKey: string) => Promise<AIResponse>;
    fetchModels?: (apiKey: string) => Promise<string[]>;
}

// ... specific adapters will follow in separate files for cleanliness
// For now, let's create the gateway that uses the SettingsStore

import { useSettingsStore } from '../../store/useSettingsStore';
import { AdapterFactory } from './AdapterFactory';

export class AIGateway {
    static async callAI(request: AIRequest): Promise<string> {
        const settings = useSettingsStore.getState();
        const provider = settings.activeProvider;
        const apiKey = settings.apiKeys[provider];
        const model = settings.selectedModels[provider] || request.model;

        if (!apiKey && provider !== 'ollama') {
            throw new Error(`API Key for ${provider} is missing. Please configure it in settings.`);
        }

        try {
            const adapter = AdapterFactory.getAdapter(provider);
            const response = await adapter.generateResponse({ ...request, model }, apiKey);

            // Rule 4: Add usage tracking / logging if needed (Phase 5)
            console.log(`AI Success (${provider}):`, response.usage);

            return response.content;
        } catch (error: any) {
            console.error(`AI call failed (${provider}):`, error.message);
            throw error;
        }
    }
}
