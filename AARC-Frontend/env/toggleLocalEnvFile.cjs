const fs = require('fs')
const enabledName = __dirname + "/.env.development.local"
const disabledName = __dirname + "/.env.development-disabled.local"
const enableMsg = "已启用.env.development.local"
const disableMsg = "已禁用.env.development.local"
const errMsg = "未找到.env.development[-disabled].local文件，请手动创建"

const enabledExists = fs.existsSync(enabledName)
const disabledExists = fs.existsSync(disabledName)
if(enabledExists && disabledExists){
    fs.unlinkSync(disabledExists)
    console.log(enableMsg)
}
else if(enabledExists){
    fs.renameSync(enabledName, disabledName)
    console.log(disableMsg)
}
else if(disableMsg){
    fs.renameSync(disabledName, enabledName)
    console.log(enableMsg)
}
else{
    console.error(errMsg)
}