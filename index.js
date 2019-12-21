
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
}

const exec = () => {
    let group = global.ARGS[0];
    let template = global.ARGS[1];

    let parser = require('./parser/' + group);

    let outputFolder = global.VARS.output || process.cwd();
    if (outputFolder.startsWith('./')) {
        outputFolder = path.resolve(process.cwd(), outputFolder);
    }
    
    parser.commands[template](global.VARS, global.ARGS.splice(2)).then(async (files) => {
        for (let file of files) {
            let filePath = path.resolve(outputFolder, file.name);
            await utils.writeFile(filePath, file.content, { encoding: typeof file.content === 'string' ? 'utf8' : 'binary' });
        }
        process.exit();
    }).catch(err => {
        console.error(err);
        setTimeout(() => {
            process.exit();
        }, 50);
    });
}


startup();

exec();
