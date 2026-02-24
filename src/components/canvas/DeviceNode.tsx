import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Network, Cpu, Server, Router, Wifi, CheckCircle2, AlertCircle, Globe, Hash, Shield, Zap, Cable, Gauge, Fingerprint, Key } from 'lucide-react';
import { DeviceNodeData } from '../../types';

const DeviceNode = ({ data, selected }: NodeProps<DeviceNodeData>) => {
    const Icon = {
        switch: Network,
        router: Router,
        firewall: Cpu,
        ap: Wifi,
        server: Server,
    }[data.deviceType] || Network;

    const statusColor = {
        OK: 'text-green-500',
        WARNING: 'text-yellow-500',
        ERROR: 'text-red-500',
        OFFLINE: 'text-gray-500',
    }[data.status || 'OK'];

    return (
        <div className={`relative min-w-[320px] rounded-[24px] border-2 bg-[#1e2433] p-6 transition-all ${selected ? 'border-[#f5a623] shadow-[0_0_20px_rgba(245,166,35,0.2)]' : 'border-[#2a3347] hover:border-gray-600'
            } ${data.isCore ? 'border-[#f5a623]' : ''}`}>

            {/* Handles */}
            <Handle type="target" position={Position.Top} id="top-target" className="!bg-[#f5a623] !h-2 !w-2 hover:!h-3 hover:!w-3 transition-all" />
            <Handle type="source" position={Position.Top} id="top-source" className="!bg-[#f5a623] !h-2 !w-2 hover:!h-3 hover:!w-3 transition-all" />
            
            <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-[#f5a623] !h-2 !w-2 hover:!h-3 hover:!w-3 transition-all" />
            <Handle type="source" position={Position.Bottom} id="bottom-source" className="!bg-[#f5a623] !h-2 !w-2 hover:!h-3 hover:!w-3 transition-all" />
            
            <Handle type="target" position={Position.Left} id="left-target" className="!bg-[#f5a623] !h-2 !w-2 hover:!h-3 hover:!w-3 transition-all" />
            <Handle type="source" position={Position.Left} id="left-source" className="!bg-[#f5a623] !h-2 !w-2 hover:!h-3 hover:!w-3 transition-all" />
            
            <Handle type="target" position={Position.Right} id="right-target" className="!bg-[#f5a623] !h-2 !w-2 hover:!h-3 hover:!w-3 transition-all" />
            <Handle type="source" position={Position.Right} id="right-source" className="!bg-[#f5a623] !h-2 !w-2 hover:!h-3 hover:!w-3 transition-all" />

            {/* CORE Badge */}
            {data.isCore && (
                <div className="absolute -top-3 right-6 flex h-6 items-center gap-1 rounded-full bg-[#f5a623] px-3 py-0.5 text-[10px] font-black uppercase text-black italic">
                    <Zap size={10} fill="currentColor" /> CORE
                </div>
            )}

            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5a623] text-black">
                    <Icon size={32} />
                </div>
                <div className="overflow-hidden">
                    <h3 className="truncate text-2xl font-black uppercase tracking-tight text-white">{data.hostname}</h3>
                    <p className="truncate text-xs font-bold uppercase tracking-widest text-gray-500">{data.vendor} {data.deviceModel || 'UNKNOWN'}</p>
                </div>
            </div>

            {/* Info Rows */}
            <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-gray-500">
                        <Cpu size={14} />
                        <span className="font-medium">Software Version:</span>
                    </div>
                    <span className="font-bold text-gray-200">{data.softwareVersion || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-gray-500">
                        <Globe size={14} />
                        <span className="font-medium">IP Address:</span>
                    </div>
                    <span className="font-bold text-gray-200">{data.managementIp || '0.0.0.0'}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-gray-500">
                        <Server size={14} />
                        <span className="font-medium">MAC Address:</span>
                    </div>
                    <span className="font-bold text-gray-200 uppercase">{data.macAddress || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-gray-500">
                        <Key size={14} />
                        <span className="font-medium">Serial Number:</span>
                    </div>
                    <span className="font-bold text-gray-200 uppercase">{data.serialNumber || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-gray-500">
                        <Zap size={14} />
                        <span className="font-medium">Status:</span>
                    </div>
                    <span className={`font-black uppercase tracking-widest ${statusColor}`}>{data.status || 'OK'}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-gray-500">
                        <CheckCircle2 size={14} />
                        <span className="font-medium">Configured:</span>
                    </div>
                    <span className={`font-bold ${data.runningConfig ? 'text-green-500' : 'text-gray-600'}`}>
                        {data.runningConfig ? `YES (${data.configuredDate || '2024-05-20'})` : 'NO'}
                    </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-gray-500">
                        <Cable size={14} />
                        <span className="font-medium">Port Connected:</span>
                    </div>
                    <span className="font-bold text-gray-200">{data.primaryPort || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-gray-500">
                        <Gauge size={14} />
                        <span className="font-medium">Port Speed:</span>
                    </div>
                    <span className="font-bold text-gray-200">{data.portSpeed || 'N/A'}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between border-t border-[#2a3347] pt-4">
                <div className="rounded-lg bg-[#0d1117] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 border border-[#2a3347]">
                    BLK: {data.configBlockCount}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Active Interfaces: <span className="text-white ml-1">{data.activeInterfacesCount || 0}</span>
                </div>
            </div>
        </div>
    );
};

export default memo(DeviceNode);
