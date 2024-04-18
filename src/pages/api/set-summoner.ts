import { riotService } from "@/services/RiotService";
import type { APIContext } from "astro";

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

    // Get Summoner Info
    const summonerDetails = await riotService.getSummonerByRiotId(
        gameName,
        tagLine,
    );

    // Set the cookie with a response
    return new Response(null, {
        status: 303,
        headers: {
            "Set-Cookie": `summonerDetails=${JSON.stringify(summonerDetails)}; Path=/; HttpOnly`,
            Location: "/",
        },
    });
}
