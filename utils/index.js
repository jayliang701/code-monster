const path = require('path');
const fs = require('fs');
const axios = require('axios');

exports.readFromRemote = async (url) => {
    const { data } = await axios.get(url);
    return data;
}

exports.readTemplateFileFromRemote = async (group, file) => {
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