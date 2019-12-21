
const utils = require('../utils');
const path = require('path');
const folder = path.resolve(__dirname, '../template/web');

const gen = async (params, args, template) => {
    let name = args[0] ? args[0] : '';
    if (!name || name.startsWith('-')) {
        name = params.name || 'test';
    }

    let code = await utils.readText(path.resolve(folder, template));
    return [
        { name: name + '.html', content: code }
    ];
}

exports.commands = {

    "html": async (params, args) => {
        return gen(params, args, 'html.html');
    },

    "view": async (params, args) => {
        return gen(params, args, 'view.html');
    },
};