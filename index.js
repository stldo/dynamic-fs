const fs = require('fs');
const helpers = require('./helpers');
const stream = require('stream');

class DynamicFs {

    /**
     * Dynamic FS
     *
     * @constructor
     * @param {Object} files - An object with file paths and their contents: "{ '/path/to/file.jsx': 'include ...' }".
     */
    constructor(files = {}) {
        this.tree = {};
        for (let file in files) {
            if (files.hasOwnProperty(file)) {
                helpers.storePath(this.tree, file, files[file]);
            }
        }
    }

    createReadStream(path, options = {}) {
        let buffer = helpers.searchTree(this.tree, path);
        let error;

        if (!buffer) {
            return fs.createReadStream(path, options);
        } else if (!(buffer instanceof Buffer)) {
            error = helpers.getError();
        } else if ('string' === typeof options) {
            options = { encoding: options };
        }

        let passThroughStream = new stream.PassThrough();

        setImmediate(() => { /* The events must be emmited in the same order of fs.createReadStream() */
            if (options.encoding) {
                passThroughStream.setEncoding(options.encoding);
            }

            passThroughStream.emit('open');

            if (error) {
                passThroughStream.emit('error', error);
                passThroughStream.emit('close');
                return;
            } else if (options.start || options.end) {
                buffer = buffer.slice(options.start || 0, options.end || buffer.length);
            }

            passThroughStream.on('end', () => {
                passThroughStream.emit('close');
            });

            passThroughStream.write(buffer);
            passThroughStream.end();
        });

        return passThroughStream;
    }

    existsSync(path) {
        return !!helpers.searchTree(this.tree, path) || fs.existsSync(path);
    }

    readFile(file, options, callback) {
        if (undefined === callback) {
            callback = options;
            options = undefined;
        }

        let buffer = helpers.searchTree(this.tree, file);
        if (!buffer) {
            return fs.readFile(file, options, callback);
        }

        setImmediate(() => {
            try {
                let data = this.readFileSync(file, options);
                callback(null, data);
            } catch (error) {
                callback(error);
            }
        });
    }

    readFileSync(file, options = {}) {
        let buffer = helpers.searchTree(this.tree, file);
        if (!buffer) {
            return fs.readFileSync(file, options);
        } else if (!(buffer instanceof Buffer)) {
            throw helpers.getError();
        } else if ('string' === typeof options) {
            options = { encoding: options };
        }

        if (options.encoding) {
            return buffer.toString(options.encoding);
        }

        return buffer;
    }

    readdir(path, options, callback) {
        if (undefined === callback) {
            callback = options;
            options = undefined;
        }

        let list = helpers.searchTree(this.tree, path);
        if (!list) {
            return fs.readdir(path, options, callback);
        }

        setImmediate(() => {
            try {
                let data = this.readdirSync(path, options);
                callback(null, data);
            } catch (error) {
                callback(error);
            }
        });
    }

    readdirSync(path, options) {
        let list = helpers.searchTree(this.tree, path);

        if (!list) {
            return fs.readdirSync(path, options);
        } else if (list instanceof Buffer) {
            throw helpers.getError(path);
        }

        return Object.keys(list).sort();
    }

    stat(path, callback) {
        let entity = helpers.searchTree(this.tree, path);

        if (!entity) {
            return fs.stat(path, callback);
        }

        setImmediate(() => callback(null, this.statSync(path)));
    }

    statSync(path) {
        let entity = helpers.searchTree(this.tree, path);

        if (!entity) {
            return fs.statSync(path);
        } else if (entity instanceof Buffer) {
            return {
                isFile: helpers.stats.isTrue,
                isDirectory: helpers.stats.isFalse,
                isBlockDevice: helpers.stats.isFalse,
                isCharacterDevice: helpers.stats.isFalse,
                isSymbolicLink: helpers.stats.isFalse,
                isFIFO: helpers.stats.isFalse,
                isSocket: helpers.stats.isFalse,
            };
        } else {
            return {
                isFile: helpers.stats.isFalse,
                isDirectory: helpers.stats.isTrue,
                isBlockDevice: helpers.stats.isFalse,
                isCharacterDevice: helpers.stats.isFalse,
                isSymbolicLink: helpers.stats.isFalse,
                isFIFO: helpers.stats.isFalse,
                isSocket: helpers.stats.isFalse,
            };
        }
    }

}

module.exports = new Proxy(DynamicFs, {
    construct: (Target, args) => new Proxy(new Target(...args), {
        get: (target, property) => {
            if (property in target) {
                return target[property];
            } else {
                return fs[property];
            }
        },
    }),
});
