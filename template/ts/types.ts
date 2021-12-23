//CODES
<JS>

const utils = require('./utils');
const { findClassDefineLine, findPackageDefineLine, findIdProp, findProp, findAnnotation, findImport } = require('./parser/tools/javaParser');


async function buildType({ tsType, props, label, className }) {
    let code = `${label === className ? '' : `//${label}\n`}export type ${tsType.type} = {\n`;

    let idProp = findIdProp(props);

    for (let prop of props) {
        if (prop.field === idProp.field) continue;
        code += `    ${prop.field}${idProp && (prop.field === 'createTime' || prop.field === 'updateTime' ? '?' : '')}: ${prop.tsType.type};${prop.label === prop.field ? '' : `    //${prop.label}`}\n`;
        if (prop.jsType === 'object') {
            if (!context.relativeTypes[prop.tsType.type]) {
                let propClassDef = await findClassDef(prop.tsType.type);
                if (propClassDef) {
                    context.relativeTypes[prop.tsType.type] = propClassDef;
                }
            }
        }
    }

    code += `}${idProp ? ` & IdValue` : ''};`;
    return code;
}

async function buildEnum({ tsType, enums, label, className }) {
    let code = `${label === className ? '' : `//${label}\n`}export enum ${tsType.type} {\n`;

    let lines = [];
    for (let enumItem of enums) {
        let line = `${enumItem.name} = ${enumItem.value.value !== enumItem.name ? enumItem.value.value : `'${enumItem.name}'`},`;
        if (enumItem.label !== enumItem.name) {
            line += `    //${enumItem.label}`;
        }
        lines.push(line);
    }

    code += '    ' + lines.join('\n    ');

    code += `\n};`;
    return code;
}

async function build(classDef) {

    const { javaCode, imports, javaCodeLines, sql, tsType, props, enums, isEnum, tableName, rootNamespace, namespace } = classDef;

    let code = originalCode;

    if (isEnum) {
        code = code.replace('//CODES', await buildEnum(classDef));
    } else {
        code = code.replace('//CODES', await buildType(classDef));
    }

    return {
        code,
        classDef,
    };
}

</JS>