import { init, BrowserClient } from "@sentry/browser"
import ErrorStackParser from "./error-stack-parser"
import StackTraceGPS from "stacktrace-gps"
import StackFrame from "stackframe"

const gps = new StackTraceGPS();
const sentryClient = new BrowserClient({
    dsn: process.env._dsn
})

async function isErrorFromSlave(stackframes: StackFrame[]){
    try{
        const pinned = await gps.findFunctionName(stackframes[0]);
        return pinned && pinned.functionName.indexOf("geval(")>-1
    }
    catch(err){
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
                            sentryClient.captureEvent(event)
                        }
                    })
                }
                else{
                    sentryClient.captureEvent(event)
                }
            }
            catch(err){
                console.error(`[umi2-sentry-plugin]`, err)
            }
            return null
        }
    })
}


export {
    initSentry
}