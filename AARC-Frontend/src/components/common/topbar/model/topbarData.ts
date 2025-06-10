import { mySavesName, searchSaveName } from "@/pages/saves/routes/routesNames";
import { TopbarModel } from "./topbarModel";
import { aboutName, loginName, userListName } from "@/pages/identities/routes/routesNames";

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
                        Title: "我的作品",
                        Link: {name: mySavesName}
                    },
                    {
                        Title: "搜索作品",
                        Link: {name: searchSaveName}
                    }
                ]
            },
            {
                Title: "用户",
                SubItems: [
                    {
                        Title: "用户列表",
                        Link: {name:userListName}
                    },
                    {
                        Title: "关于",
                        Link: {name:aboutName}
                    }
                ]
            },
            {
                Title: "登录",
                Link: {name: loginName}
            }
        ]
    }
    return model;
}