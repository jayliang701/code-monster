
const utils = require('../utils');
const path = require('path');
const folder = path.resolve(__dirname, '../template/react');

const genComp = async (params, args, templateFile) => {
    let { scss, less, css } = params;
    let name = args[0] ? args[0] : '';
    if (!name || name.startsWith('-')) {
        name = params.name || 'MyComponent';
    }
    let code = await utils.readText(path.resolve(folder, templateFile || 'comp.js'));
    let style, styleExt;
    if (scss || less || css) {
        styleExt = scss ? 'scss' : (less ? 'less' : 'css');
        style = await utils.readText(path.resolve(folder, 'comp.' + styleExt));
        code = code.replace('//STYLE_IMPORT', `import './${name}.${styleExt}';`);
        code = code.replace(/NAME\.style/mg, 'NAME.' + styleExt);
    } else {
        code = code.replace('\r\n//STYLE_IMPORT\r\n', '');
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

    return files;
}

exports.commands = {

    comp: async (params, args) => {
        return genComp(params, args, 'comp.js');
    },

    fcomp:  async (params, args) => {
        return genComp(params, args, 'fcomp.js');
    },
};