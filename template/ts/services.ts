
//CODES

<JS>

const utils = require('./utils');
const { describeClass, findAnnotation, findImport } = require('./parser/tools/javaParser');

function findOnlyIdProp(classDef) {
    let idProp;
    for (let prop of classDef.props) {
        if (prop.field.toLowerCase().endsWith('id')) {
            idProp = prop;
        } else {
            return undefined;
        }
    }
    return idProp;
}

function buildIndent(len) {
    let str = '';
    for (let i = 0; i < len; i ++) {
        str += ' ';
    }
    return str;
}

async function buildPropSetters(classDef, instanceName = 'res', indent = 4) {
    let propSetters = [];
    for (let prop of classDef.props) {
        let propMapping = `${instanceName}.${prop.field}`;
        if (prop.jsType === 'map') {
            propMapping += ' || {}';
        } else if (prop.jsType === 'array') {
            propMapping += ' || []';

            propMapping = `(${propMapping}).map(item => ${await buildPropSetters()})`
        }
        propSetters.push(`${prop.field}: ${propMapping},`);
    }
    let indentSpace = buildIndent(indent);
    return `{\n    ${indentSpace}${propSetters.join(`\n    ${indentSpace}`)}\n    ${buildIndent(indent - 4)}}`;
}

async function buildConvertMethod(classDef) {
    let returnType = classDef.tsType.type;
    let methodName = `convert${returnType}`;
    let code = `export const ${methodName} = (obj: SourceData): ${returnType} => {\n    const item: ${returnType} = ${await buildPropSetters(classDef, 'obj')};\n    return item;\n};`;
    return {
        code,
        name: methodName,
    };
}

async function buildAPI(method, entityDef) {
    let args = [];
    let methodName = method.name;
    if (methodName === 'delete') methodName = 'remove';

    for (let arg of method.params) {
        let argStr = `${arg.name}: ${arg.tsType.type}`;
        args.push(argStr);
    }

    //Promise<SearchResult<Patient>>
    let apiRet, ret, returnStr, retriveDto;
    let relativeTypes = context.relativeTypes || {};
    context.relativeTypes = relativeTypes; 
    let convertMethods = context.convertMethods || {};
    context.convertMethods = convertMethods; 
    if (method.returnType.type !== 'void') {
        apiRet = '    const res: SourceData = ';
        returnStr = `return res;\n`;
        ret = method.returnType.tsType.type;

        if (ret.startsWith('IdDTO<')) {
            ret = 'string';
            returnStr = `return res.id;\n`;
        } else if (ret.startsWith('IPage<') || ret.startsWith('Page<') || ret.startsWith('CommonPage<')) {
            let gType = ret.substring(ret.indexOf('<') + 1, ret.indexOf('>'));
            ret = `SearchResult<${gType}>`;

            let valueClassDef = await findClassDef(method.returnType.tsType.valueJavaType);
            relativeTypes[method.returnType.tsType.valueTsType.type] = valueClassDef;

            let convertMethod = convertMethods[method.returnType.tsType.valueTsType.type];
            if (!convertMethod) {
                convertMethod = await buildConvertMethod(valueClassDef);
                convertMethods[method.returnType.tsType.valueTsType.type] = convertMethod;
            }

            returnStr = `return convertSearchResult(res, (obj) => {\n        const item: ${method.returnType.tsType.valueTsType.type} = ${convertMethod.name}(obj);\n        return item;\n    });\n`;
        } else if (method.returnType.jsType === 'object') {
            let retClassDef = await findClassDef(method.returnType.type);
            relativeTypes[method.returnType.tsType.type] = retClassDef;

            if (retClassDef) {
                let convertMethod = convertMethods[method.returnType.tsType.type];
                if (!convertMethod) {
                    convertMethod = await buildConvertMethod(retClassDef);
                    convertMethods[method.returnType.tsType.type] = convertMethod;
                }

                returnStr = `const obj: ${ret} = ${convertMethod.name}(res);\n    return obj;\n`;
            } else {
                returnStr = 'return res';
            }
        }

    } else {
        ret = 'void';
    }

    let code;

    let getAnn = findAnnotation(method.annotations, 'GetMapping');
    let postAnn = getAnn ? undefined : findAnnotation(method.annotations, 'PostMapping');

    let ann = getAnn || postAnn;
    let url;
    if (ann) {
        url = ann.match(/(value)?\s?=?\s?"\/?.+"/img);
        if (url) {
            url = url[0];
            url = url.substring(url.indexOf('"') + 1, url.lastIndexOf('"'));
            if (!url.startsWith('/')) url = "/" + url;
        }
    }

    let params = [];
    if (getAnn) {
        for (let arg of method.params) {
            params.push(arg.name);
        }
    } else {
        let dtoParam = method.params[0];
        let dtoDef;
        //查找类属性
        await utils.deepLookUpDir([ config.backend.root, ...(config.backend.includes || []) ], [ 'target', '.git', '.svn', 'tmp', 'temp', 'node_modules', 'resources' ], async (file, filePath) => {
            if (file === (dtoParam.tsType.type + '.java')) {
                dtoDef = await describeClass(filePath);
                return true;
            }
        });
        if (dtoDef) {
            
            let dtoIdProp = findOnlyIdProp(dtoDef);
            if (dtoIdProp) {
                ret = dtoIdProp.tsType.type;
                params.push(dtoIdProp.field);
                args = [ `${dtoIdProp.field}: ${dtoIdProp.tsType.type}` ];
            } else {
                for (let prop of dtoDef.props) {
                    params.push(prop.field);
                }
                if (params.length > 0) {
                    retriveDto = `    const { ${params.join(', ')} } = ${dtoParam.name};\n`;
                }
            }

        }
    }

    code = `export const ${methodName} = async (` + args.join(', ') + `): Promise<${ret}> => {\n`;
    
    if (retriveDto) {
        code += retriveDto;
    }

    code += `${apiRet ? apiRet : '    '}await ${getAnn ? 'get' : 'post'}('${url}', {${params.length > 0 ? `\n        ${params.join(', \n        ')}\n    ` : ''}});\n`;


    if (returnStr) {
        code += '\n    ' + returnStr;
    }

    code += `};`;
    return code;
}

async function build(entityDef) {

    const { javaCode, imports, javaCodeLines, sql, entityName, props, methods, tableName, rootNamespace, namespace } = entityDef;


    let code = originalCode;

    let contents = [];
    for (let method of methods) {
        contents.push(await buildAPI(method, entityDef));
    }

    code = code.replace('//CODES', contents.join('\n\n'));

    return {
        code,
        entityDef,
    };
}

</JS>