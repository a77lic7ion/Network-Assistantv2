import React, { useState } from 'react';
import { X, Shield, Key, Cpu, Search, CheckCircle2, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { ProviderType } from '../../types';
import { toast } from 'sonner';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const {
        apiKeys,
        selectedModels,
        availableModels,
        activeProvider,
        providerStatus,
        tavilyApiKey,
        setApiKey,
        setModel,
        setActiveProvider,
        setTavilyApiKey,
        testConnection,
        fetchModels
    } = useSettingsStore();

    const [testing, setTesting] = useState<Record<string, boolean>>({});

    if (!isOpen) return null;

    const handleTest = async (provider: ProviderType) => {
        setTesting({ ...testing, [provider]: true });
        try {
            await testConnection(provider);
            toast.success(`${provider.toUpperCase()} connection successful!`);
        } catch (error: any) {
            toast.error(`Connection failed: ${error.message}`);
        } finally {
            setTesting({ ...testing, [provider]: false });
        }
    };

    const handleRefreshModels = async (provider: ProviderType) => {
        toast.promise(fetchModels(provider), {
            loading: `Fetching models for ${provider}...`,
            success: 'Model list updated.',
            error: 'Failed to fetch models.'
        });
    };

    const providers: { id: ProviderType; name: string; icon: any }[] = [
        { id: 'gemini', name: 'Google Gemini', icon: Zap },
        { id: 'openai', name: 'OpenAI GPT', icon: Cpu },
        { id: 'anthropic', name: 'Anthropic Claude', icon: Shield },
        { id: 'mistral', name: 'Mistral AI', icon: RefreshCw },
        { id: 'ollama', name: 'Local Ollama', icon: TerminalIcon },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-node-border bg-background shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-node-border p-8 bg-node/20">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cisco-blue text-white shadow-[0_0_20px_rgba(27,160,215,0.4)]">
                            <Key size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tight">AI & Search Infrastructure</h2>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Configure Your Intelligence Layer</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-node hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                        {/* Left Column: API Providers */}
                        <div className="space-y-10">
                            <section>
                                <div className="flex items-center gap-2 mb-6 text-cisco-blue">
                                    <Shield size={18} />
                                    <h3 className="text-sm font-black uppercase tracking-widest">LLM GATEWAY PLUGINS</h3>
                                </div>

                                <div className="space-y-6">
                                    {providers.map((p) => (
                                        <div key={p.id} className={`rounded-2xl border p-5 transition-all ${activeProvider === p.id ? 'border-cisco-blue bg-cisco-blue/5' : 'border-node-border bg-node/20'}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <p className={`text-sm font-black uppercase italic ${activeProvider === p.id ? 'text-cisco-blue' : 'text-white'}`}>{p.name}</p>
                                                    {providerStatus[p.id] === 'ok' && <CheckCircle2 size={14} className="text-green-500" />}
                                                    {providerStatus[p.id] === 'error' && <AlertCircle size={14} className="text-red-500" />}
                                                </div>
                                                <button
                                                    onClick={() => setActiveProvider(p.id)}
                                                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${activeProvider === p.id
                                                            ? 'bg-cisco-blue border-cisco-blue text-white'
                                                            : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-white'
                                                        }`}
                                                >
                                                    {activeProvider === p.id ? 'ACTIVE' : 'SELECT'}
                                                </button>
                                            </div>

                                            {p.id !== 'ollama' ? (
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <input
                                                            type="password"
                                                            placeholder={`Enter ${p.name} API Key`}
                                                            value={apiKeys[p.id]}
                                                            onChange={(e) => setApiKey(p.id, e.target.value)}
                                                            className="w-full rounded-xl border border-node-border bg-black/40 px-4 py-2.5 text-xs text-white focus:border-cisco-blue focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="rounded-xl bg-black/40 p-4 border border-node-border">
                                                    <p className="text-[10px] text-gray-400 leading-relaxed italic">
                                                        Ollama is detected locally at <code className="text-cisco-blue">127.0.0.1:11434</code>.<br />
                                                        Ensure <code className="text-terminal-green uppercase">OLLAMA_ORIGINS="*"</code> is set.
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mt-4 flex items-center gap-4">
                                                <select
                                                    className="flex-1 rounded-lg border border-node-border bg-black/40 px-3 py-2 text-[10px] font-bold text-gray-300 focus:outline-none focus:border-cisco-blue"
                                                    value={selectedModels[p.id]}
                                                    onChange={(e) => setModel(p.id, e.target.value)}
                                                >
                                                    {availableModels[p.id].map(m => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => handleRefreshModels(p.id)}
                                                    className="p-2 rounded-lg bg-node-border text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                                <button
                                                    disabled={testing[p.id]}
                                                    onClick={() => handleTest(p.id)}
                                                    className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-tighter transition-all ${testing[p.id] ? 'bg-gray-700 text-gray-500 animate-pulse' : 'bg-cisco-blue text-white hover:opacity-90'
                                                        }`}
                                                >
                                                    {testing[p.id] ? 'TESTING...' : 'TEST'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Search & Config */}
                        <div className="space-y-10">
                            <section>
                                <div className="flex items-center gap-2 mb-6 text-green-500">
                                    <Search size={18} />
                                    <h3 className="text-sm font-black uppercase tracking-widest">WEB SEARCH INTEGRATION</h3>
                                </div>

                                <div className="rounded-2xl border border-node-border bg-node/20 p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                            <GlobeIcon size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase text-white">Tavily AI Search</h4>
                                            <p className="text-[9px] text-gray-500 font-medium uppercase tracking-[0.1em]">Real-time Network Documentation</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <input
                                            type="password"
                                            placeholder="Enter Tavily API Key"
                                            value={tavilyApiKey}
                                            onChange={(e) => setTavilyApiKey(e.target.value)}
                                            className="w-full rounded-xl border border-node-border bg-black/40 px-4 py-3 text-xs text-white focus:border-green-500 focus:outline-none"
                                        />
                                        <div className="rounded-xl bg-green-500/5 p-4 border border-green-500/20">
                                            <p className="text-[10px] text-gray-400 leading-relaxed italic">
                                                The <span className="text-white font-bold">Validator Agent</span> uses Tavily to find command syntax for unknown hardware models or new software versions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-6 text-orange-500">
                                    <Activity size={18} />
                                    <h3 className="text-sm font-black uppercase tracking-widest">SYSTEM PREFERENCES</h3>
                                </div>

                                <div className="rounded-2xl border border-node-border bg-node/20 p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-white uppercase">Debug Mode</p>
                                            <p className="text-[9px] text-gray-500 uppercase font-medium">Show AI raw thoughts in console</p>
                                        </div>
                                        <div className="h-6 w-12 rounded-full bg-node-border relative p-1 cursor-pointer">
                                            <div className="h-4 w-4 rounded-full bg-gray-500" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-white uppercase">Auto-Validate</p>
                                            <p className="text-[9px] text-gray-500 uppercase font-medium">Run syntax agent on every apply</p>
                                        </div>
                                        <div className="h-6 w-12 rounded-full bg-cisco-blue relative p-1 cursor-pointer flex justify-end">
                                            <div className="h-4 w-4 rounded-full bg-white" />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-node-border bg-node/50 p-6 flex items-center justify-between">
                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                        STORAGE: <span className="text-white">LOCAL_PERSISTENT</span> | ENCRYPTION: <span className="text-white">NONE (PLAINTEXT_BROWSER)</span>
                    </p>
                    <button
                        onClick={onClose}
                        className="rounded-xl bg-cisco-blue px-10 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_5px_15px_rgba(27,160,215,0.4)]"
                    >
                        Save & Exit
                    </button>
                </div>
            </div>
        </div>
    );
};

// Icons not available in standard lucide-react or need specific naming
const TerminalIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
    </svg>
);

const GlobeIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

const Activity = ({ size, className }: { size: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);

export default SettingsModal;
