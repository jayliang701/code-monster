
const fs = require('fs');
const path = require('path');
const utils = require('./utils');

const startup = () => {
    const args = JSON.parse(JSON.stringify(process.argv));
    const runArgs = args.splice(2);
    global.ARGS = [].concat(runArgs);
    global.VARS = {};
    for (let i = 0; i < runArgs.length; i++) {
        let key = runArgs[i];
        if (key.charAt(0) == "-") {
            key = key.substring(1);
            let temp = key.split("=");
            key = temp[0];
            let val = true;
            if (temp.length > 1) {
                val = temp[1];
                if (String(val) == "true") val = true;
                else if (String(val) == "false") val = false;
            }
            global.VARS[key] = val;
        }
    }

    if (!global.APP_ROOT) global.APP_ROOT = path.parse(process.mainModule.filename).dir;

    global.classDefs = {};

    if (process.env.CONFIG) {
        const config = JSON.parse(fs.readFileSync(process.env.CONFIG, 'utf-8'));
        global.config = config;
        global.config.backend = global.config.backend || {};
        global.config.frontend = global.config.frontend || {};
    } else {
        global.config = {
            backend: {},
            frontend: {},
        };
    }
    if (!global.config.backend.root) {
        global.config.backend.root = process.cwd();
    }
    if (!global.config.frontend.root) {
        global.config.frontend.root = process.cwd();
        try {
            fs.accessSync(path.resolve(global.config.frontend.root, 'src'), fs.constants.F_OK);
            global.config.frontend.root = path.resolve(global.config.frontend.root, 'src');
        } catch {}
    }
}

const exec = (vars, args) => {
    startup();
    let group = args[0];
    let template = args[1];

    let parser = require('./parser/' + group);

    let outputFolder = vars.output || process.cwd();
    if (outputFolder.startsWith('./')) {
        outputFolder = path.resolve(process.cwd(), outputFolder);
    }
    
    return new Promise((resolve, reject) => {
        parser.commands[template](vars, args.splice(2), outputFolder).then(async (files) => {
            for (let file of files) {
                let outFolder = file.output || outputFolder;
                let filePath = path.resolve(outFolder, file.name);
                await utils.writeFile(filePath, file.content, { encoding: typeof file.content === 'string' ? 'utf8' : 'binary' });
            }
            resolve();
        }).catch(err => {
            console.error(err);
            reject(err)
        });
    });
}

exports.run = () => {
    exec(global.VARS, global.ARGS).then(() => {
        process.exit();
    }).catch(err => {
        setTimeout(() => {
            process.exit();
        }, 50);
    });
}

exports.runAsModule = (vars, args) => {
    return exec(vars, args);
}


