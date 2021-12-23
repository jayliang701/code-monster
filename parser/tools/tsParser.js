
const utils = require('../../utils');
const { parseComment } = require('./javaTools');

const basicTypes = [ 'string', 'number', 'Date', 'boolean' ];
const ingoresTypes = [ 'any', 'Record', 'unknown', 'SourceData' ];

const typesDefaultValues = {
    string: '\'\'',
    number: '0',
    datetime: 'new Date()',
    boolean: 'false',
};

const sharedTypeDefs = {
    'IdValue': {
        isEnum: false,
        name: 'IdValue',
        props: [ 
            {
                field: 'id',
                type: 'string',
                typeDef: undefined,
                comment: '',
                label: 'id',
                isDateTime: false,
                isBasicType: true,
            } 
        ],
        enums: undefined,
        label: 'IdValue',
        comment: '',
    }
};

const isIngoresType = (type) => {
    if (ingoresTypes.includes(type)) {
        return true;
    }
    if (type.indexOf('<') > 0) {
        type = type.substring(0, type.indexOf('<'));
        return isIngoresType(type);
    }
    return false;
}

const getTypeDefaultValue = (prop) => {
    if (prop.type.endsWith('[]')) return [];
    if (prop.type.startsWith('Record<')) return {};

    let defaultValue = typesDefaultValues[prop.isDateTime ? 'datetime' : prop.type];
    if (defaultValue === undefined || defaultValue === null) {
        defaultValue = 'undefined';
    }
    return defaultValue;
}

const findTypeDefineLine = (tsCodeLines, typeName) => {
    for (let i = 0; i < tsCodeLines.length; i ++) {
        let line = tsCodeLines[i];
        if (new RegExp(`type\\s+${typeName}\\s?=\\s?{`, 'img').test(line) ||
            new RegExp(`enum\\s+${typeName}\\s?{`, 'img').test(line)) {
            return i;
        }
    }
    return -1;
}

const findEnums = async (tsCodeLines, startLineIndex) => {
    let enums = [];
    for (let i = startLineIndex; i < tsCodeLines.length; i ++) {
        let line = tsCodeLines[i].trim();

        if (line.startsWith('}')) {
            break;
        }

        if (line.length < 1 || line.startsWith('/')) continue;

        let parts = line.split('//');
        
        let enumItemName = parts[0].replace(',', '').trim();
        let enumItemValue = enumItemName.split('=');
        if (enumItemValue.length > 1) {
            enumItemName = enumItemValue[0].trim();
            enumItemValue = enumItemValue[1].trim();
        } else {
            enumItemValue = enumItemName;
        }
        if (enumItemValue.startsWith('\'') || enumItemValue.startsWith('\"')) {
            enumItemValue = enumItemValue.substr(1, enumItemValue.length - 2);
        }

        let comment = parts[1] || '';
        let label = comment || field;

        let enumItem = {
            name: enumItemName,
            value: enumItemValue,
            comment,
            label,
        };
        enums.push(enumItem);
    }
    return enums;
}

const findTypeProps = async (tsCodeLines, startLineIndex) => {
    let props = [], propsMap = {};
    let exts;
    for (let i = startLineIndex; i < tsCodeLines.length; i ++) {
        let line = tsCodeLines[i].trim();

        if (line.startsWith('}')) {

            if (line.indexOf('&') >= 0) {
                exts = line.replace(/[,};\s]/img,'').trim().split('&');
                if (exts[0] === '') exts.splice(0, 1);
            }

            break;
        }

        if (!/[a-zA-Z0-9_]+\s?:\s?[a-zA-Z0-9_]\s?,?;?/.test(line)) continue;

        let parts = line.split('//');
        
        let field = parts[0].split(':')[0].trim();
        let type = parts[0].split(':')[1].replace(';','').trim();

        let comment = parts[1] || '';
        let label = comment || field;
        let isDateTime = false;
        if (type ==='number' && (field.endsWith('Date') || field.endsWith('DateTime') || field.endsWith('Time'))) {
            //猜测是时间类型
            isDateTime = true;
        }

        let prop = {
            field,
            type,
            typeDef: undefined,
            comment,
            label,
            isDateTime,
            isBasicType: basicTypes.includes(type),
        };

        if (!prop.isBasicType && !isIngoresType(type)) {
            //尝试查找自定义类型
            let propTypeDef = await describeType(type, { codeLines: tsCodeLines });
            prop.typeDef = propTypeDef;
        }

        props.push(prop);
        propsMap[prop.field] = prop;
    }

    if (exts && exts.length > 0) {
        //处理继承关系
        for (let ext of exts) {
            let extTypeDef = await describeType(ext, { codeLines: tsCodeLines });
            if (extTypeDef && extTypeDef.props && extTypeDef.props.length > 0) {
                //合并属性
                let mergedProps = [];
                for (let extProp of extTypeDef.props) {
                    if (propsMap[extProp.field]) continue;
                    mergedProps.push(extProp);
                }
                props.splice.apply(props, [ 0, 0 ].concat(mergedProps));
            }
        }
    }

    return props;
}

const describeType = async (typeName, src = { code: undefined, file: undefined, codeLines: undefined }) => {

    if (sharedTypeDefs[typeName]) return sharedTypeDefs[typeName];

    let tsCode, tsCodeLines;

    if (src.file) {
        tsCode = await utils.readText(src.file);
    } else if (src.code) {
        tsCode = src.code;
    } else {
        tsCodeLines = src.codeLines;
    }

    if (!tsCodeLines) {
        tsCodeLines = tsCode.split('\n');
    }

    let typeDefineLineIndex = findTypeDefineLine(tsCodeLines, typeName);
    if (typeDefineLineIndex < 0) {
        return undefined;
    }

    let isEnum = false;
    if (/\s?enum\s+/.test(tsCodeLines[typeDefineLineIndex])) {
        isEnum = true;
    }

    let props, enums; 
    
    if (isEnum) {
        enums = await findEnums(tsCodeLines, typeDefineLineIndex + 1);
    } else {
        props = await findTypeProps(tsCodeLines, typeDefineLineIndex + 1);
    }

    let comment = typeDefineLineIndex > 0 ? parseComment(tsCodeLines, typeDefineLineIndex - 1) : '';

    let label = typeName;
    if (comment) {
        if (comment.indexOf('\n') > 0) {
            comment = comment.split('\n')[0];
        } else {
            label = comment;
        }
    }

    return {
        isEnum,
        name: typeName,
        props,
        enums,
        label,
        comment,
    }
}

module.exports = {
    getTypeDefaultValue,
    describeType,
};
