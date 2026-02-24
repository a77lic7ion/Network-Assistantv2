/**
 * configTabParser.ts
 * Parses raw text from Cisco "show" command outputs (blank config tabs)
 * to extract hardware capabilities and interface inventory.
 */

export interface ParsedInterface {
    name: string;
    ipAddress?: string;
    mask?: string;
    description?: string;
    mode?: 'access' | 'trunk' | 'routed';
    vlan?: string; // For access VLAN or native VLAN on trunk
    allowedVlans?: string; // For trunk allowed VLANs
    cdpNeighbor?: {
        hostname: string;
        localPort: string;
    };
    // Potentially add more fields like speed, duplex, cdp neighbor, etc.
}

export interface ParsedConfigTab {
    hostname: string;
    managementIp: string;
    interfaces: ParsedInterface[]; // Changed to array of ParsedInterface
    vlanRange: string; // This might be less relevant now, but keeping for existing code
    hardwareModel: string;
    osVersion: string;
    raw: string;
}

export class ConfigTabParser {
    /**
     * Naive parser to extract context from a "show inventory", "show version", 
     * or "show interface status" dump.
     */
    static parse(text: string): ParsedConfigTab {
        let interfaces: ParsedInterface[] = [];
        let hardwareModel = '';
        let osVersion = '';
        let vlanRange = '';
        let hostname = '';
        let managementIp = '';

        const lines = text.split('\n');
        let currentInterface: ParsedInterface | null = null;

        lines.forEach(line => {
            // Hostname
            const hostnameMatch = line.match(/^hostname\s+(\S+)/i);
            if (hostnameMatch && !hostname) {
                hostname = hostnameMatch[1];
            }

            // Management IP (simple approach: first IP on a VLAN interface)
            const vlanInterfaceIpMatch = line.match(/^interface Vlan\d+\s*\n(?:.*\n)*?^\s*ip address\s+([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\s+(?:[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/im);
            if (vlanInterfaceIpMatch && !managementIp) {
                managementIp = vlanInterfaceIpMatch[1];
            }

            // Hardware model and OS Version (existing logic)
            const modelMatch = line.match(/(?:Model|PID|Hardware):\s*([a-zA-Z0-9\-]+)/i);
            if (modelMatch && !hardwareModel) {
                hardwareModel = modelMatch[1];
            }
            const versionMatch = line.match(/(?:Version|Software|IOS-XE Version)\s*([0-9\(\)a-zA-Z\.]+)/i);
            if (versionMatch && !osVersion) {
                osVersion = versionMatch[1];
            }

            // Interface parsing
            const interfaceStartMatch = line.match(/^(interface\s+(?:GigabitEthernet|FastEthernet|TenGigabitEthernet|Ethernet|Vlan|Port-channel)\s*[0-9\/\.]+)/i);
            if (interfaceStartMatch) {
                if (currentInterface) {
                    interfaces.push(currentInterface);
                }
                currentInterface = { name: interfaceStartMatch[1].replace('interface ', '') };
            } else if (currentInterface) {
                // Parse details within the current interface block
                const ipAddressMatch = line.match(/^\s*ip address\s+([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\s+([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/i);
                if (ipAddressMatch) {
                    currentInterface.ipAddress = ipAddressMatch[1];
                    currentInterface.mask = ipAddressMatch[2];
                    if (!currentInterface.mode) currentInterface.mode = 'routed'; // Assume routed if IP and no switchport
                }

                const descriptionMatch = line.match(/^\s*description\s+(.*)/i);
                if (descriptionMatch) {
                    currentInterface.description = descriptionMatch[1];
                }

                const switchportModeAccessMatch = line.match(/^\s*switchport mode access/i);
                if (switchportModeAccessMatch) {
                    currentInterface.mode = 'access';
                }

                const switchportAccessVlanMatch = line.match(/^\s*switchport access vlan\s+(\d+)/i);
                if (switchportAccessVlanMatch) {
                    currentInterface.vlan = switchportAccessVlanMatch[1];
                }

                const switchportModeTrunkMatch = line.match(/^\s*switchport mode trunk/i);
                if (switchportModeTrunkMatch) {
                    currentInterface.mode = 'trunk';
                }

                const switchportTrunkAllowedVlanMatch = line.match(/^\s*switchport trunk allowed vlan\s+(.*)/i);
                if (switchportTrunkAllowedVlanMatch) {
                    currentInterface.allowedVlans = switchportTrunkAllowedVlanMatch[1];
                }

                // CDP Neighbor parsing (assuming 'show cdp neighbor detail' output is part of the text)
                // This is a simplified regex and might need refinement based on actual output formats
                const cdpNeighborMatch = line.match(/Device ID:\s*(\S+).*?Interface:\s*(\S+)/s);
                if (cdpNeighborMatch) {
                    currentInterface.cdpNeighbor = {
                        hostname: cdpNeighborMatch[1],
                        localPort: cdpNeighborMatch[2]
                    };
                }

            }
        });

        if (currentInterface) {
            interfaces.push(currentInterface);
        }

        return {
            hostname,
            managementIp,
            interfaces,
            hardwareModel,
            osVersion,
            vlanRange,
            raw: text
        };
    }

    /**
     * Returns a structured summary string for AI context ingestion.
     */
    static getSummaryForAI(text: string): string {
        const parsed = this.parse(text);
        return `
HARDWARE INVENTORY SUMMARY:
- Hostname: ${parsed.hostname || 'Unknown'}
- Management IP: ${parsed.managementIp || 'Unknown'}
- Detected Model: ${parsed.hardwareModel || 'Unknown'}
- OS Version: ${parsed.osVersion || 'Unknown'}
- Available Interfaces: ${parsed.interfaces.slice(0, 10).join(', ')}${parsed.interfaces.length > 10 ? '...' : ''}
- Total Interfaces Found: ${parsed.interfaces.length}
${parsed.interfaces.map(intf => intf.cdpNeighbor ? `- Interface ${intf.name} connected to ${intf.cdpNeighbor.hostname} on its port ${intf.cdpNeighbor.localPort}` : '').filter(Boolean).join('\n')}

RAW DUMP (Contextual Reference):
${text.slice(0, 2000)} ${text.length > 2000 ? '[TRUNCATED]' : ''}
`.trim();
    }
}
