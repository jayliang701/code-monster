//CODES
<JS>

const utils = require('./utils');
const { findClassDefineLine, findPackageDefineLine, findIdProp, findProp, findAnnotation, findImport } = require('./parser/tools/javaParser');


function buildType(typeName, props) {
    let code = `export type ${typeName} = {\n`;
    let exts = '';

    let idProp = findIdProp(props);

    for (let prop of props) {
        if (prop.field === idProp.field) continue;
        code += `    ${prop.field}: ${prop.tsType.type};\n`;
    }

    code += `}${idProp ? ` & IdValue` : ''};`;
    return code;
}

async function build(classDef) {

    const { javaCode, imports, javaCodeLines, sql, tsType, props, tableName, rootNamespace, namespace } = classDef;


    let code = originalCode;

    code = code.replace('//CODES', buildType(tsType.type, props));

    return {
        code,
        classDef,
    };
}

</JS>