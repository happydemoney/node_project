/**
 * 有些网站将图片放在了不同的url链接下，这时需要解析某一个大类图集的所有子类图url链接
 * 比如 www.27270.com
 */
const axios = require('axios');
const cheerio = require("cheerio");

class ParseUrl { 

    constructor(urls, type, route) { 
        
        this.urls = urls;
        this.type = type;
        this.route = route;
    }

    exec(callback = function () { }) {

        let urlArray = [],
            urls = this.urls,
            type = this.type,
            route = this.route;
          
        function getLinkFromUrls(callback){ 

            for (let url of urls) { 

                if (type == 'www27270' && route == 'tag') {

                    // 请求目标网站取到图片下载源并保存在数组中
                    axios.get(url)
                    .then(function( response ){

                        // console.log( response );
                        let data = response.data;

                        // zol 桌面壁纸
                        let $ = cheerio.load(data);
                                    
                        $('#Tag_list li').each(function () {
                                
                            let href = $(this).find('a').attr('href');
                            urlArray.push(href);
                        });

                        callback(urlArray);
                    })
                    .catch(function( error ){
                        console.log(error.code);
                    })
                    .then(function(){
                        // return;
                    });
                }
                else if (type == 'www27270') {
                    
                    // 请求目标网站取到图片下载源并保存在数组中
                    axios.get(url)
                    .then(function( response ){

                        // console.log( response );
                        let data = response.data;
                        // zol 桌面壁纸
                        let $ = cheerio.load(data),
                            totalPage,
                            urlPrefix = url.split('.html')[0];
                    
                        totalPage = Number($('#pageinfo').attr('pageinfo'));
                    
                        for (let i = 1; i < totalPage; i++) {
                            let newUrl = urlPrefix + '_' + (i + 1) + '.html';
                            urlArray.push(newUrl);
                        }

                        callback(urlArray);
                    })
                    .catch(function( error ){
                        console.log(error.code);
                    })
                    .then(function(){
                        // return;
                    });
                }
            }  

        }

        return getLinkFromUrls(callback);
    }
}

module.exports = ParseUrl;