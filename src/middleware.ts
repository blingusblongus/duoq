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

    // If /login or /api/set-summoner we don't care that there's no cookie yet
    if (context.url.pathname === "/login") return next();
    if (context.url.pathname === "/api/set-summoner") return next();

    // Else we read cookie
    const summonerDetailsCookie = context.cookies.get("summonerDetails");

    // Redirect if missing
    if (!summonerDetailsCookie) {
        console.log("redirected due to missing cookie");
        return context.redirect("/login");
    }

    // And set context with cookie data
    try {
        const summonerDetails = summonerDetailsCookie.json();
        context.locals.user = summonerDetails;
    } catch (err) {
        console.error("Error parsing cookie");
        context.cookies.delete("summonerDetails");
        return context.redirect("/login");
    }

    return next();
});
