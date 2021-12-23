
const utils = require('../utils');
const { describeEntityClass } = require('./tools/javaParser');
const path = require('path');
const fs = require('fs');
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

const findFolders = (folder) => {
    return new Promise((resolve, reject) => {
        fs.readdir(folder, (err, files) => {
            if (err) return reject(err);
            let folders = [];
            files.forEach(file => {
                if (fs.lstatSync(file).isDirectory()) {
                    folders.push(file);
                }
            });
            resolve(folders);
        });
    });
}

const buildCode = (code, entityDef) => {
    if (code.indexOf('</JS>') < 0) {
        return code;
    }

    let originalCode = code.substr(0, code.indexOf('<JS>'));

    if (!entityDef) {
        return originalCode;
    }

    let jsCode = code.substr(code.indexOf('<JS>'), code.indexOf('</JS>')).replace('<JS>', '').replace('</JS>', '');

    const vm = require('vm');
    let wrapper = `(function(){ ${jsCode};  return build(${JSON.stringify(entityDef)});})();`;
    const script = new vm.Script(wrapper);
    const sandbox = {
        require: (modulePath) => {
            return require(path.resolve(__dirname, '../', modulePath));
        },
        originalCode,
        console: {
            log: (...rest) => {
                console.log.apply(console, rest);
            }
        },
    };
    const context = new vm.createContext(sandbox);
    const result = script.runInContext(context);

    code = result.code;

    for (let key in result.entityDef) {
        entityDef[key] = result.entityDef[key];
    }

    return code;
}

exports.commands = {

    "class": async (params, args) => {
        let outputFolder = global.config.backend.root;

        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let className = name + '';
        let code = await utils.readTemplateFileFromRemote('java', 'class.java');

        let namespace = params.namespace || makeNamespace(outputFolder);
        code = code.replace(/NAMESPACE/mg, namespace);

        code = code.replace(/FILE_NAME/mg, className);
        return [
            { name: className + '.java', content: code, output: outputFolder }
        ];
    },
    
    "entity": async (params, args) => {
        let outputFolder = global.config.backend.root;

        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let className = name + '';
        let code = params.entityCode ? params.entityCode : (await utils.readTemplateFileFromRemote('java', 'entity.java'));

        code = buildCode(code, params.entityDef);

        let tableName = utils.camelCaseToUnderline(className);

        let namespace = params.namespace || makeNamespace(outputFolder);
        code = code.replace(/NAMESPACE/mg, namespace);

        code = code.replace(/FILE_NAME/mg, className);

        code = code.replace(/TABLE_NAME/mg, tableName);

        let entityDef = params.entityDef;
        if (!entityDef) {
            entityDef = await describeEntityClass(className, code);
            code = code + `\n\n/*---------------------------------------- SQL -----------------------------------------\n`;
            code = code + entityDef.sql;
            code = code + `\n---------------------------------------- SQL -----------------------------------------*/\n`;
        }

        let outputs = [
            { name: className + '.java', content: code, output: outputFolder }
        ];
        if (params.dto) {
            outputs.push(await exports.commands.dto(params, args, outputFolder));
        }
        return outputs;
    },
    
    "dto": async (params, args) => {
        let outputFolder = global.config.backend.root;

        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let className = name + '';
        let code = await utils.readTemplateFileFromRemote('java', 'dto.java');
        code = buildCode(code, params.entityDef);
        code = code.replace('//DTO PROPS BEGINE', '');
        code = code.replace('//DTO PROPS END', '');

        let namespace = params.namespace || makeNamespace(outputFolder);
        code = code.replace(/NAMESPACE/mg, namespace);

        code = code.replace(/FILE_NAME/mg, className);
        return [
            { name: className + 'Dto.java', content: code, output: outputFolder }
        ];
    },
    
    "mapper": async (params, args) => {
        let outputFolder = global.config.backend.root;

        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let entityName = name;
        let tableName = utils.camelCaseToUnderline(name);

        let code = await utils.readTemplateFileFromRemote('java', 'mapper.java');
        code = buildCode(code, params.entityDef);
        code = code.replace('//MAPPER METHODS BEGINE', '');
        code = code.replace('//MAPPER METHODS END', '');

        let xml = await utils.readTemplateFileFromRemote('java', params.entityDef ? 'mapper-empty.xml' : 'mapper.xml');
        xml = buildCode(xml, params.entityDef);

        let namespace = params.namespace || makeNamespace(outputFolder);
        let entityNamespace = namespace.replace('.dao', '.entity');

        code = code.replace(/ENTITY_NAMESPACE/mg, entityNamespace);
        xml = xml.replace(/ENTITY_NAMESPACE/mg, entityNamespace);

        code = code.replace(/NAMESPACE/mg, namespace);
        xml = xml.replace(/NAMESPACE/mg, namespace);

        code = code.replace(/ENTITY_NAME/mg, entityName);
        xml = xml.replace(/ENTITY_NAME/mg, entityName);

        xml = xml.replace(/TABLE_NAME/mg, tableName);

        let outputs = [
            { name: entityName + 'Mapper.java', content: code, output: outputFolder }
        ];

        if (outputFolder.indexOf(`src${path.sep}main${path.sep}java`) >= 0) {
            let xmlFolder = outputFolder.substring(0, outputFolder.indexOf(`src${path.sep}main${path.sep}java`));
            xmlFolder += 'src/main/resources/mapper';
            await utils.mkdir(path.resolve(xmlFolder));

            outputs.push({ name: name + '.xml', content: xml, output: xmlFolder });
        }

        return outputs;
    },
    
    "service": async (params, args) => {
        let outputFolder = global.config.backend.root;

        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let className = name + 'Service';
        let implName = name + 'ServiceImpl';

        let code = await utils.readTemplateFileFromRemote('java', 'service-interface.java');
        code = buildCode(code, params.entityDef);

        let implCode = await utils.readTemplateFileFromRemote('java', 'service-impl.java');
        implCode = buildCode(implCode, params.entityDef);

        let namespace = params.namespace || makeNamespace(outputFolder);
        let entityNamespace = namespace.replace('.domain.service', '.persistence.entity');
        let mapperNamespace = namespace.replace('.domain.service', '.persistence.dao');

        code = code.replace(/ENTITY_NAMESPACE/mg, entityNamespace);
        implCode = implCode.replace(/ENTITY_NAMESPACE/mg, entityNamespace);

        code = code.replace(/MAPPER_NAMESPACE/mg, mapperNamespace);
        implCode = implCode.replace(/MAPPER_NAMESPACE/mg, mapperNamespace);

        implCode = implCode.replace(/INTERFACE_NAMESPACE/mg, namespace);

        code = code.replace(/NAMESPACE/mg, namespace);

        implCode = implCode.replace(/NAMESPACE/mg, namespace + '.impl');

        code = code.replace(/ENTITY_NAME/mg, name);
        implCode = implCode.replace(/ENTITY_NAME/mg, name);

        await utils.mkdir(path.resolve(outputFolder, 'impl'));

        return [
            { name: className + '.java', content: code, output: outputFolder },
            { name: implName + '.java', content: implCode, output: outputFolder + '/impl' }
        ];
    },
    
    "controller": async (params, args) => {
        let outputFolder = global.config.backend.root;
        
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let apiPrefix = params.apiPrefix || '';
        let entityName = name;
        let varName = entityName.charAt(0).toLowerCase() + entityName.substr(1);

        let code = await utils.readTemplateFileFromRemote('java', 'controller.java');
        code = buildCode(code, params.entityDef);
        code = code.replace('//CREATE BEGINE', '');
        code = code.replace('//CREATE END', '');
        code = code.replace('//UPDATE BEGINE', '');
        code = code.replace('//UPDATE END', '');

        let createReqCode = await utils.readTemplateFileFromRemote('java', 'create-req.java');
        createReqCode = buildCode(createReqCode, params.entityDef);
        createReqCode = createReqCode.replace('//DTO PROPS BEGINE', '');
        createReqCode = createReqCode.replace('//DTO PROPS END', '');

        let updateReqCode = await utils.readTemplateFileFromRemote('java', 'update-req.java');
        updateReqCode = buildCode(updateReqCode, params.entityDef);
        updateReqCode = updateReqCode.replace('//DTO PROPS BEGINE', '');
        updateReqCode = updateReqCode.replace('//DTO PROPS END', '');

        let deleteReqCode = await utils.readTemplateFileFromRemote('java', 'delete-req.java');
        deleteReqCode = buildCode(deleteReqCode, params.entityDef);
        deleteReqCode = deleteReqCode.replace('//DTO PROPS BEGINE', '');
        deleteReqCode = deleteReqCode.replace('//DTO PROPS END', '');

        let namespace = params.namespace || makeNamespace(outputFolder);
        let rootNamespace = params.rootNamespace;
        if (!rootNamespace) {
            let strs = namespace.split('.');
            if (strs.length > 1 && strs[strs.length - 1] === 'controller') {
                rootNamespace = namespace.replace('.controller', '');
                rootNamespace = rootNamespace.substring(0, rootNamespace.lastIndexOf('.'));
            } else {
                rootNamespace = namespace;
            }
        }
        let entityNamespace = rootNamespace + '.persistence.entity';
        let dtoNamespace = rootNamespace + '.common.dto';
        let innerDtoNamespace = namespace.replace('.controller', '.dto');
        let serviceNamespace = rootNamespace + '.domain.service';

        code = code.replace(/API_PREFIX/mg, apiPrefix);

        code = code.replace(/ENTITY_NAMESPACE/mg, entityNamespace);

        code = code.replace(/INNER_DTO_NAMESPACE/mg, innerDtoNamespace);

        code = code.replace(/DTO_NAMESPACE/mg, dtoNamespace);

        code = code.replace(/SERVICE_NAMESPACE/mg, serviceNamespace);

        code = code.replace(/NAMESPACE/mg, namespace);

        code = code.replace(/ENTITY_NAME_VAR/mg, varName);

        code = code.replace(/ENTITY_NAME/mg, entityName);

        code = code.replace(/FILE_NAME/mg, entityName);

        createReqCode = createReqCode.replace(/NAMESPACE/mg, innerDtoNamespace);
        createReqCode = createReqCode.replace(/FILE_NAME/mg, entityName);

        updateReqCode = updateReqCode.replace(/NAMESPACE/mg, innerDtoNamespace);
        updateReqCode = updateReqCode.replace(/FILE_NAME/mg, entityName);

        deleteReqCode = deleteReqCode.replace(/NAMESPACE/mg, innerDtoNamespace);
        deleteReqCode = deleteReqCode.replace(/FILE_NAME/mg, entityName);

        const dtoOutputFolder = path.resolve(outputFolder.replace(`${path.sep}controller`, ''), 'dto');
        await utils.mkdir(dtoOutputFolder);

        return [
            { name: entityName + 'Controller.java', content: code, output: outputFolder },
            { name: entityName + 'CreateReq.java', content: createReqCode, output: dtoOutputFolder },
            { name: entityName + 'UpdateReq.java', content: updateReqCode, output: dtoOutputFolder },
            { name: entityName + 'DeleteReq.java', content: deleteReqCode, output: dtoOutputFolder },
        ];
    },
    
    "repo": async (params, args) => {
        let outputFolder = global.config.backend.root;

        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let ns = args[1] ? args[1] : '';
        if (!ns || ns.startsWith('-')) {
            ns = params.ns || 'test';
        }

        let entityNamespace = ns + '.persistence.entity';
        let dtoNamespace = ns + '.common.dto';
        let mapperNamespace = ns + '.persistence.dao';
        let serviceNamespace = ns + '.domain.service';

        let folders = await findFolders(outputFolder);

        let persistenceFolder = undefined;
        let persistenceXMLFolder = undefined;
        let domainFolder = undefined;
        let commonFolder = undefined;
        
        for (let folder of folders) {
            if (folder.endsWith('-persistence')) {
                persistenceFolder = path.resolve(folder, 'src/main/java', ns.replace(/\./img, '/'), 'persistence');
                persistenceXMLFolder = path.resolve(folder, 'src/main/resources/mapper');
            } else if (folder.endsWith('-domain')) {
                domainFolder = path.resolve(folder, 'src/main/java', ns.replace(/\./img, '/'), 'domain');
            } else if (folder.endsWith('-common')) {
                commonFolder = path.resolve(folder, 'src/main/java', ns.replace(/\./img, '/'), 'common');
            }
        }

        await utils.mkdir(path.resolve(persistenceFolder, 'entity'));
        await utils.mkdir(path.resolve(persistenceFolder, 'dao'));
        if (commonFolder) await utils.mkdir(path.resolve(commonFolder, 'dto'));
        await utils.mkdir(persistenceXMLFolder);
        await utils.mkdir(path.resolve(domainFolder, 'service'));
        await utils.mkdir(path.resolve(domainFolder, 'service/impl'));

        const outputs = [

            ...await exports.commands['entity']({
                ...params,
                namespace: entityNamespace,
            }, args, path.resolve(persistenceFolder, 'entity')),

            ...await exports.commands['mapper']({
                ...params,
                namespace: mapperNamespace,
            }, args, path.resolve(persistenceFolder, 'dao')),

            ... (commonFolder ? await exports.commands['dto']({
                ...params,
                namespace: dtoNamespace,
            }, args, path.resolve(commonFolder, 'dto')) : []),

            ...await exports.commands['service']({
                ...params,
                namespace: serviceNamespace,
            }, args, path.resolve(domainFolder, 'service')),

        ];
        return outputs;
    },
    
    "crud": async (params, args) => {
        let outputFolder = global.config.backend.root;

        let name = params.name ? params.name : (args[0] ? args[0] : '');
        if (!name || name.startsWith('-')) {
            name = 'Test';
        }
        let ns = params.ns ? params.ns : (params.namespace ? params.namespace : (args[1] ? args[1] : ''));
        if (!ns || ns.startsWith('-')) {
            ns = 'test';
        }

        let rootNamespace = ns;

        let folders = await findFolders(outputFolder);

        let apiFolder = undefined;

        if (params.apiModule) {
            apiFolder = path.resolve(folder, apiModule);
        } else {
        
            for (let folder of folders) {
                if (folder.endsWith('-api')) {
                    apiFolder = path.resolve(folder, 'src/main/java', ns.replace(/\./img, '/'), 'api');
                } else if (folder.endsWith('-outapi')) {
                    apiFolder = path.resolve(folder, 'src/main/java', ns.replace(/\./img, '/'), 'outapi');
                } else if (folder.endsWith('-innerapi')) {
                    apiFolder = path.resolve(folder, 'src/main/java', ns.replace(/\./img, '/'), 'innerapi');
                } else if (folder.endsWith('-adminapi')) {
                    apiFolder = path.resolve(folder, 'src/main/java', ns.replace(/\./img, '/'), 'adminapi');
                }
    
                if (apiFolder) break;
            }
        }

        await utils.mkdir(path.resolve(apiFolder, 'controller'));

        const outputs = [

            ...await exports.commands['repo']({
                ...params,
            }, args, outputFolder),

            ...await exports.commands['controller']({
                ...params,
                rootNamespace,
            }, args, path.resolve(apiFolder, 'controller')),

        ];
        return outputs;
    },
    
    "data2crud": async (params, args) => {
        let outputFolder = global.config.backend.root;
        let filePath = args[0] ? args[0] : '';
        
        if (!filePath) {
            throw new Error('未指定目标实体类');
        }

        let entityDef = await describeEntityClass(filePath);

        let { javaCode, javaCodeLines, sql, entityName, props, tableName, rootNamespace, namespace } = entityDef;

        // return [];
        
        let outputs = await exports.commands.crud({
            ...params,
            entityDef,
        }, [ entityName, rootNamespace ], outputFolder);

        return outputs;
    }
};