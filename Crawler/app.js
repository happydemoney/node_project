/**
 * nodejs简易图片爬虫
 */

// 依赖模块
const fs = require('fs');
const axios = require('axios');

// custom module
const config = require('./config/config.json');
const ParseHtml = require('./parse/parseHtml.js');
const ParseUrl = require('./parse/parseUrl.js');

// 本地存储目录
const dir = './images';

// 目标网址
const urls = config.urls;

// 创建目录
fs.mkdir(dir, function(err) {
    if(err){
        console.log(err);
    }
});

// urls是一个对象数组，包含要解析的地址url和规则type
// Parse

for (let oUrl of urls) { 

    let url = oUrl.url,
        type = oUrl.type,
        route = oUrl.route;
    
    if (route == 'tag') {

        // 1. Array
        if (Array.isArray(url)) {

            new ParseUrl(url, type, route).exec(function (urls) {

                new ParseUrl(urls, type).exec(function (links) {

                    getImageLinkFromUrl(type, links, function (urls) {
                        downImage(urls);
                    });
                });
            });
        }
    } else { 
        // 1. Array
        if (Array.isArray(url)) { 
            new ParseUrl(url, type).exec(function (links) {

                getImageLinkFromUrl(type, links, function (urls) {
                    downImage(urls);
                });
            });
        }
    }
}

// 获取到图片下载链接
function getImageLinkFromUrl(type, urls, callback = function () { }) { 
    // 请求目标网站取到图片下载源并保存在数组中
    for (let url of urls) { 

        // Make a request for a user with an uri
        axios.get(url)
        .then(function (response) {
            // handle success
            // console.log(response);
            let data = response.data;

            let links = new ParseHtml(type, data).init();
            callback(links);
        })
        .catch(function (error) {
            // handle error
            console.log(error.address + ' : ' + error.code);
        })
        .then(function () {
            // always executed
            // return;
        });
    }
}

// 下载图片
async function downImage(links) { 
    if (axios) {
        for (let link of links) { 
           await _dowm(link);
        }  
    } else { 
        console.log('you should require("axios") on Nodejs environment!');
    }

    function _dowm(link) { 
        console.log('fetching image:'+ link +' ...');
        // let filename = Math.floor(Math.random()*100000)+link.substr(-4, 4);
        let filename = Date.now() + '_' + Math.floor(Math.random()*100000) + link.substr(-4, 4);

        axios({
            method: 'get',
            url: link,
            responseType:'stream'
        })
        .then(function (response) {
          response.data.pipe(fs.createWriteStream(dir + "/" + filename))
        })
        .catch(function( error ){
            console.log(error);
        });
    }
}