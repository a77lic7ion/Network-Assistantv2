export interface TavilySearchResult {
    title: string;
    url: string;
    content: string;
    score: number;
}

export interface TavilyResponse {
    results: TavilySearchResult[];
    answer?: string;
}

export class TavilySearch {
    private static baseUrl = 'https://api.tavily.com/search';

    static async search(query: string, apiKey: string): Promise<TavilyResponse> {
        if (!apiKey) {
            throw new Error('Tavily API key is missing. Network search disabled.');
        }

        const body = {
            api_key: apiKey,
            query: query,
            search_depth: 'advanced',
            include_answer: true,
            max_results: 5,
        };

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Tavily API error: ${response.status}`);
        }

        return await response.json();
    }
}
