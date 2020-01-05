const path = require('path');
const fs = require('fs');

exports.readFile = (url, option) => {
    return new Promise(resolve => {
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
