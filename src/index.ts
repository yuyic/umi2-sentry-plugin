import fs from "fs"
import { IApi } from 'umi-types';
import { Event } from "@sentry/browser"
import { normalizeUrl, runCommand, getVersion } from "./utils"

declare global {
    interface Window {
        __resolveCaptureEvent: (event: Event, stackframes: StackFrame[]) => void;
        __umijsByDsn?: { [dsn:string]: string };
        __POWERED_BY_QIANKUN__?:boolean;
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
}

function hasDefinedOptions(options: SentryPluginOptions, keys: string[]){
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


export default function (api: IApi, options: SentryPluginOptions) {
    
    hasDefinedOptions(options, ['dsn', 'project']);
    options = Object.assign(
        {
            org: 'sentry',
            path: api.paths.outputPath,
            devtool: 'source-map',
            version: getVersion(),
        },
        options,
    );


    const isSlave = api.config.plugins.some(
        plugin => plugin[0] === "@umijs/plugin-qiankun/slave"
    )
    
    if(isSlave){
        api.addRuntimePlugin(require.resolve("./slaveRuntime.js"))
    }
    else{
        api.addRuntimePlugin(require.resolve("./masterRuntime.js"))
    }
    
    api.modifyDefaultConfig(memo=>{
        return {
            ...memo,
            hash: true,
            devtool: options.devtool
        }
    })

    api.modifyAFWebpackOpts(memo => {
        return {
            ...memo,
            define: {
                ...memo.define,
                "process.env._isSlave": isSlave,
                "process.env._dsn": options.dsn,
                "process.env._version": options.version
            }
        };
    });
    
    api.modifyHTMLWithAST($ => {
        $('script').each((_i, el) => {
          const src = $(el).attr('src');
          const umiEntryJs = /\/?umi(\.\w+)?\.js$/g;
          if (umiEntryJs.test(src)) {
                $('head').append(`<script>
                ;(function(){
                    if(!window.__umijsByDsn){
                    window.__umijsByDsn = {}
                    }
                    window.__umijsByDsn['${options.dsn}'] = '${src}';
                })();
                </script>`);
                if(!isSlave){
                    $('head').append(`<link rel="prefetch" href="${src}.map">`);
                }
          }
        });
        return $;
    });

    if(process.env.NODE_ENV === 'production'){
        api.onBuildSuccessAsync(resp => {
            const data = new Uint8Array(
              Buffer.from(`
                        [defaults]
                        project = ${options.project}
                        org = ${options.org}
                        url = ${options.url}
                        [auth]
                        token = ${options.auth_token}
                        dsn = ${options.dsn}
                    `),
            );
            fs.writeFileSync('.sentryclirc', data);
            api.log.success('已生成.sentryclirc');
            api.log.watch(
              `正在上传Sourcemap到Sentry: ${normalizeUrl(
                [options.url, options.org, options.project].join('/'),
              )}`,
            );
            runCommand('sentry-cli', `releases new ${options.version}`);
            runCommand(
              'sentry-cli',
              `releases files ${options.version} upload-sourcemaps ${options.path} --rewrite`,
            );
            runCommand('sentry-cli', `releases finalize ${options.version} `);
            api.log.success('上传成功');
            return resp;
        });
    }
}
  