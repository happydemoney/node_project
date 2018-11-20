// 读取本地file的版本
const Koa = require('Koa');
const Router = require('koa-router');
const serverPort = '3000';

const User = require('./db/mongoose-db');

const app = new Koa();
const router = new Router();

/**
 * 新增用户
 */
router.get('/addUser', async (ctx, next) => {

    let reqQuery = ctx.request.query,
        respone = {};

    // 1. 验证必要字段 name password
    if( reqQuery.name && reqQuery.password ){

        let user = new User({
            name: reqQuery.name,
            password: reqQuery.password
        });

        await user.save();

        respone.code = '00';
        respone.message = '添加成功'
    }else{

        respone.code = '01';
        respone.message = '缺少必要的字段,至少包含(name / password)且不为空'
    }

    ctx.body = JSON.stringify(respone);
    next();
});

/**
 * 删除指定用户
 * @param {String} name
 * @returns {JSON} { code, message }
 */
router.get('/deleteUser', async (ctx, next) => {

    let reqQuery = ctx.request.query,
        respone = {};

    if( reqQuery.name ){

        const deleteMessage = await User.deleteOne({
            name: reqQuery.name
        });
        
        /**
         * deleteMessage
         * { n: 删除的数据数量 , ok }
         */

        if( deleteMessage.n > 0 && deleteMessage.ok === 1 ){
            respone.code = '00';
            respone.message = '删除成功'
        }else{
            respone.code = '02';
            respone.message = '指定删除的数据不存在'
        }
    }else{

        respone.code = '01';
        respone.message = '缺少必要的字段,至少包含(name)且不为空'
    }
    
    ctx.body = JSON.stringify(respone);
    next();
});

/**
 * 更新用户信息 
 * @param {String} name
 * @returns {JSON} { code, message }
 */
router.get('/updateUser', async (ctx, next) => {

    let reqQuery = ctx.request.query,
        respone = {};

    if( reqQuery.name ){

        const updateMessage = await User.updateOne({
            name: reqQuery.name
        },{
            name: reqQuery.newName,
            password: reqQuery.newPassword
        });
        
        /**
         * updateMessage
         * { n: 更新的数据数量 , nModified: 是否有修改, ok }
         */

        if( updateMessage.n > 0 && updateMessage.nModified === 1 && updateMessage.ok === 1 ){
            respone.code = '00';
            respone.message = '更新成功'
        }else{
            respone.code = '02';
            respone.message = '指定更新的数据不存在或数据未有变化'
        }
    }else{

        respone.code = '01';
        respone.message = '缺少必要的字段,至少包含(name)且不为空'
    }
    
    ctx.body = JSON.stringify(respone);

    next();
});

/**
 * 查询所有用户 或 指定id用户
 */
router.get('/listUsers', async (ctx, next) => {

    let users = await User.getUsers(),
        respone = {};

    if( users.length >= 0 ){

        respone.code = '00';
        respone.message = '添加成功';
        respone.users = users;
    }else{
        
        respone.code = '01';
        respone.message = '用户数据查询失败';
        respone.users = null;
    }
    
    ctx.body = JSON.stringify(respone);
    next();
});

app
.use(router.routes())
.use(router.allowedMethods());

app.listen(serverPort, () => {
    console.log('server is starting at port '+ serverPort);
});