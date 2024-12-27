export interface HttpUserInfo{
    readonly Id:number
    readonly Name:string
    readonly LeftHours:number
    readonly Type:UserType
}

export enum UserType
{
    Tourist = 0,
    Member = 1,
    Admin = 8
}

export interface LoginResponse{
    Token:string
}