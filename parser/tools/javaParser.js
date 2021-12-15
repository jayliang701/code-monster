
const utils = require('../../utils');
const path = require('path');
const fs = require('fs');
const javaToJavascript = require('java-to-javascript');

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

            let comment = '';
            if (part.indexOf('<') > 0) {
                //List or Map
                part = part.substring(0, part.indexOf('<')).trim();
            }
            part = part.toLowerCase();

            if (lineIndex > 2) {
                comment = parseComment(javaCodeLines, lineIndex - 1);
            }

            let annotations = parseAnnotation(javaCodeLines, lineIndex - 1);

            let jsType = JAVA_TYPE_MAPPING[part];

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
            };
        }
        lineIndex ++;
    }
    return undefined;
}

const describeEntityClass = async (filePath) => {
    let entityName = filePath.substring(filePath.lastIndexOf(path.sep) + 1).replace('.java', '');
    if (entityName.indexOf('.')) {
        entityName = entityName.substr(0, entityName.indexOf('.'));
    }
    let tableName = utils.camelCaseToUnderline(entityName);

    let javaCode = await utils.readText(filePath);
    let javaCodeLines = javaCode.split('\n');

    let jsCode = javaToJavascript(javaCode);
    jsCode = jsCode.replace(/\s+(extends|implements)\s+[a-zA-Z0-9_]+/img, '');
    let entity = eval(`(function() { ` + jsCode + ` return new ${entityName}(); })()`);

    let propsFields = Object.keys(entity);

    let namespaceDef = parseNamespace(javaCodeLines);
    if (!namespaceDef) {
        throw new Error('无法解析Java类命名空间 ---> ' + filePath);
    }

    let imports = parseImports(javaCodeLines);

    let classDefineLineIndex = findClassDefineLine(javaCodeLines);
    let tableComment = classDefineLineIndex > 0 ? parseComment(javaCodeLines, classDefineLineIndex - 1) : '';
    let sql = `CREATE TABLE \`tb_${tableName}\` (\n`;
    let cols = [];
    let props = [];
    for (let prop of propsFields) {

        let javaField = parseJavaField(javaCodeLines, prop);
        if (!javaField) throw new Error('无法解析Java类属性 ---> ' + prop);

        props.push(javaField);
    }

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

    console.log('---------------------------------------- SQL -----------------------------------------');
    console.log(sql);
    console.log('---------------------------------------- SQL -----------------------------------------');

    let srcBlock = `${path.sep}src${path.sep}main${path.sep}java`;
    let projectRoot = filePath;
    if (projectRoot.indexOf(srcBlock) > 0) {
        projectRoot = projectRoot.substr(0, projectRoot.indexOf(srcBlock));
    } else {
        projectRoot = undefined;
    }

    return {
        imports,
        javaCodeLines,
        javaCode,
        entityName,
        sql,
        props,
        tableName,
        namespace: namespaceDef.namespace,
        rootNamespace: namespaceDef.rootNamespace,
        projectRoot,
    };
}

module.exports = {
    parseComment,
    parseJavaField,
    parseNamespace,
    describeEntityClass,
    findClassDefineLine,
    findPackageDefineLine,
    findIdProp,
    findProp,
    findAnnotation,
    parseImports,
    findImport,
}