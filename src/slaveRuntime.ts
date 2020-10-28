import { get, set, reverse } from "lodash"
import { initSentry, getClient, close } from "./sentry"

function normalizeUrl(...args: string[]) {
  return args.join('/').replace(/([^:]\/)\/+/g, '$1');
}

export const qiankun = {
  bootstrap: (props: { entry: string; }) => {
    if( window.__POWERED_BY_QIANKUN__){
      try{
        let umijs = "umi.js";
        if(process.env.NODE_ENV==="production"){
          umijs = get(window.__umijsByDsn, process.env._dsn, "umi.js");
        }
        const filename =  normalizeUrl(props.entry.split("?")[0], umijs);
        window.__resolveCaptureEvent = function resolveStackFrames(event, stackFrames){
          const frames = stackFrames.map(sf=> ({
                filename: filename,
                lineno: sf.lineNumber,
                colno: sf.columnNumber-20
          }))
          set(event, 'exception.values[0].stacktrace.frames', reverse(frames));
          getClient().captureEvent(event);
        }
      }
      catch(err){
        getClient().captureException(err)
      }
    }
  },
  unmount(){
    close();
    delete window.__resolveCaptureEvent;
  }
}


function wrapLifecycles(lifecycle: any){

  function combine(oldFn:Function, newFn: Function){
    return (...args: any[])=>{
      oldFn && oldFn.apply(oldFn, args)
      newFn.apply(newFn, args)
    }
  }

  for(var prop in lifecycle){
    const fn = lifecycle[prop]
    if(typeof qiankun[prop] === "function" && typeof fn === "function" && qiankun[prop]!==fn){
      lifecycle[prop] = combine(fn, qiankun[prop])
    }
  }
}

Promise.resolve().then(function(){
  const plugins = require('umi/_runtimePlugin');

  if(process.env._isSlave && window.__POWERED_BY_QIANKUN__){
    const configs = plugins.getItem("qiankun")
    wrapLifecycles(configs[configs.length-1]);
  }
  else{
    initSentry()
  }
})