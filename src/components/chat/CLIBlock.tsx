import React, { useState, useEffect } from 'react';
import { Play, Check, Copy, AlertCircle, ShieldCheck, Search, Loader2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { ValidatorAgent } from '../../agents/validatorAgent';
import { ValidationResult } from '../../types';
import { toast } from 'sonner';

interface CLIBlockProps {
    section: string;
    commands: string;
    nodeId?: string;
}

const CLIBlock: React.FC<CLIBlockProps> = ({ section, commands, nodeId }) => {
    const [applied, setApplied] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const appendToRunningConfig = useNetworkStore((state) => state.appendToRunningConfig);
    const getDevice = useNetworkStore((state) => state.getDevice);
    const selectedNodeId = useNetworkStore((state) => state.selectedNodeId);
    const autoValidate = useSettingsStore((state) => state.autoValidate);

    const effectiveNodeId = nodeId || selectedNodeId;

    const handleValidate = async () => {
        const targetId = nodeId || selectedNodeId;
        if (!targetId) return;
        const device = getDevice(targetId);
        if (!device) return;

        setIsValidating(true);
        try {
            const result = await ValidatorAgent.validate(commands, device);
            setValidation(result);
        } catch (error: any) {
            console.error('Auto-validation failed');
        } finally {
            setIsValidating(false);
        }
    };

    useEffect(() => {
        if (autoValidate && !validation && !isValidating) {
            handleValidate();
        }
    }, [autoValidate, effectiveNodeId]);

    const handleApply = () => {
        // Use the explicitly passed nodeId (for embedded chat) or the globally selected one
        const targetId = nodeId || selectedNodeId;
        
        if (!targetId) {
            toast.error('No target node selected for this block.');
            return;
        }

        const device = getDevice(targetId);
        if (!device) return;

        // Prepend a marker for global configs if the user prompt was from Global Orchestrator
        const markedCommands = commands.split('\n').map(line => {
            if (line.trim() && !line.trim().startsWith('!') && !line.trim().startsWith('exit') && !line.trim().startsWith('end')) {
                return `${line} ! GLOBAL_CONFIG_APPLIED`;
            }
            return line;
        }).join('\n');

        appendToRunningConfig(targetId, markedCommands);
        setApplied(true);
        toast.success(`Applied to ${device.hostname}`);
        setTimeout(() => setApplied(false), 3000);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(commands);
        toast.success('Commands copied to clipboard');
    };

    return (
        <div className={`my-4 overflow-hidden rounded-xl border bg-black/60 shadow-lg animate-in fade-in slide-in-from-left-2 duration-300 ${validation?.valid === false ? 'border-red-500/50' : validation?.valid === true ? 'border-green-500/50' : 'border-node-border'}`}>
            <div className="flex items-center justify-between bg-node/40 p-3 border-b border-node-border">
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full shadow-[0_0_5px_rgba(27,160,215,0.8)] ${validation?.valid === false ? 'bg-red-500' : validation?.valid === true ? 'bg-green-500' : 'bg-cisco-blue'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{section}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="p-1.5 text-gray-500 hover:text-white transition-colors"
                        title="Copy to clipboard"
                    >
                        <Copy size={12} />
                    </button>

                    {effectiveNodeId && (
                        <button
                            onClick={handleValidate}
                            disabled={isValidating || !!validation}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-tight transition-all ${validation
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-node/50 text-gray-400 hover:text-white border border-node-border'
                                }`}
                        >
                            {isValidating ? <Loader2 size={10} className="animate-spin" /> : <ShieldCheck size={10} />}
                            {validation ? 'VALIDATED' : 'VALIDATE SYNTAX'}
                        </button>
                    )}

                    <button
                        onClick={handleApply}
                        disabled={applied}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-tight transition-all ${applied
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-cisco-blue text-white hover:opacity-90 shadow-[0_0_10px_rgba(27,160,215,0.3)]'
                            }`}
                    >
                        {applied ? <Check size={10} /> : <Play size={10} />}
                        {applied ? 'APPLIED' : 'APPLY TO NODE'}
                    </button>
                </div>
            </div>

            <div className="relative group">
                <SyntaxHighlighter
                    language="bash"
                    style={atomDark}
                    customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '11px',
                        backgroundColor: 'transparent',
                    }}
                >
                    {commands}
                </SyntaxHighlighter>
            </div>

            {validation?.issues && validation.issues.length > 0 && (
                <div className="bg-red-500/5 p-4 border-t border-red-500/10 space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-red-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500">Syntax Analysis Found Issues</h4>
                    </div>
                    <div className="space-y-2">
                        {validation.issues.map((issue, idx) => (
                            <div key={idx} className="bg-black/40 rounded-lg p-3 border border-red-500/20 text-[10px]">
                                <p className="text-gray-400 font-mono mb-1 leading-tight"><span className="text-red-500 font-bold uppercase mr-2">Issue:</span>{issue.issue}</p>
                                {issue.fix && (
                                    <p className="text-green-500 font-mono"><span className="text-gray-600 font-bold uppercase mr-2">Fix:</span>{issue.fix}</p>
                                )}
                            </div>
                        ))}
                    </div>
                    {validation.softwareNotes && (
                        <div className="flex items-start gap-2 pt-2 border-t border-red-500/10">
                            <Search size={10} className="text-cisco-blue mt-0.5" />
                            <p className="text-[9px] text-gray-500 italic">Version Insight: {validation.softwareNotes}</p>
                        </div>
                    )}
                </div>
            )}

            {!effectiveNodeId && (
                <div className="bg-red-500/5 p-2 flex items-center gap-2 border-t border-red-500/10">
                    <AlertCircle size={10} className="text-red-500" />
                    <span className="text-[8px] font-bold text-red-500 uppercase tracking-tighter">Warning: Select a device in topology to enable Apply</span>
                </div>
            )}
        </div>
    );
};

export default CLIBlock;
