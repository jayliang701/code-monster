exports.config = {
    name: "SERVICE_NAME",
    enabled: true,
    security: {
        //@echo 这是接口描述 @msg 消息文本
        "echo":{ needLogin:false, checkParams:{ msg:"string" } },
    }
};

const CODES = require("weroll/ErrorCodes");

exports.echo = async(params, user) => {
    let { msg } = params;
    console.log(`message from client ---> ${msg}`);
    console.log(`user login state ---> ${user.isLogined}`);
}
