
const utils = require('../utils');
const path = require('path');
const folder = path.resolve(__dirname, '../template/java');

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

const makeNamespace = (outputFolder) => {
    let namespace = '';
    let out = outputFolder.replace(/\\/img, '/');
    let check = 'src/main/java';
    let index = out.indexOf(check);
    if (index >= 0) {
        namespace = out.substr(index + check.length + 1);
        namespace = namespace.replace(/\//img, '.');
    }
    return namespace;
}

exports.commands = {

    "entity": async (params, args, outputFolder) => {
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let className = ((params.g || params.group) || name) + 'Entity';
        let code = await utils.readText(path.resolve(folder, 'entity.java'));

        let namespace = makeNamespace(outputFolder);
        code = code.replace(/NAMESPACE/mg, namespace);

        code = code.replace(/FILE_NAME/mg, className);
        return [
            { name: className + '.java', content: code }
        ];
    },

    "repository": async (params, args, outputFolder) => {
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let className = ((params.g || params.group) || name) + 'Repository';
        let code = await utils.readText(path.resolve(folder, 'repository.java'));

        let namespace = makeNamespace(outputFolder);
        code = code.replace(/NAMESPACE/mg, namespace);

        code = code.replace(/FILE_NAME/mg, className);
        return [
            { name: className + '.java', content: code }
        ];
    },

    "weroll-router": async (params, args, outputFolder) => {
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let routerName = (params.g || params.group) || name;
        let code = await utils.readText(path.resolve(folder, 'weroll-router.java'));

        let namespace = makeNamespace(outputFolder);
        code = code.replace(/NAMESPACE/mg, namespace);

        code = code.replace(/FILE_NAME/mg, name);
        return [
            { name: routerName + '.java', content: code }
        ];
    },

    "weroll-service": async (params, args, outputFolder) => {
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }

        let code = await utils.readText(path.resolve(folder, 'weroll-service.java'));
        let serviceName = name.charAt(0).toLowerCase() + name.substr(1);
        code = code.replace(/SERVICE_NAME_GROUP/mg, serviceName);
        code = code.replace(/SERVICE_NAME/mg, name);

        let namespace = makeNamespace(outputFolder);

        code = code.replace(/NAMESPACE/mg, namespace);
        return [
            { name: name + 'API.java', content: code }
        ];
    },
};