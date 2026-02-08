import { mySavesName, saveToolsName, searchSaveName } from "@/pages/saves/routes/routesNames";
import { TopbarModel, TopbarModelItem } from "./topbarModel";
import { aboutName, loginName, userHistoriesName, userListName } from "@/pages/identities/routes/routesNames";
import { faq } from "@/pages/homes/routes/routesNames";
import { useCommonLocalConfigStore } from "@/app/localConfig/commonLocalConfig";
import { userFileList } from "@/pages/files/routes/routesNames";
import { useUserListLocalConfigStore } from "../localConfig/userListLocalConfig";

export async function getTopbarData(): Promise<TopbarModel> {
    const common = useCommonLocalConfigStore()
    const userList = useUserListLocalConfigStore()
    const items: TopbarModelItem[] = [
        {
            title: "主页",
            link: "/",
        },
        {
            title: "作品",
            children: [
                {
                    title: "我的作品",
                    link: { name: mySavesName }
                },
                {
                    title: "搜索作品",
                    link: { name: searchSaveName }
                }
            ]
        },
        {
            title: "资源",
            children: [
                {
                    title: "我的资源",
                    link: { name: userFileList }
                }
            ]
        },
        {
            title: "工具",
            children: [
                {
                    title: "RMP转AARC",
                    link: { name: saveToolsName }
                },
                {
                    title: "AARC转FicCloud",
                    link: { name: saveToolsName }
                },
                {
                    title: "AARC转轨交棋",
                    link: { name: saveToolsName }
                }
            ]
        },
        {
            title: "用户",
            children: [
                {
                    title: "用户列表",
                    link: { name: userListName }
                },
                {
                    title: "个人信息设置",
                    link: { name: userListName },
                    beforeJump: ()=>{
                        userList.openingSelfEdit = 'info'
                    }
                },
                {
                    title: "个人授权管理",
                    link: { name: userListName },
                    beforeJump: ()=>{
                        userList.openingSelfEdit = 'authGrant'
                    }
                },
                {
                    title: "系统操作记录",
                    link: { name: userHistoriesName }
                },
                {
                    title: "关于",
                    link: { name: aboutName }
                }
            ]
        }
    ]

    // 按设置决定是否加入“疑问“
    const showFaqOnTopbar = common.showFaqOnTopbar
    if (showFaqOnTopbar) {
        items.push({
            title: "疑问",
            link: { name: faq }
        })
    }
    // 登录必排在最后
    items.push({
        title: "登录",
        link: { name: loginName }
    })
    
    const model:TopbarModel = {
        items: items
    }
    return model;
}