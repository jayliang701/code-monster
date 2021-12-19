
//TYPES

<JS>

function convertTSType(jsType) {
    if (jsType === 'datetime') return 'number';
    return jsType;
}

function buildType(typeName, props) {
    let code = `export type ${typeName} = {\n`;

    for (let prop of props) {
        prop.tsType = convertTSType(prop.jsType);
        code += `    ${prop.field}: ${prop.tsType};\n`;
    }

    code += `};`;
    return code;
}

function build(entityDef) {

    const { javaCode, imports, javaCodeLines, sql, entityName, props, tableName, rootNamespace, namespace } = entityDef;

    const utils = require('./utils');
    const { findClassDefineLine, findPackageDefineLine, findIdProp, findProp, findAnnotation, findImport } = require('./parser/tools/javaParser');

    let code = originalCode;

    code = code.replace('//TYPES', buildType(entityName, props));

    console.log(code);

    return {
        code,
        entityDef,
    };
}

</JS>