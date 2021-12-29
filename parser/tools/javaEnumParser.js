const utils = require('../../utils');
const path = require('path');
const fs = require('fs');
const javaToJavascript = require('java-to-javascript');

const javaTools = require('./javaTools');
const {
    JAVA_TYPE_MAPPING,
    SQL_TYPE_MAPPING,
    isAnnotationCodeLine,
    isClassDefineLine,
    isEnumDefineLine,
    isImportLine,
    isInterfaceDefineLine,
    isNonCodeLine,
    isPackageLine,
    convertJSType,
    convertTSType,
    parseMethod,
    parseComment,
    parseJavaField,
    parseNamespace,
    parseAnnotation,
    findClassDefineLine,
    findPackageDefineLine,
    findIdProp,
    findProp,
    findAnnotation,
    parseImports,
    findImport,
} = javaTools;

const describeEnum = async (...rest) => {
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
    let classComment = classDefineLineIndex > 0 ? parseComment(javaCodeLines, classDefineLineIndex - 1) : '';

    let annotations = [];
    if (classDefineLineIndex > 1) {
        annotations = parseAnnotation(javaCodeLines, classDefineLineIndex - 1);
    }
    
    let namespaceDef = parseNamespace(javaCodeLines);
    if (!namespaceDef) {
        throw new Error('无法解析Java命名空间 ---> ' + (filePath || className));
    }

    let enumLines = [];
    let enums = [];
    let enumFields = [];
    for (let i = classDefineLineIndex; i < javaCodeLines.length; i++) {
        let line = javaCodeLines[i].replace(/[\r\n]/img, '').trimLeft();
        if (line.trim() === '') continue;

        if (line.endsWith(';')) {
            break;
        }

        if (line.startsWith(';') || line.startsWith('@') || line.startsWith('/') || line.startsWith('*') || line.startsWith('private')
        || line.startsWith('public') || line.startsWith('protected') || line.startsWith('static') || line.startsWith('final')) {
            continue;
        }

        line = line.trim();
        if (line.endsWith(',') || line.endsWith(';') || line.endsWith(')') || /[a-zA-Z0-9_]/.test(line.charAt(line.length - 1)) ||
            (line.indexOf(',') > 0 && line.indexOf('//') > 0) || 
            line.replace(/[a-zA-Z0-9_]+/img, '') === ''  || 
            line.replace(/[a-zA-Z0-9_]+/img, '').trim().startsWith('//')  || 
            line.replace(/[a-zA-Z0-9_]+/img, '').trim().startsWith('/*')) {
            let comment = '';
            if (line.indexOf('//') > 0) {
                let parts = line.split('//', 2);
                comment = parts[1].trim();
                line = parts[0].trim();
            }
            enumLines.push(line);
            
            let enumItemName = line.replace(/,\s+/img, '<|>').replace(',', '').trim();
            let enumArgs = [];
            if (enumItemName.indexOf('(') > 0) {
                enumArgs = enumItemName.substring(enumItemName.indexOf('(')).replace('(', '').replace(')', '').split('<|>');

                enumItemName = enumItemName.substring(0, enumItemName.indexOf('('));
            }

            if (enumArgs.length < 1) {
                enumArgs.push(enumItemName);
            }

            let enumItem = {
                name: enumItemName,
                comment,
                label: comment || enumItemName,
                value: undefined,
                args: enumArgs,
            };

            enums.push(enumItem);
        }
    }

    
    for (let i = classDefineLineIndex; i < javaCodeLines.length; i++) {
        let line = javaCodeLines[i].replace(/[\r\n]/img, '').trim();
        if (line.startsWith(className)) {
            let argsStr = line.substring(line.indexOf('(') + 1, line.lastIndexOf(')')).replace(/\s+/img, ' ').replace(/,\s+/img, ',').trim();
            let args = argsStr.split(',');
            for (let arg of args) {
                let argDef = arg.split(' ');
                let argType = argDef[0];
                let argName = argDef[1];

                let argField = parseJavaField([ `private ${arg}` ], argName);
                enumFields.push(argField);
            }
            break;
        }
    }

    if (enumFields.length < 1) {
        enumFields.push(parseJavaField([ `private String value;` ], 'value'));
    }

    for (let enumItem of enums) {
        enumItem.args.forEach((arg, index) => {
            let fieldInfo = enumFields[index];
            if (fieldInfo.tsType.type === 'number') {
                arg = Number(arg);
            }
            let argInfo = {
                value: arg,
                ...fieldInfo,
            };
            enumItem.args[index] = argInfo;
        });
        enumItem.value = enumItem.args[0];
    }

    let classLabel = className;
    if (classComment) {
        if (classComment.indexOf('\n') > 0) {
            classLabel = classComment.split('\n')[0];
        } else {
            classLabel = classComment;
        }
    }
    
    return {
        isEnum: true,
        enums: enums,
        comment: classComment,
        label: classLabel,
        javaType: className,
        jsType: 'object',
        tsType: {
            type: className,
        },
        imports: [],
        javaCodeLines,
        javaCode,
        jsCode: undefined,
        className,
        props: undefined,
        methods: undefined,
        annotations,
        namespace: namespaceDef.namespace,
        rootNamespace: namespaceDef.rootNamespace,
    }

}

module.exports = {
    ...javaTools,
    describeEnum,
}