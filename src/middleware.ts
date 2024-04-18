import { verifyRequestOrigin } from "lucia";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    if (context.request.method !== "GET") {
        const originHeader = context.request.headers.get("Origin");
        const hostHeader = context.request.headers.get("Host");
        if (
            !originHeader ||
            !hostHeader ||
            !verifyRequestOrigin(originHeader, [hostHeader])
        ) {
            return new Response(null, {
                status: 403,
            });
        }
    }

    if (context.url.pathname === "/login") return next();

    const summonerDetailsCookie = context.cookies.get("summonerDetails");

    if (!summonerDetailsCookie) {
        return context.redirect("/login");
    }

    try {
        const summonerDetails = summonerDetailsCookie.json();
        context.locals.user = summonerDetails;
    } catch (err) {
        console.error("Error parsing cookie");
        context.cookies.delete("summonerDetails");
    }

    return next();
});
