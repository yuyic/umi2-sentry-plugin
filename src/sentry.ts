import { init, BrowserClient } from "@sentry/browser"
import ErrorStackParser from "./error-stack-parser"
import StackTraceGPS from "stacktrace-gps"
import StackFrame from "stackframe"

const gps = new StackTraceGPS();
let sentryClient: BrowserClient;

async function isErrorFromSlave(stackframes: StackFrame[]){
    try{
        const d = Date.now()
        const pinned = await gps.getMappedLocation(stackframes[0]);
        console.log(Date.now()-d, pinned);
        return pinned && pinned.fileName.indexOf("import-html-entry")>-1
    }
    catch(err){
        console.log(err)
        return false
    }
}

const initSentry = () => {
    init({
        dsn: process.env._dsn,
        beforeSend(event,hint){
            try{
                if(window.__resolveCaptureEvent){
                    const stackframes = ErrorStackParser.parse(hint.originalException as Error, false)
                    isErrorFromSlave(stackframes).then(fromSlave=>{
                        if(fromSlave){
                            const anonyStackFrames = ErrorStackParser.parse(hint.originalException as Error, true)
                            window.__resolveCaptureEvent(event, anonyStackFrames)
                        }
                        else{
                            getClient().captureEvent(event)
                        }
                    })
                }
                else{
                    getClient().captureEvent(event)
                }
            }
            catch(err){
                console.error(`[umi2-sentry-plugin]`, err)
            }
            return null
        }
    })
}

const getClient = () => {
    if(!sentryClient){
        sentryClient = new BrowserClient({
            dsn: process.env._dsn
        })
    }
    return sentryClient;
}

const close = () => {
    if(sentryClient){
        try{
            sentryClient.close()
        }
        finally{
            sentryClient = null;
        }
    }
}


export {
    initSentry,
    getClient,
    close
}