
# `umi2-sentry-plugin`

> umi2.x 支持qiankun微服务的Sentry插件，根据错误来源自动上传到sentry中对应的主/子应用下。

## Usage
```js
// .umirc
export default {
    plugins: [
        [
            'umi2-sentry-plugin',
            {
                org:"sentry",
                url: "https://sentry.meetsocial.cn/",
                auth_token: "token",
                dsn:"https://260dd274f00f486795a724749235f221@sentry.meetsocial.cn/25",
                project:"projectName",
                deleteSourcemapAfterUpload:true // sourcemap上传成功后删除
            }
        ]
    ]
}


