import { mySavesName } from "@/pages/saves/routes/routesNames";
import { TopbarModel } from "./topbarModel";

export async function getTopbarData(): Promise<TopbarModel> {
    const model: TopbarModel = {
        Items: [
            {
                Title: "主页",
                Link: "/",
            },
            {
                Title: "作品",
                SubItems: [
                    {
                        Title: "所有作品",
                        Link: ""
                    },
                    {
                        Title: "我的作品",
                        Link: {name: mySavesName}
                    }
                ]
            }
        ]
    }
    return model;
}