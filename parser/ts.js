
const utils = require('../utils');
const path = require('path');
const fs = require('fs/promises');

const javaParser = require('./tools/javaParser');

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

    dto2sdk: async (params, args) => {

        const dtoFilePath = `H:\\project\\jay\\code-monster\\test\\java-web-app\\java-web-app-common\\src\\main\\java\\com\\jay\\demo\\common\\dto\\CompanyDto.java`;

        const tsFilePath = `H:\\project\\jay\\code-monster\\test\\react-app\\src\\types.ts`;

        const dtoDef = await javaParser.describeEntityClass(dtoFilePath);
        
        let typesCode = await utils.readTemplateFileFromRemote('ts', 'types.ts');
        typesCode = buildCode(typesCode, dtoDef);

        let existingTypesCode = await fs.readFile(tsFilePath, 'utf-8');

        existingTypesCode += `\n\n/* ---- ${new Date().toLocaleString()} ---- */${typesCode}/* --------------------- */`;

        return [
            { name: tsFilePath.substring(tsFilePath.lastIndexOf(path.sep) + 1), content: existingTypesCode, output: tsFilePath.substring(0, tsFilePath.lastIndexOf(path.sep)) }
        ];
    },
};