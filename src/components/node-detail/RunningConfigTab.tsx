import React, { useState } from 'react';
import { Copy, Check, Trash2, Terminal } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';

interface RunningConfigTabProps {
    config: string;
    onClear: () => void;
    hostname: string;
}

const RunningConfigTab: React.FC<RunningConfigTabProps> = ({ config, onClear, hostname }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(config);
        setCopied(true);
        toast.success('Configuration copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const formattedConfig = config || `! No configuration blocks applied yet.\n! Hostname: ${hostname}\n! Use the chat to generate CLI instructions.`;

    return (
        <div className="flex h-full flex-col bg-[#0d1117]">
            <div className="flex items-center justify-between border-b border-node-border bg-background p-3">
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-cisco-blue" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">running-config</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 rounded bg-node-border px-2 py-1 text-[10px] font-bold uppercase text-white hover:bg-gray-700 transition-colors"
                    >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? 'Copied' : 'Copy All'}
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to clear the entire running config?')) {
                                onClear();
                            }
                        }}
                        className="flex items-center gap-1.5 rounded bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                        <Trash2 size={12} />
                        Clear
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <SyntaxHighlighter
                    language="bash" // No specific cisco highlighter in default prism, bash works well
                    style={atomDark}
                    customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        fontSize: '11px',
                        backgroundColor: 'transparent',
                        height: '100%',
                        overflow: 'auto',
                    }}
                >
                    {formattedConfig}
                </SyntaxHighlighter>
            </div>

            <div className="border-t border-node-border bg-background p-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600">
                    CLI_SEC_COUNT: {config.split('!').length - 1} | SYNC_STATE: VALIDATED
                </p>
            </div>
        </div>
    );
};

export default RunningConfigTab;
