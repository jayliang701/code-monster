//CODES
<JS>

const utils = require('./utils');
const { findClassDefineLine, findPackageDefineLine, findIdProp, findProp, findAnnotation, findImport } = require('./parser/tools/javaParser');


function buildType(typeName, props) {
    let code = `export type ${typeName} = {\n`;

    for (let prop of props) {
        code += `    ${prop.field}: ${prop.tsType.type};\n`;
    }

    code += `};`;
    return code;
}

async function build(entityDef) {

    const { javaCode, imports, javaCodeLines, sql, tsType, props, tableName, rootNamespace, namespace } = entityDef;


    let code = originalCode;

    code = code.replace('//CODES', buildType(tsType.type, props));

    return {
        code,
        entityDef,
    };
}

</JS>