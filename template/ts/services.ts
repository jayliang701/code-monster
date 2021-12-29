
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
    let extraCode = [];
    let propSetters = [];
    for (let prop of classDef.props) {
        let propMapping = `${instanceName}.${prop.field}`;
        if (prop.jsType === 'map') {
            propMapping += ' || {}';
        } else if (prop.jsType === 'array') {
            propMapping += ' || []';
            if (prop.tsType.valueJsType === 'object') {
                let retClassDef = await findClassDef(prop.tsType.valueTsType.type);
                if (retClassDef) context.relativeTypes[prop.tsType.valueTsType.type] = retClassDef;

                if (retClassDef && !retClassDef.isEnum) {
                    let convt = await buildConvertMethod(retClassDef);
                    extraCode.push(convt.code);
                    propMapping = `(${propMapping}).map(item => { return ${convt.name}(item); })`;
                }
            } else {
                propMapping = `(${propMapping}).map(item => { return item; })`;
            }
        } else if (prop.jsType === 'object') {
            let retClassDef = await findClassDef(prop.tsType.type);
            if (retClassDef) context.relativeTypes[prop.tsType.type] = retClassDef;

            if (retClassDef && !retClassDef.isEnum) {
                let convt = await buildConvertMethod(retClassDef);
                extraCode.push(convt.code);
                propMapping = `${convt.name}(${propMapping})`;
            }
        }
        propSetters.push(`${prop.field}: ${propMapping},`);
    }
    let indentSpace = buildIndent(indent);
    return {
        code: `{\n    ${indentSpace}${propSetters.join(`\n    ${indentSpace}`)}\n    ${buildIndent(indent - 4)}}`,
        extraCode: extraCode.join('\n\n'),
    };
}

async function buildConvertMethod(classDef) {
    let returnType = classDef.tsType.type;
    let propSettersRet = await buildPropSetters(classDef, 'obj');
    let methodName = `convert${returnType}`;
    let code = `export const ${methodName} = (obj: SourceData): ${returnType} => {\n    const item: ${returnType} = ${propSettersRet.code};\n    return item;\n};`;
    
    if (propSettersRet.extraCode) {
        code = propSettersRet.extraCode + '\n\n' + code;
    }

    return {
        code,
        name: methodName,
    };
}

async function buildAPI(method, apiDef) {
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

            returnStr = `return convertSearchResult<${method.returnType.tsType.valueTsType.type}>(res, (obj) => {\n        const item: ${method.returnType.tsType.valueTsType.type} = ${convertMethod.name}(obj);\n        return item;\n    });\n`;
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

            let requestMappingAnn = findAnnotation(apiDef.annotations || [], 'RequestMapping');
            if (requestMappingAnn) {
                let urlPrefix = requestMappingAnn.match(/(value)?\s?=?\s?"\/?.+"/img);
                if (urlPrefix) {
                    urlPrefix = urlPrefix[0];
                    urlPrefix = urlPrefix.substring(urlPrefix.indexOf('"') + 1, urlPrefix.lastIndexOf('"'));
                    if (!urlPrefix.startsWith('/')) urlPrefix = "/" + urlPrefix;
                    if (urlPrefix.endsWith('/')) urlPrefix = urlPrefix.substr(0, urlPrefix.length - 1);

                    url = urlPrefix + url;
                }
            }
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

            if (args.length === 1 && (dtoDef.className.endsWith('CreateReq') || dtoDef.className.endsWith('UpdateReq'))) {
                let guessDtoName = dtoDef.className.replace(/(Create|Update)Req/img, '');
                let existingGuestDtoType = relativeTypes[guessDtoName];
                if (existingGuestDtoType) {
                    //猜测是CRUD接口
                    args = [ `data: ${existingGuestDtoType.tsType.type}` ];
                    retriveDto = retriveDto.replace(` = ${dtoParam.name};`, ` = data;`);
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

async function build(classDef) {

    const { javaCode, imports, javaCodeLines, sql, entityName, props, methods, tableName, rootNamespace, namespace } = classDef;


    let code = originalCode;

    let contents = [];
    for (let method of methods) {
        contents.push(await buildAPI(method, classDef));
    }

    code = code.replace('//CODES', contents.join('\n\n'));

    return {
        code,
        classDef,
    };
}

</JS>