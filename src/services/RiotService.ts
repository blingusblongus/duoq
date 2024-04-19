import type { FullMatch } from "db/examples/Match";

export type Summoner = {
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

    public async getMatchIds(
        puuid: string,
        start: number = 0,
        count: number = 20,
    ) {
        return this.request<string[]>(
            `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`,
        );
    }

    public async getMatchData(matchId: string) {
        return this.request<FullMatch>(
            `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`,
        );
    }

    public getSquareImgUrl(championName: string) {
        return `https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${championName}.png`;
    }
}

export const riotService = new RiotService();
