// 依赖模块
const cheerio = require("cheerio");

class Parsehtml { 
    constructor(type,html) { 
        this.type = type; // 解析的方式
        this.html = html; // 待解析的html片段
    }
    init() { 
        switch (this.type) { 
            case 'zol':
                return this.zol(); 
                break;
            case 'www27270':
                return this.www27270(); 
                break;
            default:
                break;    
        }
    }
    zol() { 
        // zol 桌面壁纸
        let $ = cheerio.load(this.html),
            links = [];    
        
        $('.photo-list-padding a img').each(function() {
            let src = $(this).attr('src');
            src = src.replace(/t_s208x130c5/, 't_s960x600c5');
            links.push(src);
        });

        return links;
    }
    www27270() { 
        // http://www.27270.com
        let $ = cheerio.load(this.html),
            links = [];  

        $('#picBody img').each(function () {
            let src = $(this).attr('src');
            links.push(src);
        });

        return links;
    }
}

module.exports = Parsehtml;