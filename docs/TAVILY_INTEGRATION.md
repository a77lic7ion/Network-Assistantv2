# Tavily Web Search Integration

**File:** `src/agents/tavilySearch.ts`

### API Call

```typescript
async function tavilySearch(query: string): Promise<TavilyResult[]> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: useSettingsStore.getState().tavily.apiKey,
      query,
      search_depth: 'advanced',
      include_domains: ['cisco.com', 'networklessons.com', 'packetlife.net'],
      max_results: 5
    })
  });
  const data = await response.json();
  return data.results;
}
```

### When Tavily is Used

1. **Validator Agent** — when `webSearchNeeded: true` in validation JSON.
2. **Config Agent** — when user has the "🌐 Use Web Search" toggle on.
3. **Simulator** — when a routing/VLAN scenario is ambiguous and needs best-practice lookup.
4. **Global Config Agent** — when applying a complex directive (e.g., "configure OSPF area 0").

Search results are injected into the agent prompt as a `[WEB CONTEXT]` section and citations are appended to the AI output.
