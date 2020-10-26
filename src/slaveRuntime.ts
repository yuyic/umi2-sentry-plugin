import { BrowserClient } from "@sentry/browser"
import { get, set } from "lodash"
import { initSentry } from "./sentry"

function normalizeUrl(...args: string[]) {
  return args.join('/').replace(/([^:]\/)\/+/g, '$1');
}


let sentryClient

export const qiankun = {
  bootstrap: (props) => {
    if( window.__POWERED_BY_QIANKUN__){
      sentryClient = new BrowserClient({
        dsn: process.env._dsn
      });
      let umijs = "umi.js";
      if(process.env.NODE_ENV==="production"){
        umijs = get(window.__umijsByDsn, process.env._dsn, umijs);
      }
      const filename =  normalizeUrl(props.entry, umijs);
      window.__resolveCaptureEvent = function resolveStackFrames(event, stackFrames){
        const frames = stackFrames.map(sf=> ({
              filename: filename,
              lineno: sf.lineNumber,
              colno: sf.columnNumber
        }))
        set(event, 'exception.values[0].stacktrace.frames', frames);
        sentryClient.captureEvent(event);
      }
    }
  },
  unmount(){
    if(sentryClient){
      try{
        sentryClient.close()
      }
      finally{
        sentryClient = null;
      }
    }
    delete window.__resolveCaptureEvent;
    
  }
}


function wrapLifecycles(lifecycle){

  function combine(oldFn, newFn){
    return (...args)=>{
      oldFn && oldFn.apply(oldFn, args)
      newFn.apply(newFn, args)
    }
  }

  for(var prop in lifecycle){
    const fn = lifecycle[prop]
    if(qiankun[prop] && qiankun[prop]!==fn){
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