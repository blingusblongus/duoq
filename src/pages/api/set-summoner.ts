import { riotService } from "@/services/RiotService";
import type { APIContext } from "astro";
import { Summoner, db } from "astro:db";

export async function POST(context: APIContext) {
    console.log("hitting set-summoner");
    const formData = await context.request.formData();
    const riotId = formData.get("riot-id") || "";

    if (typeof riotId !== "string") {
        return new Response("Invalid summoner name", { status: 400 });
    }
    const [gameName, tagLine] = riotId.split("#");
    if (!gameName || !tagLine) {
        return new Response("Invalid summoner name", { status: 400 });
    }

    let summonerDetails;
    try {
        // Get Summoner Info
        summonerDetails = await riotService.getSummonerByRiotId(
            gameName,
            tagLine,
        );

        const { puuid } = summonerDetails;
        await db
            .insert(Summoner)
            .values({
                puuid,
                game_name: gameName,
                tag_line: tagLine,
                games_tracked: 0,
                games_won: 0,
            })
            .onConflictDoNothing();
    } catch (err) {
        if (err instanceof Error) {
            return new Response(err.message);
        }
    }

    if (!summonerDetails) {
        return new Response("error setting cookie", { status: 500 });
    }

    // Set the cookie with a response
    return new Response(null, {
        status: 303,
        headers: {
            "Set-Cookie": `summonerDetails=${JSON.stringify(summonerDetails)}; Path=/; HttpOnly`,
            Location: "/",
        },
    });
}
