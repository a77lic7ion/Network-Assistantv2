import React, { useMemo } from 'react';
import { Network, ArrowRightLeft, Shield, AlertTriangle } from 'lucide-react';

interface InterfaceInfo {
    name: string;
    status: 'Configured' | 'Unconfigured';
    mode: string;
    vlans: string;
}

interface InterfacesTabProps {
    config: string;
}

const InterfacesTab: React.FC<InterfacesTabProps> = ({ config }) => {
    // Parsing on demand per Rule 7
    const interfaces = useMemo(() => {
        const list: InterfaceInfo[] = [];
        const lines = config.split('\n');
        let currentInterface: Partial<InterfaceInfo> | null = null;

        lines.forEach(line => {
            const interfaceMatch = line.match(/^interface\s+(.+)$/i);
            if (interfaceMatch) {
                if (currentInterface && currentInterface.name) list.push(currentInterface as InterfaceInfo);
                currentInterface = {
                    name: interfaceMatch[1],
                    status: 'Configured',
                    mode: '—',
                    vlans: '—'
                };
            } else if (currentInterface) {
                const modeMatch = line.match(/^\s+switchport\s+mode\s+(.+)$/i);
                if (modeMatch) currentInterface.mode = modeMatch[1];

                const vlanMatch = line.match(/^\s+switchport\s+(?:access|trunk\s+allowed)\s+vlan\s+(.+)$/i);
                if (vlanMatch) currentInterface.vlans = vlanMatch[1];
            }
        });
        if (currentInterface && currentInterface.name) list.push(currentInterface as InterfaceInfo);

        return list;
    }, [config]);

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
            <div className="p-4 border-b border-node-border bg-node/20 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Dynamic Interface Registry</h3>
                <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Live Sync</span>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-node-border">
                            <th className="p-4 text-[10px] font-black uppercase tracking-tighter text-gray-500">Interface</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-tighter text-gray-500">Mode</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-tighter text-gray-500">VLANs</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-tighter text-gray-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-node-border">
                        {interfaces.length > 0 ? (
                            interfaces.map((intf, idx) => (
                                <tr key={idx} className="hover:bg-node/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-node-border text-cisco-blue group-hover:bg-cisco-blue group-hover:text-white transition-all">
                                                <ArrowRightLeft size={14} />
                                            </div>
                                            <span className="text-xs font-bold font-mono text-white">{intf.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${intf.mode.includes('trunk') ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                                            }`}>
                                            {intf.mode}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-mono text-gray-400">{intf.vlans}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                                            <span className="text-[10px] font-bold text-gray-300 uppercase">{intf.status}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-12 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <AlertTriangle size={32} className="text-gray-700" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No Logical Interfaces</p>
                                            <p className="text-[10px] text-gray-600 italic">Inject CLI configuration to populate this registry.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 flex items-center gap-3 bg-node/10 border-t border-node-border">
                <Shield size={16} className="text-gray-600" />
                <p className="text-[9px] text-gray-500 leading-relaxed uppercase tracking-tighter">
                    Interfaces are derived in real-time from the <span className="text-white font-bold">running-config</span>. Direct manipulation is restricted to CLI input.
                </p>
            </div>
        </div>
    );
};

export default InterfacesTab;
