
const utils = require('../utils');
const path = require('path');
const folder = path.resolve(__dirname, '../template/react');

const genComp = async (params, args, templateFile) => {
    let { scss, less, css, mobx, index } = params;
    let name = args[0] ? args[0] : '';
    if (!name || name.startsWith('-')) {
        name = params.name || 'MyComponent';
    }
    let codeFile = templateFile || 'comp.js';
    let codeFileExt = codeFile.split('.').pop();
    let code = await utils.readText(path.resolve(folder, codeFile));
    let style, styleExt;
    if (scss || less || css) {
        styleExt = scss ? 'scss' : (less ? 'less' : 'css');
        style = await utils.readText(path.resolve(folder, 'comp.' + styleExt));
        code = code.replace('//STYLE_IMPORT', `import './${name}.${styleExt}';`);
        code = code.replace(/NAME\.style/mg, 'NAME.' + styleExt);
    } else {
        code = code.replace('\r\n//STYLE_IMPORT\r\n', '');
    }

    if (mobx) {
        code = code.replace('//MOBX_IMPORT', `import { observable } from 'mobx';\r\nimport { observer } from 'mobx-react';`);
        code = code.replace('//MOBX_STATE', 'const state = observable({\r\n    //your state here\r\n});');
        code = code.replace('MOBX_DECO_START', 'observer(');
        code = code.replace('MOBX_DECO_END', ')');
        code = code.replace('//MOBX_DECO', '@observer');
    } else {
        code = code.replace('\r\n//MOBX_IMPORT\r\n', '');
        code = code.replace('\r\n//MOBX_STATE\r\n', '');
        code = code.replace('MOBX_DECO_START', '');
        code = code.replace('MOBX_DECO_END', '');
        code = code.replace('//MOBX_DECO\r\n', '');
    }

    code = code.replace(/NAME/mg, name);

    let files = [
        { name: name + '.js', content: code }
    ];

    if (style) {
        files.push({
            name: name + '.' + styleExt,
            content: style,
        });
    }

    if (index) {
        //export via index
        let indexContent = await utils.readText(path.resolve(folder, 'index.js'));
        indexContent = indexContent.replace(/NAME/mg, name);
        files.push({
            name: 'index.' + codeFileExt,
            content: indexContent,
        });
    }

    return files;
}

exports.commands = {

    comp: async (params, args) => {
        return genComp(params, args, 'comp.js');
    },

    fcomp:  async (params, args) => {
        return genComp(params, args, 'fcomp.js');
    },

    fcompts:  async (params, args) => {
        return genComp(params, args, 'fcomp.tsx');
    },
};