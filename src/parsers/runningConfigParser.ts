/**
 * Simple Cisco IOS config merger.
 * Strictly appends and attempts naive deduplication but prioritizes 
 * maintaining logical sections (interface, vlan, etc.)
 */

export class RunningConfigParser {
    static merge(currentConfig: string, newCommands: string): string {
        const currentLines = currentConfig.split('\n').map(l => l.trimEnd());
        const newLines = newCommands.split('\n').map(l => l.trimEnd());

        // Naive merge: split into sections and merge existing ones.
        // For a CLI assistant, we can often just append, but deduplication 
        // of specific commands (like 'vlan 10') is nice.

        const result = [...currentLines];

        for (const line of newLines) {
            if (!line || line.startsWith('!')) {
                result.push(line);
                continue;
            }

            // Check if line exists exactly
            if (currentLines.includes(line)) {
                // If it's a section header, we might want to step into it
                // but for now, let's keep it simple and append if it looks like a config change
                if (!line.match(/^(interface|vlan|router|line|ip route)/i)) {
                    continue;
                }
            }

            result.push(line);
        }

        return result.join('\n');
    }

    /**
     * More advanced merger that understands IOS sections.
     */
    static smartMerge(current: string, incoming: string): string {
        const sections = this.parseSections(current);
        const newSections = this.parseSections(incoming);

        for (const [header, commands] of Object.entries(newSections)) {
            if (sections[header]) {
                // Merge commands within section
                const existingSet = new Set(sections[header]);
                commands.forEach(cmd => {
                    if (!existingSet.has(cmd)) {
                        sections[header].push(cmd);
                    }
                });
            } else {
                sections[header] = commands;
            }
        }

        // Reconstruct
        let output = '';
        for (const [header, commands] of Object.entries(sections)) {
            if (header === 'GLOBAL') {
                output += commands.join('\n') + '\n';
            } else {
                output += header + '\n';
                output += commands.map(c => ` ${c}`).join('\n') + '\n';
                output += '!\n';
            }
        }

        return output.trim();
    }

    private static parseSections(config: string): Record<string, string[]> {
        const lines = config.split('\n');
        const sections: Record<string, string[]> = { 'GLOBAL': [] };
        let currentHeader = 'GLOBAL';

        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === '!') continue;

            if (line.startsWith('interface ') || line.startsWith('vlan ') || line.startsWith('router ')) {
                currentHeader = trimmed;
                if (!sections[currentHeader]) sections[currentHeader] = [];
            } else if (line.startsWith(' ') || line.startsWith('\t')) {
                sections[currentHeader].push(trimmed);
            } else {
                // Global command or exit
                if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'end') {
                    currentHeader = 'GLOBAL';
                } else {
                    sections['GLOBAL'].push(trimmed);
                }
            }
        }
        return sections;
    }
}
