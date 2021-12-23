
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

const { describeEnum } = require('./javaEnumParser');

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

    if (isEnumDefineLine(javaCodeLines[classDefineLineIndex])) {
        //enum
        return describeEnum(className, javaCode);
    }

    let classComment = classDefineLineIndex > 0 ? parseComment(javaCodeLines, classDefineLineIndex - 1) : '';

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

    let classLabel = className;
    if (classComment) {
        if (classComment.indexOf('\n') > 0) {
            classLabel = classComment.split('\n')[0];
        } else {
            classLabel = classComment;
        }
    }

    return {
        isEnum: false,
        comment: classComment,
        label: classLabel,
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
    ...javaTools,
    describeEnum,
    describeClass,
    describeEntityClass,
}