import { lucia } from "./auth";
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

    const sessionId =
        context.cookies.get(lucia.sessionCookieName)?.value ?? null;

    console.log("sessionId", sessionId);
    if (!sessionId) {
        context.locals.user = null;
        context.locals.session = null;
        return next();
    }

    console.log("validating", sessionId);
    const { session, user } = await lucia.validateSession(sessionId);
    console.log("validated", session, user);
    if (session && session.fresh) {
        const sessionCookie = lucia.createSessionCookie(session.id);
        context.cookies.set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes,
        );
    }
    if (!session) {
        console.log("invalidating cookie");
        const sessionCookie = lucia.createBlankSessionCookie();
        context.cookies.set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes,
        );
    }
    context.locals.session = session;
    context.locals.user = user;
    return next();
});
