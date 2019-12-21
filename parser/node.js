
const utils = require('../utils');
const path = require('path');
const folder = path.resolve(__dirname, '../template/node');

const transferToUpCase = (str) => {
    let reg = /[a-zA-Z0-9]/;
    let s = '', needUp = true;
    for (let i = 0; i < str.length; i ++) {
        let c = str.charAt(i);
        if (reg.test(c)) {
            if (needUp) {
                c = c.toUpperCase();
                needUp = false;
            }
        } else {
            c = '';
            needUp = true;
        }
        s += c;
    }
    return s;
}

exports.commands = {

    "weroll-service": async (params, args) => {
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }

        let code = await utils.readText(path.resolve(folder, 'weroll-service.js'));
        let serviceName = name.charAt(0).toLowerCase() + name.substr(1);
        code = code.replace(/SERVICE_NAME/mg, serviceName);
        return [
            { name: name + 'Service.js', content: code }
        ];
    },

    "weroll-router": async (params, args) => {
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'test';
        }
        let routerName = (params.g || params.group) || name;
        let code = await utils.readText(path.resolve(folder, 'weroll-router.js'));
        let pageNameUp = transferToUpCase(name);
        code = code.replace(/PAGE_NAME_UP/mg, pageNameUp).replace(/PAGE_NAME/mg, name);
        return [
            { name: routerName + '.js', content: code }
        ];
    },
};