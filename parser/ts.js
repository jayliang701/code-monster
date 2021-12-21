
const utils = require('../utils');
const path = require('path');
const fs = require('fs/promises');

const javaParser = require('./tools/javaParser');

const buildCode = (code, entityDef, context) => {
    return new Promise((resolve, reject) => {
        if (code.indexOf('</JS>') < 0) {
            resolve(code);
            return;
        }
    
        let originalCode = code.substr(0, code.indexOf('<JS>'));
    
        if (!entityDef) {
            resolve(originalCode);
            return;
        }
    
        let jsCode = code.substr(code.indexOf('<JS>'), code.indexOf('</JS>')).replace('<JS>', '').replace('</JS>', '');

        const sandbox = {
            config: global.config,
            // require: (modulePath) => {
            //     return require(path.resolve(__dirname, '../', modulePath));
            // },
            originalCode,
            context: context || {},
            findClassDef,
        };
    
        const { NodeVM } = require("vm2");
        const vm = new NodeVM({
            require: {
                root: path.resolve(__dirname, '../'),
                builtin: ['*'],
                resolve: (modulePath) => {
                    return path.resolve(__dirname, '../', modulePath);
                },
                external: true,

            },
            sandbox,
        });

        // let wrapper = `(function(){ ${jsCode};  return build(${JSON.stringify(entityDef)});})();`;
        let vmExports = vm.run(`module.exports.build = (function(){ ${jsCode};  return build;})();`, path.resolve(__dirname, '../'));

        vmExports.build(entityDef).then(res => {
            code = res.code;

            for (let key in res.entityDef) {
                entityDef[key] = res.entityDef[key];
            }
        
            resolve(code);
        }).catch(err => {
            console.error(err);
        });
    
    });
}

const buildTypeCode = async (classDef) => {
    let context = {
        relativeTypes: []
    };
    let tsCode = await utils.readTemplateFileFromRemote('ts', 'types.ts');
    tsCode = await buildCode(tsCode, classDef, context);
    return tsCode;
}

const findClassDef = async (javaType) => {
    let classDef = global.classDefs[javaType];
    if (!classDef) {
        await utils.deepLookUpDir([ config.backend.root, ...(config.backend.includes || []) ], [ 'target', '.git', '.svn', 'tmp', 'temp', 'node_modules', 'resources' ], async (file, filePath) => {
            if (file === (javaType + '.java')) {
                classDef = await javaParser.describeClass(filePath);
                global.classDefs[javaType] = classDef;
                global.classDefs[file] = classDef;
                global.classDefs[filePath] = classDef;
                return true;
            }
        });
    }
    return classDef;
}

exports.commands = {

    class2type: async (params, args) => {

        const classFilePath = args[0];

        const tsFilePath = args[1] || path.resolve(global.config.frontend.root, global.config.frontend.types);

        const classDef = params.classDef || (await javaParser.describeEntityClass(classFilePath));
        
        let tsCode = await buildTypeCode(classDef);

        let existingTypesCode = await fs.readFile(tsFilePath, 'utf-8');

        existingTypesCode += `\n\n/* ---- ${new Date().toLocaleString()} ---- */\n${tsCode}/* --------------------- */`;

        return [
            { name: tsFilePath.substring(tsFilePath.lastIndexOf(path.sep) + 1), content: existingTypesCode, output: tsFilePath.substring(0, tsFilePath.lastIndexOf(path.sep)) }
        ];
    },

    api2sdk: async (params, args) => {

        const apiFilePath = args[0];

        const tsServicesFilePath = args[1] || path.resolve(global.config.frontend.root, global.config.frontend.services);

        const tsTypesFilePath = args[2] || path.resolve(global.config.frontend.root, global.config.frontend.types);

        const apiDef = await javaParser.describeClass(apiFilePath);
        
        let context = {
            relativeTypes: {},
            convertMethods: {},
        };
        let tsServicesCode = await utils.readTemplateFileFromRemote('ts', 'services.ts');
        tsServicesCode = await buildCode(tsServicesCode, apiDef, context);

        let existingCode = await fs.readFile(tsServicesFilePath, 'utf-8');

        let extCodes = [];

        for (let key in context.relativeTypes) {
            let relativeTypeDef = context.relativeTypes[key];
            let classCode = await buildTypeCode(relativeTypeDef);
            extCodes.push(classCode);
        }

        for (let key in context.convertMethods) {
            let methodCode = context.convertMethods[key].code;
            extCodes.push(methodCode);
        }

        let outputs = [];

        if (extCodes.length > 0) {

            if (tsTypesFilePath) {
                let existingTsTypesCode = await fs.readFile(tsTypesFilePath, 'utf-8');
                existingTsTypesCode += `\n\n/* ---- ${new Date().toLocaleString()} ---- */\n${extCodes.join('\n\n')}\n/* --------------------- */`;
                outputs.push({ 
                    name: tsTypesFilePath.substring(tsTypesFilePath.lastIndexOf(path.sep) + 1), 
                    content: existingTsTypesCode, 
                    output: tsTypesFilePath.substring(0, tsTypesFilePath.lastIndexOf(path.sep)) 
                });
            } else {
                tsServicesCode = extCodes.join('\n\n') + '\n' + tsServicesCode;
            }
        }

        existingCode += `\n\n/* ---- ${new Date().toLocaleString()} ---- */\n${tsServicesCode}/* --------------------- */`;

        outputs.push(
            { name: tsServicesFilePath.substring(tsServicesFilePath.lastIndexOf(path.sep) + 1), content: existingCode, output: tsServicesFilePath.substring(0, tsServicesFilePath.lastIndexOf(path.sep)) }
        );

        return outputs;
    },
};