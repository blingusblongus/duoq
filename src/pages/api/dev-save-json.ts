import { riotService } from "@/services/RiotService";
import type { APIContext } from "astro";
import type { FullMatch } from "db/examples/Match";
import fs from "fs";

/** This route is NOT available on prod, but is just a shorthand
 * to populate local files for mocking the riot API
 */
export async function GET(context: APIContext) {
    // Disable route for PROD
    if (import.meta.env.PROD) {
        return new Response("Resource not found", { status: 404 });
    }

    // Fetch Latest games
    // @ts-expect-error - for some reason, even changing declaration file doesn't seem to be fixing locals typing
    if (!context.locals.user) {
        return new Response("No user session", { status: 401 });
    }
    // @ts-expect-error - for some reason, even changing declaration file doesn't seem to be fixing locals typing
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

            // Get match if it doesn't exist
            if (!fs.existsSync("./db/examples/matches/" + match + ".json")) {
                console.log("downloading", match);
                const res = await riotService.request<FullMatch>(
                    `https://americas.api.riotgames.com/lol/match/v5/matches/${match}`,
                );

                if (!res) {
                    console.log("!res at ", i, "th match");
                    break;
                }
                fs.writeFile(
                    destPath + match + ".json",
                    JSON.stringify(res, null, 0),
                    (err) => console.error(err),
                );
            } else {
                console.log(match, "already downloaded");
            }
        }
    } catch (err) {
        console.error(err);
        return context.redirect("/");
    }

    console.log("matches saved");
    return context.redirect("/");
}
