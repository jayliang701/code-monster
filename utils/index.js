const path = require('path');
const fs = require('fs');
const axios = require('axios');

if (typeof String.prototype.replaceAll === "undefined") {
	
	const stringReplaceAll = (string, match, replacer) => {
		let index = string.indexOf(match);
		if (index === -1) {
			return string;
		}

		let newStr = string.replace(match, replacer);
		return stringReplaceAll(newStr, match, replacer);
	};
	
    String.prototype.replaceAll = function(match, replace) {
       return stringReplaceAll(this, match, replace).toString();
    }
}

exports.sleep = (time) => {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    });
}

exports.checkFileExists = async (filePath) => {
    try {
        await require('fs/promises').access(filePath, fs.constants.F_OK);
        return true
    } catch {
        return false
    }
}

exports.lookUpDir = (folder, ignores, mapFunc) => {
    if (typeof ignores === 'function') {
        mapFunc = ignores;
        ignores = undefined;
    }
    ignores = ignores || [ '.git', '.svn', 'tmp', 'temp' ];
    return new Promise(async (resolve) => {
        let files = await require('fs/promises').readdir(folder);
        for (let file of files) {
            if (ignores && ignores.length > 0 && ignores.indexOf(file) >= 0) continue;
            let stop = await mapFunc(file, path.resolve(folder, file));
            if (stop === true) {
                resolve(true);
                return;
            }
        }
        resolve();
    });
}

exports.deepLookUpDir = async (folder, ignores, mapFunc) => {
    if (typeof ignores === 'function') {
        mapFunc = ignores;
        ignores = undefined;
    }

    if (folder instanceof Array) {
        for (let targetFolder of folder) {
            let stop1 = await exports.lookUpDir(targetFolder, ignores, async (file, filePath) => {
                let stop2 = undefined;
                if (fs.lstatSync(filePath).isDirectory()) {
                    stop2 = await exports.deepLookUpDir(filePath, ignores, mapFunc);
                    if (stop2) return true;
                }
                stop2 = await mapFunc(file, filePath);
                if (stop2) return true;
            });
            if (stop1) return;
        }
    } else {
        await exports.lookUpDir(folder, ignores, async (file, filePath) => {
            let stop = undefined;
            if (fs.lstatSync(filePath).isDirectory()) {
                stop = await exports.deepLookUpDir(filePath, ignores, mapFunc);
                if (stop) return true;
            }
            stop = await mapFunc(file, filePath);
            if (stop) return true;
        });
    }
}

exports.readFromRemote = async (url) => {
    const { data } = await axios.get(url);
    return data;
}

exports.readTemplateFileFromRemote = async (group, file) => {
    if (process.env.DEBUG) {
        return exports.readText(path.resolve(__dirname, '../template', group, file));
    }
    return exports.readFromRemote(`https://gitee.com/lgks701/ugeez-code-templates/raw/master/template/${group}/${file}`);
}

exports.readFile = (url, option) => {
    return new Promise((resolve, reject) => {
        fs.readFile(url, option, (err, content) => {
            if (err) return reject(err);
            return resolve(content);
        });
    });
}

exports.readText = (url) => {
    return exports.readFile(url, { encoding: 'utf-8' });
}

exports.writeFile = (url, content, option) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(url, content, option, (err) => {
            if (err) return reject(err);
            return resolve();
        });
    });
}

exports.writeText = (url, content) => {
    return exports.writeFile(url, content, { encoding: 'utf-8' });
}

exports.mkdir = (url) => {
    return new Promise((resolve, reject) => {
        fs.mkdir(url, { recursive: true }, err => {
            if (err) return reject(err);
            resolve();
        });
    });
}

exports.camelCaseToUnderline = (name) => {
    let len = name.length;
    let newName = '';
    for (let i = 0; i < len; i ++) {
        let char = name.charAt(i);
        if (char.toUpperCase() === char) {
            char = char.toLowerCase();
            if (i > 0) {
                let prevChar = name.charAt(i - 1);
                if (prevChar.toLowerCase() === prevChar) {
                    char = '_' + char;
                } else {
                    if (i < len - 1) {
                        let nextChar = name.charAt(i + 1);
                        if (nextChar.toLowerCase() === nextChar) {
                            char = '_' + char;
                        } 
                    }
                }
            }
        }
        newName += char;
    }
    return newName;
}