
const utils = require('../../utils');
const path = require('path');
const fs = require('fs');
const javaToJavascript = require('java-to-javascript');

const JAVA_DATE_TIME_TYPES = [
    'datetime', 'date', 'localdatetime', 'localdate', 'offsetdatetime', 'offsetdate'
];

const JAVA_TYPE_MAPPING = {
    long: 'number',
    double: 'number',
    float: 'number',
    int: 'number',
    integer: 'number',
    bigdecimal: 'number',
    string: 'string',
    list: 'array',
    map: 'map',
    date: 'date',
    localdate: 'date',
    datetime: 'datetime',
    localdatetime: 'datetime',
    boolean: 'boolean',
};

const SQL_TYPE_MAPPING = {
    long: 'bigint(20)',
    double: 'double',
    float: 'double(12,2)',
    int: 'int',
    integer: 'int',
    bigdecimal: 'decimal(12,2)',
    string: (val) => {
        if (['desc', 'content', 'comment', 'article', 'memo'].indexOf(val) >= 0) {
            return 'text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci';
        } else {
            return 'varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci';
        }
    },
    list: 'json',
    map: 'json',
    date: 'datetime',
    localdate: 'datetime',
    datetime: 'datetime',
    localdatetime: 'datetime',
    boolean: 'int(1) unsigned zerofill DEFAULT \'0\'',
};

const isPropLine = (line) => {
    return line.startsWith('public ') || line.startsWith('private ') || line.startsWith('protected ');
}

const isImportLine = (line) => {
    return line.startsWith('import ');
}

const isPackageLine = (line) => {
    return line.startsWith('package ');
}

const isClassDefineLine = (line) => {
    return line.startsWith('public class ') || line.startsWith('class ') || line.startsWith('private class ') || line.startsWith('protected class ');
}

const isAnnotationCodeLine = (line) => {
    if (line.startsWith('@')) {
        const matches = line.match(/@[a-zA-Z0-9_]+/i);
        if (matches && matches[0] && line.startsWith(matches[0])) {
            return true;
        }
    }
    return false;
}

const isNonCodeLine = (line) => {
    const flag = isImportLine(line) || isPackageLine(line) || isAnnotationCodeLine(line);
    return flag;
}

const findClassDefineLine = (javaCodeLines) => {
    for (let i = 0; i < javaCodeLines.length; i ++) {
        let line = javaCodeLines[i].trim();
        if (isClassDefineLine(line)) {
            return i;
        }
    }
    return -1;
}

const findPackageDefineLine = (javaCodeLines) => {
    for (let i = 0; i < javaCodeLines.length; i ++) {
        let line = javaCodeLines[i].trim();
        if (isPackageLine(line)) {
            return i;
        }
    }
    return -1;
}

const findAnnotation = (annotations, name) => {
    if (!annotations || annotations.length < 1) return undefined;
    for (let i = 0; i < annotations.length; i ++) {
        let str = annotations[i].trim();
        if (str.startsWith(name.startsWith('@') ? name : ('@' + name))) {
            return str;
        }
    }
    return undefined;
}

const findImport = (imports, name) => {
    for (let i = 0; i < imports.length; i ++) {
        let str = imports[i].trim();
        if (str.endsWith(name)) {
            return str;
        }
    }
    return undefined;
}

const findIdProp = (props) => {
    return findProp(props, 'id');
}

const findProp = (props, field) => {
    for (let prop of props) {
        if (prop.field === field) {
            return prop;
        }
    }
    return undefined;
}

const parseComment = (javaCodeLines, startIndex) => {
    let found1 = false;
    let comment = '';
    let backIndex1 = startIndex;
    while (!found1) {
        let prevLine1 = javaCodeLines[backIndex1].trim();
        if (isPropLine(prevLine1) || isClassDefineLine(prevLine1) || isImportLine(prevLine1) || isPackageLine(prevLine1)) {
            found1 = true;
            comment = '';
        } else {
            let commentMode = prevLine1.startsWith('//') ? 1 : 0;
            if (!commentMode) commentMode = prevLine1.startsWith('*/') ? 2 : 0;
            if (commentMode) {
                found1 = true;
            
                let found2 = false;
                let prevLine2;
                let backIndex2 = commentMode === 1 ? backIndex1 : (backIndex1 - 1);
                while (!found2) {
                    prevLine2 = javaCodeLines[backIndex2].trim();
                    backIndex2 --;                    
    
                    if (prevLine2) {
                        if (comment) comment = '\n' + comment;
                        if (prevLine2.startsWith('*')) {
                            prevLine2 = prevLine2.substring(1).trim();
                        } else if (prevLine2.startsWith('//')) {
                            prevLine2 = prevLine2.substring(2).trim();
                        }
                        comment = prevLine2 + comment;
                    }
    
                    prevLine2 = javaCodeLines[backIndex2].trim();
                    
                    if (prevLine2.startsWith('/**') || 
                        isPropLine(prevLine2) || 
                        isNonCodeLine(prevLine2) || 
                        isClassDefineLine(prevLine2)) {
                        found2 = true;
                    }

                    if (backIndex2 < 0) {
                        return comment;
                    }
                }
            }
        }
        backIndex1 --;
        if (backIndex1 < 0) {
            return comment;
        }
    }
    return comment;
}

const parseAnnotation = (javaCodeLines, startIndex) => {
    let annotations = [];
    let backIndex = startIndex;
    while (backIndex >= 0) {
        let prevLine = javaCodeLines[backIndex].trim();
        if (isPropLine(prevLine) || isClassDefineLine(prevLine) || isImportLine(prevLine) || isPackageLine(prevLine)) {
            return annotations;
        } else if (prevLine.startsWith('@')) {
            let matches = prevLine.match(/@[a-zA-Z0-9_]+/img);
            if (matches && matches[0]) {
                annotations.push(prevLine);
            }
        }
        backIndex --;
    }
    return annotations;
}

const parseImports = (javaCodeLines) => {
    let classDefineLineIndex = findClassDefineLine(javaCodeLines);
    if (classDefineLineIndex < 2) return [];

    let imports = [];
    let backIndex = classDefineLineIndex - 1;
    while (backIndex >= 0) {
        let prevLine = javaCodeLines[backIndex].trim();
        if (isPackageLine(prevLine)) {
            return imports;
        } else if (prevLine.startsWith('import')) {
            let matches = prevLine.match(/import\s+[a-zA-Z0-9_\.]+/img);
            if (matches && matches[0]) {
                imports.push(prevLine.replace(/import\s+/img, '').replace(';', '').trim());
            }
        }
        backIndex --;
    }
    return imports;
}

const parseNamespace = (javaCodeLines) => {
    let packageDefineLineIndex = findPackageDefineLine(javaCodeLines);
    if (packageDefineLineIndex < 0) {
        return undefined;
    }
    let packageLine = javaCodeLines[packageDefineLineIndex].replace('package ', '').replace(';', '').trim();
    
    let namespace = packageLine;
    let rootNamespace = namespace;

    if (namespace.endsWith('.persistence.entity')) {
        rootNamespace = namespace.substring(0, namespace.length - '.persistence.entity'.length);
    }

    return {
        namespace,
        rootNamespace,
    };
}

const convertJSType = (javaType, field) => {
    let jsType = javaType;
    if (jsType.indexOf('<') > 0) {
        //List or Map
        jsType = jsType.substring(0, jsType.indexOf('<')).trim();
    }
    jsType = jsType.toLowerCase();
    jsType = JAVA_TYPE_MAPPING[jsType] || 'object';
    if (field && (field === 'id' || field.endsWith('Id')) && jsType === 'number') {
        jsType = 'string';
    }
    return jsType;
}

const convertTSType = (jsType, javaType) => {
    let tsType = {
        type: jsType,
        keyJsType: undefined,
        subJsType: undefined,
        keyTsType: undefined,
        subTsType: undefined,
        keyJavaType: undefined,
        subJavaType: undefined,
    };
    javaType = javaType.replace(/\s/img, '');
    if (jsType === 'object') {
        tsType.type = javaType;
    } else if (jsType === 'date' || jsType === 'datetime') {
        tsType.type = 'number';
    } else if (jsType === 'map') {
        if (javaType.endsWith('<String,Object>')) {
            tsType.type = 'SourceData';
        }
    } else if (jsType === 'array') {

    }

    if (javaType.indexOf('>') > 0) {
        let gType = javaType.substring(javaType.indexOf('<') + 1, javaType.indexOf('>'));
        let types = gType.split(',');

        if (types.length > 1) {
            tsType.keyJavaType = types[0];
            tsType.valueJavaType = types[1];
        } else {
            tsType.valueJavaType = types[0];
        }

        if (tsType.keyJavaType) {
            let keyJsType = convertJSType(tsType.keyJavaType);
            let keyTsType = convertTSType(keyJsType, tsType.keyJavaType);
            tsType.keyJsType = keyJsType;
            tsType.keyTsType = keyTsType;
        }
        
        let valueJsType = convertJSType(tsType.valueJavaType);
        let valueTsType = convertTSType(valueJsType, tsType.valueJavaType);
        tsType.valueJsType = valueJsType;
        tsType.valueTsType = valueTsType;

        if (jsType === 'map' && tsType.type !== 'SourceData') {
            tsType.type = `Record<${tsType.keyTsType.type}, ${valueTsType.type}>`;
        } else if (jsType === 'array') {
            tsType.type = `${valueTsType.type}[]`;
        } else if (jsType === 'object') {
            tsType.type = tsType.type.replace(`<${tsType.valueJavaType}>`, `<${tsType.valueTsType.type}>`);
        }

    }

    if (global.config && global.config.frontend && String(global.config.frontend.removeDtoInName) == 'true' && tsType.type.endsWith('Dto')) {
        tsType.type = tsType.type.substr(0, tsType.type.length - 3);
    }

    return tsType;
}

const parseJavaField = (javaCodeLines, field) => {
    let lineIndex = 0;
    for (let line of javaCodeLines) {
        let originalLineText = line;
        line = line.trim();
        if (isPropLine(line) && line.indexOf(` ${field}`) > 0) {
            let scope = line.substr(0, line.indexOf(' ')).trim();
            if (['private', 'protected', 'public'].indexOf(scope) < 0) {
                scope = 'private';
            }
            let part = line.replace(` ${field}`, '').replace(';', '').trim();
            part = part.substring(part.indexOf(' ') + 1).trim();
            let javaType = part;
            let jsType = convertJSType(javaType);

            if (field === 'id' || field.endsWith('Id')) {
                if (javaType.toLowerCase() === 'long') {
                    jsType = 'string';
                }
            }

            let comment = '';

            if (lineIndex > 2) {
                comment = parseComment(javaCodeLines, lineIndex - 1);
            }

            let annotations = parseAnnotation(javaCodeLines, lineIndex - 1);


            let tsType = convertTSType(jsType, javaType);

            return {
                lineText: originalLineText,
                annotations,
                lineIndex,
                scope,
                field,
                comment,
                type: part,
                javaType,
                jsType,
                tsType,
            };
        }
        lineIndex ++;
    }
    return undefined;
}

// const outputJavaP = async (javaClassFile) => {
//     const util = require('util');
//     const exec = util.promisify(require('child_process').exec);
//     const { stdout, stderr } = await exec('javap ' + javaClassFile);
//     if (stderr) throw new Error(stderr);

//     let javaCode = stdout;
//     let classNameLine = javaCode.match(/(public)?\s?class\s+[a-zA-Z0-9_\.]+\s+\{/img)[0].replace(/(public)?\s?class\s+/, '').replace('{', '').trim();
//     let package = classNameLine.substr(0, classNameLine.lastIndexOf('.'));
//     let className = classNameLine.substr(classNameLine.lastIndexOf('.') + 1);

//     const lines = javaCode.substr(javaCode.indexOf(classNameLine) + classNameLine.length).split('\n');

//     for (let line of lines) {
//         line = line.trim();
//         if (!line.endsWith(');')) continue;
//         if (line.indexOf(package + '.' + className + '(') >= 0) continue;
//         let scope = line.match(/{(public)|(private)|(protected)}/);
//         console.log(scope)
//     }

// }

const parseMethodParam = (str) => {
    let parts = str.trim().split(/\s/);
    let annotations = [];
    let javaType, jsType, tsType, name = parts[parts.length - 1];
    for (let part of parts) {
        if (part.startsWith('@')) {
            annotations.push(part.substr(1));
        } else {
            if (!javaType) {
                javaType = part;
                jsType = convertJSType(javaType, name);
                tsType = convertTSType(jsType, javaType);
            }
        }
    }
    return {
        name,
        jsType,
        tsType,
        javaType,
        annotations,
    }
}

const parseMethod = (javaCodeLines, namespace, imports, method) => {
    let lineIndex = -1;
    for (let line of javaCodeLines) {
        lineIndex ++;
        let matches = line.match(new RegExp(`\\s${method}\\s?\\(`));
        if (!matches) continue;

        let scope = line.match(/(public|private|protected)/);
        if (scope) {
            scope = scope[0];
        } else {
            scope = 'public';
        }

        line = line.replace(/(public|private|protected)\s+/, '').replace(/\s+\{\s+/, '').trim();
        
        let argsStr = line.substring(line.lastIndexOf('(') + 1, line.lastIndexOf(')')).replace(/\s?,\s?/img, ',');
        argsStr = argsStr.split(',');

        let params = [];
        for (let argStr of argsStr) {
            let arg = parseMethodParam(argStr);
            params.push(arg);
        }

        let returnType = {
            type: line.split(/\s/)[0],
            namespace: '',
            jsType: undefined,
            tsType: undefined,
        };
        let jsType = convertJSType(returnType.type);
        let tsType = convertTSType(jsType, returnType.type);
        
        if (jsType === 'object') {
            const returnTypeImport = findImport(imports, returnType.type);
            if (!returnTypeImport) {
                returnType.namespace = namespace;
            } else {
                returnType.namespace = returnTypeImport.substr(0, returnTypeImport.lastIndexOf('.'));
            }
        }
        returnType.jsType = jsType;
        returnType.tsType = tsType;

        //find annotations
        let annotations = [];
        if (lineIndex > 0) {
            annotations = parseAnnotation(javaCodeLines, lineIndex - 1);
        }

        return {
            name: method,
            scope,
            params,
            returnType,
            annotations,
        };
    }
}

const describeClass = async (...rest) => {

    let javaCode, className, filePath;

    if (rest.length === 1) {
        filePath = rest[0];

        className = filePath.substring(filePath.lastIndexOf(path.sep) + 1).replace('.java', '');
        if (className.indexOf('.') > 0) {
            className = className.substr(0, className.indexOf('.'));
        }

        javaCode = await utils.readText(filePath);
    } else {
        className = rest[0];
        javaCode = rest[1];
    }

    let javaCodeLines = javaCode.split('\n');

    let classDefineLineIndex = findClassDefineLine(javaCodeLines);
    let annotations = [];
    if (classDefineLineIndex > 1) {
        annotations = parseAnnotation(javaCodeLines, classDefineLineIndex - 1);
    }

    let jsCode = javaToJavascript(javaCode);
    jsCode = jsCode.replace(/\s+(extends|implements)\s+[a-zA-Z0-9_]+/img, '');
    let entity = eval(`(function() { ` + jsCode + ` return new ${className}(); })()`);

    let propsFields = Object.keys(entity);

    let namespaceDef = parseNamespace(javaCodeLines);
    if (!namespaceDef) {
        throw new Error('无法解析Java类命名空间 ---> ' + (filePath || className));
    }

    let imports = parseImports(javaCodeLines);

    let props = [];
    for (let prop of propsFields) {

        let javaField = parseJavaField(javaCodeLines, prop);
        if (!javaField) throw new Error('无法解析Java类属性 ---> ' + prop);

        props.push(javaField);
    }

    let methods = [];
    let methodNames = Object.getOwnPropertyNames(entity.constructor.prototype);
    for (let methodName of methodNames) {
        if (methodName === 'constructor') continue;
        let method = parseMethod(javaCodeLines, namespaceDef.namespace, imports, methodName);
        methods.push(method);
    }

    let jsType = convertJSType(className);
    let tsType = convertTSType(jsType, className);

    return {
        javaType: className,
        jsType,
        tsType,
        imports,
        javaCodeLines,
        javaCode,
        jsCode,
        className,
        props,
        methods,
        annotations,
        namespace: namespaceDef.namespace,
        rootNamespace: namespaceDef.rootNamespace,
    };
}

const describeEntityClass = async (...rest) => {

    let classDef = await describeClass.apply(null, rest);
    let { className, javaCode, javaCodeLines, props } = classDef;

    let tableName = utils.camelCaseToUnderline(className);

    let classDefineLineIndex = findClassDefineLine(javaCodeLines);
    let tableComment = classDefineLineIndex > 0 ? parseComment(javaCodeLines, classDefineLineIndex - 1) : '';
    let sql = `CREATE TABLE \`tb_${tableName}\` (\n`;
    let cols = [];

    if (javaCode.indexOf('AbstractEntity<')) {
        let hasId = findProp(props, 'id');
        let hasCreateTime = findProp(props, 'createTime');
        let hasUpdateTime = findProp(props, 'updateTime');

        if (!hasId) {
            props.splice(0, 0, {
                lineIndex: -1,
                scope: 'protected',
                field: 'id',
                comment: '',
                type: 'long',
                javaType: 'Long',
                jsType: 'long',
                tsType: convertTSType('number', 'Long'),
            });
        }

        if (!hasCreateTime) {
            props.push({
                lineIndex: -1,
                scope: 'protected',
                field: 'createTime',
                comment: '',
                type: 'localdatetime',
                javaType: 'LocalDateTime',
                jsType: 'datetime',
                tsType: convertTSType('datetime', 'LocalDateTime'),
            });
        }

        if (!hasUpdateTime) {
            props.push({
                lineIndex: -1,
                scope: 'protected',
                field: 'updateTime',
                comment: '',
                type: 'localdatetime',
                javaType: 'LocalDateTime',
                jsType: 'datetime',
                tsType: convertTSType('datetime', 'LocalDateTime'),
            });
        }
    }

    for (let prop of props) {
        let dbField = utils.camelCaseToUnderline(prop.field);
        prop.dbField = dbField;
        let dbFieldType = SQL_TYPE_MAPPING[prop.type];
        if (typeof dbFieldType === 'function') {
            dbFieldType = dbFieldType(prop);
        }
        cols.push(`    \`${dbField}\` ${dbFieldType} NOT NULL${prop.comment ? ` COMMENT '${prop.comment.replace(/\n/img, ' ').replace(/'/img, '\\\'')}'` : ''}`);
    }

    sql += `${cols.join(', \n')}`;

    sql += `,\n    PRIMARY KEY (\`id\`)`;

    sql += `\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci${ tableComment ? ` COMMENT '${tableComment.replace(/'/img, '\\\'')}'` : '' };`;

    return {
        ...classDef,
        entityName: className,
        sql,
        tableName,
    };
}

module.exports = {
    parseComment,
    parseJavaField,
    parseNamespace,
    describeClass,
    describeEntityClass,
    findClassDefineLine,
    findPackageDefineLine,
    findIdProp,
    findProp,
    findAnnotation,
    parseImports,
    findImport,
}