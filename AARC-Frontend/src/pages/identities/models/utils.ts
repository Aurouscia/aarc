import { UserType } from "@/app/com/apiGenerated"

export function userTypeReadable(t?:UserType){
    if(t===UserType.Admin)
        return '管理'
    if(t===UserType.Member)
        return '正式用户'
    return '游客'
}