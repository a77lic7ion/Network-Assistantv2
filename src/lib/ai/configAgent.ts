import { DeviceNodeData, AIMessage } from '../../types';

export class ConfigAgent {
    static buildPrompt(
        userMessage: string,
        device: DeviceNodeData,
        history: AIMessage[],
        topologySummary: string
    ): string {
        const systemPrompt = `
You are a Senior Network Automation Engineer. Your task is to provide precise CLI configuration blocks for network devices.

MODEL CONTEXT:
Vendor: ${device.vendor}
Model: ${device.deviceModel}
Software: ${device.softwareVersion}
Hostname: ${device.hostname}
Management IP: ${device.managementIp}

HARDWARE CONTEXT (uploaded config tab):
${device.blankConfigContext || 'No hardware context provided.'}

CURRENT RUNNING-CONFIG:
${device.runningConfig || '! No configuration applied yet.'}

TOPOLOGY SUMMARY:
${topologySummary}

INSTRUCTIONS:
1. Provide configuration in explicit CLI blocks using the following format:
   \`\`\`cli
   # SECTION_NAME
   commands...
   \`\`\`
2. Each block should correspond to a logical step (e.g., "Configure VLANs", "Assign IP to Interface").
3. Use the Hardware Context to understand interface naming conventions (e.g., GigabitEthernet0/1 vs Gi1/0/1).
4. If the user asks for something that requires information from other nodes, refer to the TOPOLOGY SUMMARY.
5. Be concise. Only provide the commands requested.
6. Always include "end" or "write memory" if appropriate for the vendor.
7. If unsure about syntax for this specific model, state your assumptions.
8. IOS strictness:
   - Use configuration mode when necessary:
     conf t
     <commands...>
     end
   - For VLAN creation:
     conf t
     vlan <ID>
      name <NAME>
     exit
     end
   - Do not output warnings or comments. Avoid contradictory lines (e.g., "login" and "no login").

User Request: ${userMessage}
`;

        return systemPrompt;
    }

    static extractCLIBlocks(content: string): { section: string; commands: string }[] {
        const blocks: { section: string; commands: string }[] = [];
        const regex = /```cli\n([\s\S]*?)```/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
            const fullContent = match[1];
            const lines = fullContent.split('\n');
            let section = 'Configuration Block';
            let commands = fullContent;

            if (lines[0].startsWith('#')) {
                section = lines[0].replace('#', '').trim();
                commands = lines.slice(1).join('\n').trim();
            }

            blocks.push({ section, commands });
        }

        return blocks;
    }
}
