import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProviderType } from '../types';

interface SettingsState {
    apiKeys: Record<ProviderType, string>;
    selectedModels: Record<ProviderType, string>;
    availableModels: Record<ProviderType, string[]>;
    activeProvider: ProviderType;
    providerStatus: Record<ProviderType, 'unconfigured' | 'testing' | 'ok' | 'error'>;
    tavilyApiKey: string;
    tavilyStatus: 'unconfigured' | 'testing' | 'ok' | 'error';
    debugMode: boolean;
    autoValidate: boolean;

    setApiKey: (provider: ProviderType, key: string) => void;
    setModel: (provider: ProviderType, model: string) => void;
    setActiveProvider: (provider: ProviderType) => void;
    setTavilyApiKey: (key: string) => void;
    setDebugMode: (enabled: boolean) => void;
    setAutoValidate: (enabled: boolean) => void;
    testConnection: (provider: ProviderType) => Promise<void>;
    testTavilyConnection: () => Promise<void>;
    fetchModels: (provider: ProviderType) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            apiKeys: {
                gemini: '',
                openai: '',
                anthropic: '',
                mistral: '',
                ollama: 'local', // Placeholder for Ollama as it doesn't need a key
            },
            selectedModels: {
                gemini: 'gemini-1.5-flash',
                openai: 'gpt-4o-mini',
                anthropic: 'claude-3-haiku-20240307',
                mistral: 'mistral-small-latest',
                ollama: 'llama3',
            },
            availableModels: {
                gemini: ['gemini-1.5-pro', 'gemini-1.5-flash'],
                openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
                anthropic: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
                mistral: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
                ollama: ['llama3', 'mistral', 'phi3'],
            },
            activeProvider: 'gemini',
            providerStatus: {
                gemini: 'unconfigured',
                openai: 'unconfigured',
                anthropic: 'unconfigured',
                mistral: 'unconfigured',
                ollama: 'unconfigured',
            },
            tavilyApiKey: '',
            tavilyStatus: 'unconfigured',
            debugMode: false,
            autoValidate: true,

            setApiKey: (provider, key) =>
                set((state) => ({
                    apiKeys: { ...state.apiKeys, [provider]: key },
                    providerStatus: { ...state.providerStatus, [provider]: key ? 'ok' : 'unconfigured' }
                })),

            setModel: (provider, model) =>
                set((state) => ({ selectedModels: { ...state.selectedModels, [provider]: model } })),

            setActiveProvider: (provider) => set({ activeProvider: provider }),

            setTavilyApiKey: (key) => set({ tavilyApiKey: key, tavilyStatus: key ? 'ok' : 'unconfigured' }),

            setDebugMode: (enabled) => set({ debugMode: enabled }),

            setAutoValidate: (enabled) => set({ autoValidate: enabled }),

            fetchModels: async (provider) => {
                const key = get().apiKeys[provider];
                if (!key && provider !== 'ollama') return;

                try {
                    const { AdapterFactory } = await import('../lib/ai/AdapterFactory');
                    const models = await AdapterFactory.fetchAvailableModels(provider, key);
                    if (models.length > 0) {
                        set((state) => ({
                            availableModels: { ...state.availableModels, [provider]: models }
                        }));
                    }
                } catch (error) {
                    console.error(`Failed to fetch models for ${provider}:`, error);
                }
            },

            testConnection: async (provider) => {
                const key = get().apiKeys[provider];
                if (!key && provider !== 'ollama') return;

                set((state) => ({
                    providerStatus: { ...state.providerStatus, [provider]: 'testing' }
                }));

                try {
                    const { AIGateway } = await import('../lib/ai/aiGateway');
                    await AIGateway.callAI({ prompt: 'Hello, are you online? Respond with only "OK".' });

                    set((state) => ({
                        providerStatus: { ...state.providerStatus, [provider]: 'ok' }
                    }));
                } catch (error) {
                    set((state) => ({
                        providerStatus: { ...state.providerStatus, [provider]: 'error' }
                    }));
                    throw error;
                }
            },

            testTavilyConnection: async () => {
                const key = get().tavilyApiKey;
                if (!key) return;

                set({ tavilyStatus: 'testing' });

                try {
                    const { TavilySearch } = await import('../lib/ai/TavilySearch');
                    await TavilySearch.search('test connection', key);

                    set({ tavilyStatus: 'ok' });
                } catch (error) {
                    set({ tavilyStatus: 'error' });
                    throw error;
                }
            },
        }),
        {
            name: 'netlab-settings-storage',
        }
    )
);
