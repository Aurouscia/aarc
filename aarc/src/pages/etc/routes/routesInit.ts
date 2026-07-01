import { Router } from "vue-router";
import { addToRouter } from "@/app/router/addToRouter";
import { sponsorWxName, deriveWikiName, deriveRailchessName, forkAarcName } from "./routesNames";
import SponsorWx from "../SponsorWx.vue";
import DeriveWiki from "../DeriveWiki.vue";
import DeriveRailchess from "../DeriveRailchess.vue";
import ForkAarc from "../ForkAarc.vue";

export function addEtcPages(r: Router) {
    addToRouter(r, routes);
}

const routes = [
    {
        path: "/sponsor-wx",
        component: SponsorWx,
        name: sponsorWxName
    },
    {
        path: "/derive-wiki",
        component: DeriveWiki,
        name: deriveWikiName
    },
    {
        path: "/derive-railchess",
        component: DeriveRailchess,
        name: deriveRailchessName
    },
    {
        path: "/fork-aarc",
        component: ForkAarc,
        name: forkAarcName
    }
]
