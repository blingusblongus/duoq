import { riotService } from "@/services/RiotService";
import type { APIContext } from "astro";
import fs from "fs";

export async function POST(context: APIContext) {
    // Disable route for PROD
    if (import.meta.env.PROD) {
        return new Response("Resource not found", { status: 404 });
    }

    // Fetch Latest games
    if (!context.locals.user) {
        return new Response("No user session", { status: 401 });
    }
    // @ts-expect-error - for some reason, even changing declarating file doesn't seem to be fixing locals typing
    const { puuid } = context.locals.user as Summoner;

    const destPath = "db/examples/matches/";
    const matches = await riotService.getMatchIds(puuid, 0, 10);

    if (!matches || matches.length === 0) {
        console.log("no matches. puuid:", puuid);
        return new Response("No matches found", { status: 201 });
    }

    try {
        for (let i = 0; i < matches.length; ++i) {
            const match = matches[i];
            const res = await riotService.getMatchData(match);
            if (!res) {
                console.log("!res at ", i, "th match");
                break;
            }
            fs.writeFile(
                destPath + match + ".json",
                JSON.stringify(res, null, 0),
                (err) => console.error(err),
            );
        }
    } catch (err) {
        console.error(err);
        return context.redirect("/");
    }

    console.log("matches saved");
    return context.redirect("/");
}
