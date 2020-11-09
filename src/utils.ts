import { execSync } from "child_process"

export function normalizeUrl(...args: string[]) {
    return args.join('/').replace(/([^:]\/)\/+/g, '$1');
}

export function removeEmptyLines (string: string) {
    return string.replace(/[\s\r\n]+$/, '')
}
export function runCommand(cli:string,command:string){
    return removeEmptyLines(''+execSync([cli, command].join(' ')))
}

export function getVersion(){
    try{
        return runCommand('git', 'rev-parse --short HEAD');
    }
    catch(err){
        console.warn('没有找到相关的.git记录，sentry release将用本地时间代替');
    }
    return (new Date()).toLocaleString()
}