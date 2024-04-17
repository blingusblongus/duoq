import { lucia } from "@/auth";
import { riotService } from "@/services/RiotService";
import type { APIContext, AstroCookieSetOptions } from "astro";
import { User, and, db, like } from "astro:db";
import type { Session } from "lucia";

export async function POST(context: APIContext): Promise<Response> {
    const formData = await context.request.formData();
    const id = formData.get("id");

    if (typeof id !== "string") {
        return new Response("Invalid Summoner id", { status: 400 });
    }

    const [gameName, tagline] = id.trim().split("#");
    if (!gameName || !tagline) {
        return new Response("Invalid Summoner id", { status: 400 });
    }
    console.log("searching for ", gameName + "#" + tagline);

    const existing = await db
        .select()
        .from(User)
        .where(
            and(like(User.tag_line, tagline), like(User.game_name, gameName)),
        )
        .get();
    console.log("User found in db:", existing);

    // Invalidate Current Session
    if (context.locals.session) {
        await lucia.invalidateSession(context.locals.session.id);
        console.log("session invalidated");
    }
    let session: Session;

    // Fetch Summoner Details
    if (!existing) {
        try {
            console.log("fetching user from riot");
            const {
                puuid,
                gameName: game_name,
                tagLine: tag_line,
            } = await riotService.getSummonerByRiotId(gameName, tagline);

            await db.insert(User).values([
                {
                    id: puuid,
                    puuid,
                    game_name,
                    tag_line,
                },
            ]);

            session = await lucia.createSession(puuid, {});
        } catch (err) {
            if (err instanceof Error) {
                return new Response(err.message);
            }
            return new Response("Error Fetching Summoner");
        }
    } else {
        session = await lucia.createSession(existing.puuid, {});
    }

    const sessionCookie = lucia.createSessionCookie(session.id);
    context.cookies.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes as AstroCookieSetOptions,
    );
    return context.redirect("/");
}
