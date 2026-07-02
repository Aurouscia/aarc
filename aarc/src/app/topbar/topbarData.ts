import { mySavesName, saveToolsName, searchSaveName, saveFoldersName, saveWarnsName, userFavoritesName } from "@/pages/saves/routes/routesNames";
import { TopbarModel, TopbarModelItem } from "./topbarModel";
import { aboutName, loginName, userCreditName, userHistoriesName, userListName } from "@/pages/identities/routes/routesNames";
import { faq } from "@/pages/homes/routes/routesNames";
import { useCommonLocalConfigStore } from "@/app/localConfig/commonLocalConfig";
import { userFileList } from "@/pages/files/routes/routesNames";
import { useUserListLocalConfigStore } from "../localConfig/userListLocalConfig";
import { deriveRailchessName, deriveWikiName, forkAarcName, sponsorWxName } from "@/pages/etc/routes/routesNames";

const isFork = import.meta.env.VITE_IsFork == "true"

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
                    title: "我的目录",
                    link: { name: saveFoldersName }
                },
                {
                    title: "我的收藏",
                    link: { name: userFavoritesName }
                },
                {
                    title: "搜索作品",
                    link: { name: searchSaveName }
                },
                {
                    title: "问题提醒",
                    link: { name: saveWarnsName }
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
        }
    ]

    if(!isFork){
        items.push(
        {
            title: "衍生",
            children: [
                {
                    title: 'AARC 私服',
                    link: { name:forkAarcName }
                },
                {
                    title: 'FCloud3 系统',
                    link: { name:deriveWikiName }
                },
                {
                    title: '多人在线轨交棋',
                    link: { name:deriveRailchessName }
                },
                {
                    title: "更多工具",
                    link: { name: saveToolsName }
                }
            ]
        })
    }

    items.push(
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
                    title: "信用分",
                    link: { name: userCreditName }
                },
                {
                    title: "关于",
                    link: { name: aboutName }
                }
            ]
        })

    // 按设置决定是否加入"疑问"
    const showFaqOnTopbar = common.showFaqOnTopbar
    if (showFaqOnTopbar) {
        items.push({
            title: "疑问",
            link: { name: faq }
        })
    }

    if(!isFork){
        items.push({
            title: "资助",
            link: { name: sponsorWxName }
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