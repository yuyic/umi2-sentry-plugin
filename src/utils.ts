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
    const version = runCommand('git', 'rev-parse --abbrev-ref HEAD') + "-" + runCommand('git', 'rev-parse HEAD');
    return version.replace(/(\\|\/)/g, "_");
}