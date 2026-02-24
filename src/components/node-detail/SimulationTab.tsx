import React, { useState } from 'react';
import { DeviceNodeData } from '../../types';
import { Globe, HardDrive, Terminal } from 'lucide-react';
import { useNetworkStore } from '../../store/useNetworkStore';

interface SimulationTabProps {
    device: DeviceNodeData;
}

const SimulationTab: React.FC<SimulationTabProps> = ({ device }) => {
    const [pingTarget, setPingTarget] = useState('');
    const [sshUsername, setSshUsername] = useState('');
    const [sshPassword, setSshPassword] = useState('');
    const [simulationOutput, setSimulationOutput] = useState('');

    const allNodes = useNetworkStore((state) => state.nodes);

    const handlePingInternet = () => {
        setSimulationOutput(`Pinging 8.8.8.8 from ${device.hostname}...`);
        setTimeout(() => {
            const success = Math.random() > 0.2; // 80% chance of success
            if (success) {
                setSimulationOutput(`Ping to 8.8.8.8 from ${device.hostname} successful!
Reply from 8.8.8.8: bytes=32 time=15ms TTL=118
Reply from 8.8.8.8: bytes=32 time=12ms TTL=118
Reply from 8.8.8.8: bytes=32 time=18ms TTL=118
Reply from 8.8.8.8: bytes=32 time=14ms TTL=118

Ping statistics for 8.8.8.8:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 12ms, Maximum = 18ms, Average = 14ms`);
            } else {
                setSimulationOutput(`Ping to 8.8.8.8 from ${device.hostname} failed: Request timed out.`);
            }
        }, 2000);
    };

    const handlePingDevice = () => {
        setSimulationOutput(`Pinging ${pingTarget} from ${device.hostname}...`);
        const targetDevice = allNodes.find(
            (node) =>
                node.data.hostname.toLowerCase() === pingTarget.toLowerCase() ||
                node.data.managementIp === pingTarget
        );

        setTimeout(() => {
            if (targetDevice) {
                setSimulationOutput(`Ping to ${pingTarget} from ${device.hostname} successful!`);
            } else {
                setSimulationOutput(`Ping to ${pingTarget} from ${device.hostname} failed: Host unreachable.`);
            }
        }, 2000);
    };

    const handleSsh = () => {
        setSimulationOutput(`Attempting SSH to ${device.hostname} with user ${sshUsername}...`);
        setTimeout(() => {
            if (sshUsername === 'admin' && sshPassword === 'password') {
                setSimulationOutput(`SSH connection to ${device.hostname} successful!
Welcome to ${device.hostname}!
Last login: ${new Date().toLocaleString()} from 192.168.1.1
${device.hostname}> `);
            } else {
                setSimulationOutput(`SSH connection to ${device.hostname} failed: Permission denied.
Please check your username and password.`);
            }
        }, 3000);
    };

    return (
        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Ping Internet */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Globe size={16} className="text-cisco-blue" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">Ping Internet</h4>
                </div>
                <button
                    onClick={handlePingInternet}
                    className="w-full rounded-xl bg-cisco-blue px-4 py-3 text-sm font-bold text-white hover:bg-cisco-blue/80 transition-colors"
                >
                    Ping Internet
                </button>
            </div>

            {/* Ping Device */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <HardDrive size={16} className="text-cisco-blue" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">Ping Another Device</h4>
                </div>
                <input
                    type="text"
                    placeholder="Target IP or Hostname"
                    value={pingTarget}
                    onChange={(e) => setPingTarget(e.target.value)}
                    className="w-full rounded-xl border border-node-border bg-node/30 px-4 py-3 text-sm font-bold text-white transition-all focus:border-cisco-blue focus:outline-none focus:ring-1 focus:ring-cisco-blue/50"
                />
                <button
                    onClick={handlePingDevice}
                    className="w-full rounded-xl bg-cisco-blue px-4 py-3 text-sm font-bold text-white hover:bg-cisco-blue/80 transition-colors"
                >
                    Ping Device
                </button>
            </div>

            {/* SSH Device */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-cisco-blue" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">SSH into Device</h4>
                </div>
                <input
                    type="text"
                    placeholder="Username"
                    value={sshUsername}
                    onChange={(e) => setSshUsername(e.target.value)}
                    className="w-full rounded-xl border border-node-border bg-node/30 px-4 py-3 text-sm font-bold text-white transition-all focus:border-cisco-blue focus:outline-none focus:ring-1 focus:ring-cisco-blue/50"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={sshPassword}
                    onChange={(e) => setSshPassword(e.target.value)}
                    className="w-full rounded-xl border border-node-border bg-node/30 px-4 py-3 text-sm font-bold text-white transition-all focus:border-cisco-blue focus:outline-none focus:ring-1 focus:ring-cisco-blue/50"
                />
                <button
                    onClick={handleSsh}
                    className="w-full rounded-xl bg-cisco-blue px-4 py-3 text-sm font-bold text-white hover:bg-cisco-blue/80 transition-colors"
                >
                    SSH
                </button>
            </div>

            {/* Simulation Output */}
            {simulationOutput && (
                <div className="mt-4 rounded-xl border border-node-border bg-[#0d1117] p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase text-gray-600">Simulation Output</span>
                    </div>
                    <pre className="text-[10px] text-gray-400 font-mono whitespace-pre-wrap overflow-auto bg-black/30 p-2 rounded">
                        {simulationOutput}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default SimulationTab;
