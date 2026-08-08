import { UserType } from "@/app/com/apiGenerated"

export function userTypeReadable(t?:UserType){
    if(t===UserType.Admin)
        return '管理'
    if(t===UserType.Member)
        return '正式用户'
    return '游客'
}

// 注册功能开关，与后端appsettings.json的Register节点对应，需保持一致
const registerEnabled = import.meta.env.VITE_RegisterEnabled !== 'false' // 未配置时默认开放
const registerRequireUserType = Number(import.meta.env.VITE_RegisterRequireUserType) || 0 // 未配置时默认0

/**
 * 当前用户是否可以注册
 * @param userId 当前用户Id（未登录为0或undefined）
 * @param userType 当前用户Type
 */
export function canRegister(userId?:number, userType?:UserType):boolean{
    if(!registerEnabled)
        return false
    if(registerRequireUserType <= UserType.Tourist)
        return true
    if(!userId)
        return false
    return (userType ?? 0) >= registerRequireUserType
}