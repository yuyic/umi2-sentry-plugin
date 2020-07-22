
# `umi2-sentry-plugin`

> 错误边界组件

## Usage
```js
// .umirc
export default {
    plugins: [
        [
            'umi2-sentry-plugin',
            {
                org:"sentry",
                url: "https://o-test-sino-sentry.meetsocial.cn/",
                auth_token: "f3ee8ed711ac40c2bb4fe61a4f968faecb63cc970be54284aa827aeea3bdf813",
                dsn:"https://260dd274f00f486795a724749235f221@o-test-sino-sentry.meetsocial.cn/25",
                project:"x-ray"
            }
        ]
    ]
}


