import { UserType } from "@/app/com/apiGenerated"

export function userTypeReadable(t:UserType){
    if(t===UserType.Admin)
        return '管理'
    if(t===UserType.Member)
        return '会员'
    return '游客'
}