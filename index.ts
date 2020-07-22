import { execSync } from "child_process"
import fs from "fs"
import webpack from "webpack"
import { IApi } from 'umi-types';

function normalizeUrl(url: string) {
    return url.replace(/([^:]\/)\/+/g, "$1")
}

function removeEmptyLines (string: string) {
    return string.replace(/[\s\r\n]+$/, '')
}
function runCommand(cli:string,command:string){
    return removeEmptyLines(''+execSync([cli, command].join(' ')))
}

function getVersion(){
    const version = runCommand('git', 'rev-parse --abbrev-ref HEAD') + "-" + runCommand('git', 'rev-parse HEAD');
    return version.replace(/(\\|\/)/g, "_");
}

function hasOwn(options: SentryPluginOptions, keys: string[]){
    if(typeof keys ==='string'){
        keys = [ keys ]
    }
    var missed = []
    for( var key of keys ){
        if(key in options === false){
            missed.push(key)
        }
    }
    if(missed.length>0){
        throw new Error(`Sentry plugin 需要配置参数${missed.join(',')}`)
    }
}

export interface SentryPluginOptions{
    dsn: string,
    project: string,
    url?: string,
    auth_token?: string,
    org?: string,
    path?: string,
    devtool?: string,
    version?: string,
    sourceMapUrl?: string | { [env:string]: string }
}


export default function (api: IApi, options: SentryPluginOptions) {
    
    hasOwn(options, ['dsn', 'project'])
    options = Object.assign({
        url: "https://sentry.meetsocial.cn/",
        auth_token: "59d4f902385044418d71a09d00f03499e86f1195144c410d8ec52239e27e97f3",
        org:"sentry",
        path: api.paths.outputPath,
        devtool: 'source-map',
        version: getVersion()
    }, options)

    api.modifyDefaultConfig(memo=>{
        return {
            ...memo,
            hash: true,
            devtool: options.devtool
        }
    })

    api.addEntryCodeAhead(`
        import { init } from '@sentry/browser';
        if(!window.__POWERED_BY_QIANKUN__){
            init({
                release:"${options.version}",
                dsn: "${options.dsn}"
            });
        }
    `)
    

    if(options.sourceMapUrl){

        const sourceMapUrl = typeof options.sourceMapUrl === 'string' ? options.sourceMapUrl : options.sourceMapUrl[ process.env.UMI_ENV ]
        api.chainWebpackConfig(memo => {
            memo.devtool(false);
            memo.plugin('source-map').use(webpack.SourceMapDevToolPlugin, [
                {
                    //@ts-ignore
                    namespace: options.project,
                    append: `\n//# sourceMappingURL=${sourceMapUrl || ''}/[url]`,
                    filename: '[file].map',
                },
            ]);
        });
    }

    if(process.env.NODE_ENV === 'production'){
        api.onBuildSuccess((resp) => {
            var data = new Uint8Array(Buffer.from(`
                [defaults]
                project = ${options.project}
                org = ${options.org}
                url = ${options.url}
                [auth]
                token = ${options.auth_token}
                dsn = ${options.dsn}
            `));
            fs.writeFileSync('.sentryclirc', data);
            api.log.success('已生成.sentryclirc');
            api.log.watch(`正在上传Sourcemap到Sentry: ${normalizeUrl([options.url, options.org, options.project].join('/'))}`);
            runCommand('sentry-cli', `releases new ${options.version}`);
            runCommand('sentry-cli', `releases files ${options.version} upload-sourcemaps ${options.path} --rewrite`);
            runCommand('sentry-cli', `releases finalize ${options.version} `);
            api.log.success('上传成功');
            return resp;
        });
    }
}
  