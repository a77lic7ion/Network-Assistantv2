import React, { useState } from 'react';
import { Copy, Check, Trash2, Terminal } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';
import { useNetworkStore } from '../../store/useNetworkStore';

interface RunningConfigTabProps {
    config: string;
    onClear: () => void;
    hostname: string;
    nodeId: string;
}

const RunningConfigTab: React.FC<RunningConfigTabProps> = ({ config, onClear, hostname, nodeId }) => {
    const [copied, setCopied] = useState(false);
    const device = useNetworkStore((state) => state.nodes.find(n => n.id === nodeId)?.data);

    const handleCopy = () => {
        navigator.clipboard.writeText(config);
        setCopied(true);
        toast.success('Configuration copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const renderConfig = () => {
        if (!config) {
            return (
                <div className="p-6 font-mono text-[11px] text-gray-500 italic">
                    ! No configuration blocks applied yet.<br />
                    ! Hostname: {hostname}<br />
                    ! Use the AI Config tab to generate CLI instructions.
                </div>
            );
        }

        // Split config into lines and identify types for highlighting
        const lines = config.split('\n');
        const originalLines = (device?.blankConfigContext || '').split('\n');
        
        return (
            <pre className="m-0 p-6 font-mono text-[11px] leading-relaxed overflow-auto h-full bg-[#0d1117]">
                {lines.map((line, i) => {
                    let color = 'text-gray-300'; // Default: white/gray
                    const trimmedLine = line.trim();
                    
                    if (trimmedLine.startsWith('!')) {
                        color = 'text-gray-600 italic';
                    } else if (line.includes('GLOBAL_CONFIG_APPLIED')) {
                        color = 'text-yellow-400 font-bold'; // Global: Yellow
                    } else if (!originalLines.includes(line)) {
                        color = 'text-blue-400 font-bold'; // Added: Blue
                    } else if (originalLines.some(ol => ol.includes(trimmedLine) && ol !== line)) {
                        color = 'text-green-400'; // Diff: Green
                    }

                    return (
                        <div key={i} className={`${color} min-h-[1.2em]`}>
                            {line || ' '}
                        </div>
                    );
                })}
            </pre>
        );
    };

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

            <div className="flex-1 overflow-hidden custom-scrollbar">
                {renderConfig()}
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
