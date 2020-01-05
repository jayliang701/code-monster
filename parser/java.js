
const utils = require('../utils');
const path = require('path');
const capitalization = require('capitalization');
const folder = path.resolve(__dirname, '../template/java');

const makeNamespace = (outputFolder) => {
    let namespace = '';
    let out = outputFolder.replace(/\\/img, '/');
    let check = 'src/main/java';
    let index = out.indexOf(check);
    if (index < 0) {
        check = 'src/';
        index = out.indexOf(check);
    }
    if (index >= 0) {
        namespace = out.substr(index + check.length + 1);
        namespace = namespace.replace(/\//img, '.');
    }
    return namespace;
}

const getParentNamespace = (namespace) => {
    let parentNamespace = namespace.substring(0, namespace.lastIndexOf('.'));
    return parentNamespace;
}

exports.commands = {

    "entity": async (params, args, outputFolder) => {
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let className = name + 'Entity';
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
        let className = name + 'Repository';
        let code = await utils.readText(path.resolve(folder, 'repository.java'));

        let namespace = makeNamespace(outputFolder);

        let entityName = ((params.e || params.entity) || 'Test');
        let entityTableName = capitalization.underline(entityName);
        let entityClassName = entityName + 'Entity';
        let entityClassNamespace = getParentNamespace(namespace) + '.entity.' + entityClassName;
        
        code = code.replace(/ENTITY_NAMESPACE/mg, entityClassNamespace);
        
        code = code.replace(/ENTITY_TABLE/mg, entityTableName);
        
        code = code.replace(/ENTITY_CLASS/mg, entityClassName);
        
        code = code.replace(/NAMESPACE/mg, namespace);

        code = code.replace(/FILE_NAME/mg, className);

        return [
            { name: className + '.java', content: code }
        ];
    },

    "service": async (params, args, outputFolder) => {
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let className = name + 'Service';
        let serviceName = capitalization.camelCase(className);
        let code = await utils.readText(path.resolve(folder, 'service.java'));

        let namespace = makeNamespace(outputFolder);

        let entityName = ((params.e || params.entity) || 'Test');
        let entityClassName = entityName + 'Entity';
        let entityClassNamespace = getParentNamespace(namespace) + '.entity.' + entityClassName;
        
        code = code.replace(/ENTITY_NAMESPACE/mg, entityClassNamespace);
        
        code = code.replace(/ENTITY_CLASS/mg, entityClassName);

        let repositoryName = ((params.r || params.repository) || 'Test');
        let repositoryClassName = repositoryName + 'Repository';
        let repositoryClassNamespace = getParentNamespace(namespace) + '.repository.' + repositoryClassName;
        
        code = code.replace(/REPOSITORY_NAMESPACE/mg, repositoryClassNamespace);
        
        code = code.replace(/REPOSITORY_CLASS/mg, repositoryClassName);
        
        code = code.replace(/REPOSITORY/mg, capitalization.camelCase(repositoryClassName));
        
        code = code.replace(/NAMESPACE/mg, namespace);

        code = code.replace(/SERVICE_NAME/mg, serviceName);

        code = code.replace(/FILE_NAME/mg, className);

        return [
            { name: className + '.java', content: code }
        ];
    },

    "domain": async (params, args, outputFolder) => {
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        
        let p = {
            name,
        };
        let a = [];

        let outputs = [];
        outputFolder = path.resolve(outputFolder, 'domain');
        await utils.mkdir(outputFolder);

        let customOutputFolder = path.resolve(outputFolder, 'entity');
        await utils.mkdir(customOutputFolder);

        let out = await exports.commands['entity'](p, a, customOutputFolder);
        out[0].output = customOutputFolder;
        outputs.push(out[0]);

        customOutputFolder = path.resolve(outputFolder, 'repository');
        await utils.mkdir(customOutputFolder);
        p = {
            name,
            entity: name,
        };
        out = await exports.commands['repository'](p, a, customOutputFolder);
        out[0].output = customOutputFolder
        outputs.push(out[0]);

        customOutputFolder = path.resolve(outputFolder, 'service');
        await utils.mkdir(customOutputFolder);
        p = {
            name,
            entity: name,
            repository: name,
        };
        out = await exports.commands['service'](p, a, customOutputFolder);
        out[0].output = customOutputFolder;
        outputs.push(out[0]);

        return outputs;
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