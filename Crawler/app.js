/**
 * nodejs简易图片爬虫
 */

// 依赖模块
const fs = require('fs');
const request = require('request');

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

var allLinks = [];

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
async function getImageLinkFromUrl(type, urls, callback = function () { }) { 
    // 请求目标网站取到图片下载源并保存在数组中
    for (let url of urls) { 
        await request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                let links = new ParseHtml(type, body).init();
                callback(links);
            }
        });
    }
}

// 下载图片
async function downImage(links) { 
    if (request) {
        for (let link of links) { 
            await _dowm(link);
        }  
    } else { 
        console.log('you should require("request") on Nodejs environment!');
    }

    function _dowm(link) { 
        console.log('fetching image:'+ link +' ...');
        let filename = Math.floor(Math.random()*100000)+link.substr(-4, 4);
        request
        .get(link)
        .on('error', function (err) {
            console.log(err)
        })
        .pipe(fs.createWriteStream(dir + "/" + filename))
    }
}