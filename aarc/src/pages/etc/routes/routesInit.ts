import { Router } from "vue-router";
import { addToRouter } from "@/app/router/addToRouter";
import { sponsorWxName } from "./routesNames";
import SponsorWx from "../SponsorWx.vue";

export function addEtcPages(r: Router) {
    addToRouter(r, routes);
}

const routes = [
    {
        path: "/sponsor-wx",
        component: SponsorWx,
        name: sponsorWxName
    }
]
