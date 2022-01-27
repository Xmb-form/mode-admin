/* eslint-disable */

import axios from 'axios'
import { Message, } from 'element-ui';

let instance = axios.create({ baseURL: '/mode' })

/**
 * @params {文件下载的请求参数}
 * @url {请求url不需要考虑网关gw自动拼接}
 * @downFileName {自定义下载的文件名称}
 * @msg {下载成功之后的提示}
 * @cb {回调函数}
 * @method {请求格式}
 */
export async function comonDownLoad(method, url, cb, params, downFileName, msg) {
    instance.defaults.responseType = 'blob';
    // 头部加入语言参数
    instance.defaults.headers['x-ca-language'] = 'zh_CN';
    // 加入请求的唯一ID
    instance.defaults.headers['x-ca-reqid'] = Math.random() + new Date().getTime();
    // 加入请求的时间戳
    instance.defaults.headers['x-ca-reqtime'] = new Date().getTime();
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    instance({
        url: url,
        data: params,
        responseType: 'blob',
        method: method,
    }).then(result => {
        if (result.status !== 200) {
            Message({
                message: '网络错误，请稍后重试',
                type: 'error',
            });
            return;
        }
        if (result.data.type === 'application/json' && result.config.url.indexOf('/accounting/statement/download') > -1) {
            const fileReader = new FileReader();
            fileReader.onload = function() {
                const { result, } = fileReader;
                const errorInfos = JSON.parse(result);
                const { msg, } = errorInfos;
                Message({
                    message: msg || '服务器异常，下载失败，请稍后重试~',
                    type: 'error',
                });
            };
            fileReader.readAsText(result.data);
            return;
        }
        if (result.data.type === 'application/json') {
            Message({
                message: '服务器异常，下载失败，请稍后重试~',
                type: 'error',
            });
            if (cb) {
                cb && cb();
            }
            return;
        }
        let fileName = downFileName ? downFileName : result.headers['content-disposition'].split('=')[1];
        let a = document.createElement('a');
        let blob = new Blob([result.data], { type: 'application/vnd.ms-excel', });
        a.download = decodeURI(fileName);
        a.href = window.URL.createObjectURL(blob);
        a.click();
        a.remove();
        Message({
            message: `${decodeURI(fileName)}${msg ? msg : '下载成功!'}`,
            type: 'success',
        });
        cb && cb(decodeURI(fileName));
    });
}
