import { initSentry } from "./sentry"


Promise.resolve().then(function(){
    const plugins = require('umi/_runtimePlugin');
    plugins.mergeConfigAsync('qiankun').then((config: { apps: any[]; }) => {
        if(config.apps){
            config.apps.forEach(merged => {
                merged.props = {
                    ...merged.props,
                    ...merged
                }
            })
        }
    });
    initSentry();
});