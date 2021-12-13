
const utils = require('../utils');
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

exports.commands = {

    "class": async (params, args, outputFolder) => {
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let className = name + '';
        let code = await utils.readText(path.resolve(folder, 'class.java'));

        let namespace = params.namespace || makeNamespace(outputFolder);
        code = code.replace(/NAMESPACE/mg, namespace);

        code = code.replace(/FILE_NAME/mg, className);
        return [
            { name: className + '.java', content: code, output: outputFolder }
        ];
    },
    
    "entity": async (params, args, outputFolder) => {
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let className = name + '';
        let code = await utils.readText(path.resolve(folder, 'entity.java'));

        let tableName = utils.camelCaseToUnderline(className);

        let namespace = params.namespace || makeNamespace(outputFolder);
        code = code.replace(/NAMESPACE/mg, namespace);

        code = code.replace(/FILE_NAME/mg, className);

        code = code.replace(/TABLE_NAME/mg, tableName);
        let outputs = [
            { name: className + '.java', content: code, output: outputFolder }
        ];
        if (params.dto) {
            outputs.push(await exports.commands.dto(params, args, outputFolder));
        }
        return outputs;
    },
    
    "dto": async (params, args, outputFolder) => {
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let className = name + '';
        let code = await utils.readText(path.resolve(folder, 'dto.java'));

        let namespace = params.namespace || makeNamespace(outputFolder);
        code = code.replace(/NAMESPACE/mg, namespace);

        code = code.replace(/FILE_NAME/mg, className);
        return [
            { name: className + 'Dto.java', content: code, output: outputFolder }
        ];
    },
    
    "mapper": async (params, args, outputFolder) => {
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let entityName = name;
        let tableName = utils.camelCaseToUnderline(name);

        let code = await utils.readText(path.resolve(folder, 'mapper.java'));
        let xml = await utils.readText(path.resolve(folder, 'mapper.xml'));

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
    
    "service": async (params, args, outputFolder) => {
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'Test';
        }
        let className = name + 'Service';
        let implName = name + 'ServiceImpl';

        let code = await utils.readText(path.resolve(folder, 'service-interface.java'));
        let implCode = await utils.readText(path.resolve(folder, 'service-impl.java'));

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
    
    // "repo": async (params, args, outputFolder) => {
    //     let name = args[0] ? args[0] : '';
    //     if (!name || name.startsWith('-')) {
    //         name = params.name || 'Test';
    //     }
    //     let ns = args[1] ? args[1] : '';
    //     if (!ns || ns.startsWith('-')) {
    //         ns = params.ns || 'test';
    //     }
        
    //     let entityName = name;
    //     let tableName = utils.camelCaseToUnderline(name);

    //     let entityCode = await utils.readText(path.resolve(folder, 'entity.java'));
    //     let dtoCode = await utils.readText(path.resolve(folder, 'dto.java'));
    //     let mapperCode = await utils.readText(path.resolve(folder, 'mapper.java'));
    //     let xml = await utils.readText(path.resolve(folder, 'mapper.xml'));
    //     let interfaceCode = await utils.readText(path.resolve(folder, 'service-interface.java'));
    //     let implCode = await utils.readText(path.resolve(folder, 'service-impl.java'));

    //     let entityNamespace = ns + '.persistence.entity';
    //     let dtoNamespace = ns + '.common.dto';
    //     let mapperNamespace = ns + '.persistence.dao';
    //     let interfaceNamespace = ns + '.domain.service';
    //     let implNamespace = ns + '.domain.service.impl';

    //     entityCode = entityCode.replace(/NAMESPACE/mg, entityNamespace);
    //     entityCode = entityCode.replace(/FILE_NAME/mg, entityName);
    //     entityCode = entityCode.replace(/TABLE_NAME/mg, tableName);

    //     dtoCode = dtoCode.replace(/NAMESPACE/mg, dtoNamespace);
    //     dtoCode = dtoCode.replace(/FILE_NAME/mg, entityName);

    //     mapperCode = mapperCode.replace(/ENTITY_NAMESPACE/mg, entityNamespace);
    //     mapperCode = mapperCode.replace(/ENTITY_NAME/mg, entityName);
    //     mapperCode = mapperCode.replace(/NAMESPACE/mg, mapperNamespace);

    //     interfaceCode = interfaceCode.replace(/ENTITY_NAMESPACE/mg, entityNamespace);
    //     interfaceCode = interfaceCode.replace(/ENTITY_NAME/mg, entityName);
    //     interfaceCode = interfaceCode.replace(/NAMESPACE/mg, interfaceNamespace);

    //     implCode = implCode.replace(/ENTITY_NAMESPACE/mg, entityNamespace);
    //     implCode = implCode.replace(/ENTITY_NAME/mg, entityName);
    //     implCode = implCode.replace(/MAPPER_NAMESPACE/mg, mapperNamespace);
    //     implCode = implCode.replace(/INTERFACE_NAMESPACE/mg, interfaceNamespace);
    //     implCode = implCode.replace(/NAMESPACE/mg, implNamespace);

    //     xml = xml.replace(/ENTITY_NAMESPACE/mg, entityNamespace);
    //     xml = xml.replace(/NAMESPACE/mg, mapperNamespace);
    //     xml = xml.replace(/ENTITY_NAME/mg, entityName);
    //     xml = xml.replace(/TABLE_NAME/mg, tableName);

    //     let folders = await findFolders(outputFolder);

    //     let persistenceFolder = undefined;
    //     let persistenceXMLFolder = undefined;
    //     let domainFolder = undefined;
    //     let commonFolder = undefined;
        
    //     for (let folder of folders) {
    //         if (folder.endsWith('-persistence')) {
    //             persistenceFolder = path.resolve(folder, 'src/main/java', ns.replace(/\./img, '/'), 'persistence');
    //             persistenceXMLFolder = path.resolve(folder, 'src/main/resources/mapper');
    //         } else if (folder.endsWith('-domain')) {
    //             domainFolder = path.resolve(folder, 'src/main/java', ns.replace(/\./img, '/'), 'domain');
    //         } else if (folder.endsWith('-common')) {
    //             commonFolder = path.resolve(folder, 'src/main/java', ns.replace(/\./img, '/'), 'common');
    //         }
    //     }

    //     await utils.mkdir(path.resolve(persistenceFolder, 'entity'));
    //     await utils.mkdir(path.resolve(persistenceFolder, 'dao'));
    //     await utils.mkdir(path.resolve(commonFolder, 'dao'));
    //     await utils.mkdir(persistenceXMLFolder);
    //     await utils.mkdir(path.resolve(domainFolder, 'service'));
    //     await utils.mkdir(path.resolve(domainFolder, 'service/impl'));

    //     return [
    //         { name: entityName + '.java', content: entityCode, output: path.resolve(persistenceFolder, 'entity') },
    //         { name: entityName + 'Dto.java', content: dtoCode, output: path.resolve(commonFolder, 'dto') },
    //         { name: entityName + 'Mapper.java', content: mapperCode, output: path.resolve(persistenceFolder, 'dao') },
    //         { name: entityName + 'Service.java', content: interfaceCode, output: path.resolve(domainFolder, 'service') },
    //         { name: entityName + 'ServiceImpl.java', content: implCode, output: path.resolve(domainFolder, 'service/impl') },
    //         { name: entityName + '.xml', content: xml, output: persistenceXMLFolder },
    //     ];
    // },
    
    "repo": async (params, args, outputFolder) => {
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
};