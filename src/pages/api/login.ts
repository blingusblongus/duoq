import { lucia } from "@/auth";
import type { APIContext } from "astro";
import { Summoner, User, and, db, eq, like } from "astro:db";

type SummonerResponse = {
    puuid: string;
    gameName: string;
    tagLine: string;
};
export async function POST(context: APIContext): Promise<Response> {
    const formData = await context.request.formData();

    const id = formData.get("id");

    if (typeof id !== "string") {
        return new Response("Invalid Summoner id", { status: 400 });
    }

    const [gameName, tagline] = id.split("#");

    if (!gameName || !tagline) {
        return new Response("Invalid Summoner id", { status: 400 });
    }

    console.log("searching for ", gameName + "#" + tagline);

    const all = await db.select().from(User);

    console.log(all);
    const existing = await db
        .select()
        .from(User)
        .where(
            and(like(User.tag_line, tagline), like(User.game_name, gameName)),
        )
        .get();

    console.log(existing);

    if (context.locals.session) {
        await lucia.invalidateSession(context.locals.session.id);
        console.log("session invalidated");
    }

    if (!existing) {
        console.log("hitting api");
        const riotResponse = await fetch(
            `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagline}`,
            { headers: { "X-Riot-Token": import.meta.env.RIOT_API_KEY } },
        );

        if (riotResponse.status !== 200) {
            return new Response("Summoner not found", { status: 400 });
        }

        const {
            puuid,
            gameName: game_name,
            tagLine: tag_line,
        } = (await riotResponse.json()) as SummonerResponse;

        await db.insert(User).values([
            {
                id: puuid,
                puuid,
                game_name,
                tag_line,
            },
        ]);

        const session = await lucia.createSession(puuid, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        context.cookies.set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes,
        );
    } else {
        const session = await lucia.createSession(existing.puuid, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        context.cookies.set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes,
        );
    }

    return context.redirect("/");
}
