/// <reference path="../.astro/db-types.d.ts" />
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { Summoner } from "./services/RiotService";

//

declare namespace App {
    interface Locals {
        session: import("lucia").Session | null;
        user: Summoner | null;
    }
}
