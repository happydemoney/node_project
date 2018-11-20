/**
 * 存放模式和模型的生成的代码，没有连接信息，也没有其他额外不相干代码
 */
require('./connect');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 定义模式 VideoSchema
const UserSchema = new Schema({
    name: String,
    password: String,
    profession: {
        type: String,
        default: 'student'
    } // 用户角色 - 默认学生
}, {
    versionKey: false
});

// middleware - pre
UserSchema.pre("save", function(next) {
    next()
});

// 静态方法 - 查询
UserSchema.statics = {
    async getUsers(){
        const users = await this.find({}).exec();
        return users;
    },
    async getUserByName( name ){
        const user = await this.find({
            name
        }).exec();

        return user;
    }
}

// 实体方法 - 查询
UserSchema.methods = {
    async fetchUserByName( name ){
        const user = await this.model('User').find({
            name
        }).exec();

        return user;
    }
}

// 定义模型 model
const User = mongoose.model("User", UserSchema);

module.exports = User;