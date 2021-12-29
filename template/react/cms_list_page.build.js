
const path = require('path');
const utils = require('../../utils');
const javaParser = require('../../parser/tools/javaParser');
const tsParser = require('../../parser/tools/tsParser');
const uiBuilder = require('../../parser/tools/uiBuilder');

const ingoreProps = [ 'updateTime', 'biz' ];

const run = async (params, args) => {

    // const { classDef } = params;
    // if (!classDef) throw new Error('invalid argument: classDef is undefined');

    const tsTypeDef = await tsParser.describeType(args[0], { file: args[1] });

    const { name, label, props } = tsTypeDef;

    const dataName = name;
    const dataVarName = dataName.charAt(0).toLowerCase() + dataName.substr(1);
    let dataUrl = params.dataUrl || utils.camelCaseToUnderline(dataName);

    let templateCode = await utils.readTemplateFileFromRemote('react', 'cms_list_page.tsx');

    templateCode = templateCode.replace(/DATA_LABEL/img, label);
    templateCode = templateCode.replace(/DATA_NAME_VAR/img, dataVarName);
    templateCode = templateCode.replace(/DATA_NAME/img, dataName);
    templateCode = templateCode.replace(/DATA_URL/img, dataUrl);

    let tableCols = [];

    let appendCodes = [];

    for (let prop of props) {
        if (ingoreProps.includes(prop.field)) continue;
        
        let col = '{\n            ';
        let colPropLines = [];

        colPropLines.push(`title: '${prop.label}'`);
        colPropLines.push(`dataIndex: '${prop.field}'`);
        colPropLines.push(`key: '${prop.field}'`);

        if (prop.isDateTime) {
            colPropLines.push(`render(${prop.field}?: number) {\n                return ${prop.field} ? dayjs(${prop.field}).format('YYYY-MM-DD') : '';\n            }`);
        } else if (prop.typeDef) {
            if (prop.typeDef.isEnum) {
                colPropLines.push(`render(${prop.field}: ${prop.typeDef.name}) {\n                //显示枚举类型对应的UI文字\n                return ${prop.field};\n            }`);
            }
        }
        
        col += colPropLines.join(',\n            ');
        col += '\n        },';
        tableCols.push(col);
    }

    templateCode = templateCode.replace(/TABLE_COLS/img, tableCols.join('\n        '));

    if (appendCodes.length > 0) {
        templateCode = templateCode.replace('//APPEND_CODES', '\n' + appendCodes.join('\n') + '\n');
    } else {
        templateCode = templateCode.replace('//APPEND_CODES', '');
    }

    let outputFolder = path.resolve(config.frontend.root, 'pages');
    await require('./node_modules/mkdirp')(outputFolder);
    
    return [
        {
            name: dataName +'List.tsx', 
            content: templateCode, 
            output: outputFolder,
        }
    ];
}
