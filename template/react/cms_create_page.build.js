
const path = require('path');
const utils = require('../../utils');
const javaParser = require('../../parser/tools/javaParser');
const tsParser = require('../../parser/tools/tsParser');
const uiBuilder = require('../../parser/tools/uiBuilder');

const ingoreProps = [ 'id', 'createTime', 'updateTime', 'biz' ];

const run = async (params, args) => {

    // const { classDef } = params;
    // if (!classDef) throw new Error('invalid argument: classDef is undefined');

    const tsTypeDef = await tsParser.describeType(args[0], { file: args[1] });

    const { name, label, props } = tsTypeDef;

    const dataName = name;
    const dataVarName = dataName.charAt(0).toLowerCase() + dataName.substr(1);
    let dataUrl = params.dataUrl || utils.camelCaseToUnderline(dataName);

    let templateCode = await utils.readTemplateFileFromRemote('react', 'cms_create_page.tsx');

    templateCode = templateCode.replace(/DATA_LABEL/img, label);
    templateCode = templateCode.replace(/DATA_NAME_VAR/img, dataVarName);
    templateCode = templateCode.replace(/DATA_NAME/img, dataName);
    templateCode = templateCode.replace(/DATA_URL/img, dataUrl);

    let propsDefines = [];
    let propsSetDefaults = [];
    let propsArgs = [];
    let propsArgsSet = [];
    let formItems = [];

    let appendCodes = [];

    for (let prop of props) {
        if (ingoreProps.includes(prop.field)) continue;
        let allowUndefined = false;
        let propType = prop.type;
        if (prop.isDateTime) {
            propType = 'Date';
            allowUndefined = true;
        } 
        if (!prop.isBasicType) {
            allowUndefined = true;
        }
        propsDefines.push(`${prop.field}${allowUndefined ? '?' : ''}: ${propType};`);

        let defaultValue = tsParser.getTypeDefaultValue(prop);
        if (allowUndefined) {
            propsSetDefaults.push(`${prop.field}: undefined,`);
        } else {
            propsSetDefaults.push(`${prop.field}: ${defaultValue},`);
        }

        propsArgs.push(`${prop.field}`);

        let propRef = prop.field;
        if (allowUndefined) {
            propRef += '!';
        }
        propsArgsSet.push(`${prop.isDateTime ? `${prop.field}: ${propRef}.getTime()` : (allowUndefined ? `${prop.field}: ${propRef}` : propRef)}`);
        
        formItems.push(uiBuilder.buildFormItem(prop, { appendCodes }));
    }
    templateCode = templateCode.replace(/PROPS_SET_DEFAULT/img, propsSetDefaults.join('\n    '));
    templateCode = templateCode.replace(/PROPS_DEFINES/img, propsDefines.join('\n    '));
    templateCode = templateCode.replace(/PROPS_ARGS_SET/img, propsArgsSet.join(', \n            '));
    templateCode = templateCode.replace(/PROPS_ARGS/img, propsArgs.join(', '));
    templateCode = templateCode.replace(/FORM_ITEMS/img, formItems.join('\n                    '));

    if (appendCodes.length > 0) {
        templateCode = templateCode.replace('//APPEND_CODES', '\n' + appendCodes.join('\n') + '\n');
    } else {
        templateCode = templateCode.replace('//APPEND_CODES', '');
    }

    let outputFolder = path.resolve(config.frontend.root, 'pages');
    await require('mkdirp')(outputFolder);

    return [
        {
            name: dataName +'Create.tsx', 
            content: templateCode, 
            output: outputFolder,
        }
    ];
}
