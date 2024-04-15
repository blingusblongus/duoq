import { Session, User, db } from "astro:db";
import { Lucia } from "lucia";
import { AstroDBAdapter } from "lucia-adapter-astrodb";

const adapter = new AstroDBAdapter(db, Session, User);

export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            secure: import.meta.env.PROD,
        },
    },
});

declare module "lucia" {
    interface Register {
        Lucia: typeof lucia;
    }
}
