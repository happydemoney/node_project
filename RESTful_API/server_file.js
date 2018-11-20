// 读取本地file的版本
const Koa = require('Koa');
const Router = require('koa-router');
const fs = require("fs");
const serverPort = '3000';

const app = new Koa();
const router = new Router();

/**
 * 查询所有用户 或 指定id用户
 */
router.get('/listUsers', async (ctx, next) => {

    const data =  await fs.readFileSync(__dirname + "/" + "file/users.json", 'utf8');
    let dataObj = JSON.parse( data ),
        query = ctx.request.query,
        q_arr = Object.keys(query),
        reqData = data;

    if( q_arr.length > 0 ){
        for( let key in dataObj ){

            if( dataObj[key].id == query.id ){
                reqData = dataObj[key];
                reqData = JSON.stringify(reqData);
                break;
            }
        }
    }

    ctx.body = reqData;
    next();
});

/**
 * 添加用户 user4
 */
router.get('/addUser', async (ctx, next) => {

    let data =  await fs.readFileSync(__dirname + "/" + "file/users.json", 'utf8'),
        addUser = {
            "user4" : {
                "name" : "mohit",
                "password" : "password4",
                "profession" : "teacher",
                "id": 4
            }
        },
        dataObj = JSON.parse( data );
    
    dataObj["user4"] = addUser["user4"];

    ctx.body = dataObj;
    next();
});

/**
 * 删除用户 user2
 */
router.get('/deleteUser', async (ctx, next) => {

    const data =  await fs.readFileSync(__dirname + "/" + "file/users.json", 'utf8');
    let dataObj = JSON.parse( data );

    delete dataObj['user' + 2];

    ctx.body = JSON.stringify(dataObj);
    next();
});

app
.use(router.routes())
.use(router.allowedMethods());

app.listen(serverPort, () => {
    console.log('server is starting at port '+ serverPort);
});