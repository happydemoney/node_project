#   基于nodejs的弹幕交互服务  

    描述: 此系统主要实现:直播聊天室交互，点播弹幕实时数据采集和历史数据读取。
    基于webSocket与客户端进行通信，使用redis与mysql数据库存储数据

##  模块依赖
```
{
    "log4js": "^2.5.3",  // 提供日志功能 - 错误信息和调试信息
    "mysql": "^2.15.0",  // mysql数据库操作 - 增删改查
    "socket.io": "^2.1.0",  // 与客户端交互
    "socket.io-redis": "^5.2.0",  // 提供socket.io 与 redis交互的一些功能
    "lodash": "^4.17.5" // 提供部分功能扩展函数
}
```
##  环境依赖

    平台: linux  
    nodejs(测试命令：node -v，npm -v)  
    pm2(npm install -g pm2)  
    安装 mysql 服务  
    安装 redis 服务  
    配置 ./config/config.json 

##  初始化

    npm install  
    pm2 start ecosystem.json