
const utils = require('../utils');
const path = require('path');
const folder = path.resolve(__dirname, '../template/react');

exports.commands = {

    comp: async (params, args) => {
        let { scss, less, css } = params;
        let name = args[0] ? args[0] : '';
        if (!name || name.startsWith('-')) {
            name = params.name || 'MyComponent';
        }
        let code = await utils.readText(path.resolve(folder, 'comp.js'));
        let style, styleExt;
        let comment = code.match(/[\r\n]\/\*style import .+ \*\/[\r\n]+/gm);
        if (scss || less || css) {
            styleExt = scss ? 'scss' : (less ? 'less' : 'css');
            style = await utils.readText(path.resolve(folder, 'comp.' + styleExt));
            // code = code.replace(comment[0], ''); Todo: !!!
            code = code.replace(/NAME\.style/mg, 'NAME.' + styleExt);
        } else {
            code = code.replace(comment[0], '');
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
};