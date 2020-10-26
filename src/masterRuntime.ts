import { initSentry } from "./sentry"

Promise.resolve().then(function(){
    const plugins = require('umi/_runtimePlugin');
    plugins.mergeConfigAsync('qiankun').then((config: any) => {
        if(config.apps){
            config.apps.forEach((merged: any) => {
                merged.props = {
                    ...merged.props,
                    ...merged
                }
            })
        }
    });
    initSentry();
});