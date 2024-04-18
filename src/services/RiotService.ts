type Summoner = {
    puuid: string;
    gameName: string;
    tagLine: string;
};

class RiotService {
    private apiKey: string = import.meta.env.RIOT_API_KEY;

    constructor() {
        if (!this.apiKey) {
            throw new Error("API key must be defined.");
        }
    }

    private async request<T>(url: string): Promise<T> {
        const response = await fetch(url, {
            headers: { "X-Riot-Token": this.apiKey },
        });

        if (!response.ok) {
            throw new Error(`API call failed with status ${response.status}`);
        }

        return response.json() as Promise<T>;
    }

    public async getSummonerByRiotId(gameName: string, tagline: string) {
        return this.request<Summoner>(
            `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagline}`,
        );
    }
}

export const riotService = new RiotService();