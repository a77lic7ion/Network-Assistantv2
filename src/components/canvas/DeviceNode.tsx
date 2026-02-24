import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Network, Cpu, Server, Router, Wifi, CheckCircle2, AlertCircle } from 'lucide-react';
import { DeviceNodeData } from '../../types';

const DeviceNode = ({ data, selected }: NodeProps<DeviceNodeData>) => {
    const Icon = {
        switch: Network,
        router: Router,
        firewall: Cpu, // Simplified icon choice
        ap: Wifi,
        server: Server,
    }[data.deviceType] || Network;

    return (
        <div className={`relative min-w-[200px] rounded-lg border-2 bg-node p-4 transition-all ${selected ? 'border-cisco-blue shadow-[0_0_15px_rgba(27,160,215,0.3)]' : 'border-node-border hover:border-gray-600'
            } ${data.isCore ? 'ring-2 ring-core-accent/20' : ''}`}>

            {/* Handles */}
            <Handle type="target" position={Position.Top} className="!bg-cisco-blue !h-2 !w-2" />
            <Handle type="source" position={Position.Bottom} className="!bg-cisco-blue !h-2 !w-2" />
            <Handle type="target" position={Position.Left} className="!bg-cisco-blue !h-2 !w-2" />
            <Handle type="source" position={Position.Right} className="!bg-cisco-blue !h-2 !w-2" />

            {/* CORE Badge */}
            {data.isCore && (
                <div className="absolute -top-3 -right-3 flex h-6 items-center gap-1 rounded-full bg-core-accent px-2 py-0.5 text-[10px] font-black uppercase text-black italic">
                    <Zap size={10} fill="currentColor" /> CORE
                </div>
            )}

            {/* Header */}
            <div className="mb-2 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${data.isCore ? 'bg-core-accent text-black' : 'bg-node-border text-cisco-blue'}`}>
                    <Icon size={24} />
                </div>
                <div className="overflow-hidden">
                    <h3 className="truncate font-bold text-white">{data.hostname}</h3>
                    <p className="truncate text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{data.vendor} {data.deviceModel}</p>
                </div>
            </div>

            {/* Info Rows */}
            <div className="space-y-1.5 border-t border-node-border pt-2">
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Software</span>
                    <span className="font-mono text-gray-300">{data.softwareVersion || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">IP Addr</span>
                    <span className="font-mono text-cisco-blue">{data.managementIp || '0.0.0.0'}</span>
                </div>
            </div>

            {/* Status Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-node-border pt-2">
                <div className="flex items-center gap-1.5">
                    {data.runningConfig ? (
                        <>
                            <CheckCircle2 size={12} className="text-green-500" />
                            <span className="text-[10px] font-bold text-green-500 uppercase">Configured</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={12} className="text-gray-600" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Unconfigured</span>
                        </>
                    )}
                </div>
                <div className="rounded bg-node-border px-1.5 py-0.5 text-[9px] font-mono text-gray-400">
                    BLK: {data.configBlockCount}
                </div>
            </div>
        </div>
    );
};

// Simple Zap icon component since I forgot to import it
const Zap = ({ size, fill }: { size: number; fill: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

export default memo(DeviceNode);
