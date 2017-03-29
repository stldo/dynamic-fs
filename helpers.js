const path = require('path');

const helpers = {

    /**
     * Generate an Error object. If path is set, it returns ENOTDIR—its default
     * message has path information. Otherwise, it returns EISDIR. DynamicFS
     * fallsback to Node file system, so only these error codes are required.
     *
     * @param {string} [path] - If ENOTDIR, represents the path to the file.
     */
    getError: (path) => {
        let message = 'EISDIR: illegal operation on a directory, read';
        let code = 'EISDIR';
        if (path) {
            message = `ENOTDIR: not a directory, scandir '${path}'`;
            code = 'ENOTDIR';
        }
        let error = new Error(message);
        error.code = code;
        return error;
    },

    /**
     * Prepare a branch on the tree to receive file contents.
     *
     * @param {Object} tree - Object representing a fs tree.
     * @param {string} path - Path to the file being stored.
     */
    preparePath: (tree, path = '') => {
        let segments = helpers.splitPath(path);
        let lastIndex = segments.length - 1;
        let branch = tree;
        let filename;
        segments.forEach((segment, index) => {
            if (lastIndex === index) {
                filename = segment;
            } else {
                if (!branch[segment]) {
                    branch[segment] = {};
                }
                branch = branch[segment];
            }
        });
        return {
            directory: branch,
            filename,
        };
    },

    /**
     * Search a tree for a specific path.
     *
     * @param {Object} tree - Object representing a fs tree.
     * @param {string} path - Path to the file being searched.
     */
    searchTree: (tree, path = '') => {
        let segments = helpers.splitPath(path);
        let segmentsLength = segments.length;
        let lastIndex = segmentsLength - 1;
        let branch = tree;
        for (let index = 0; index < segmentsLength; index++) {
            branch = branch[segments[index]] || (index !== lastIndex ? {} : null);
        }
        return branch;
    },

    /**
     * Break a path into segments to use with a tree.
     *
     * @param {string} plainPath - String representing a path.
     */
    splitPath: (plainPath = '') => {
        let normalizedPath = '.' === plainPath.charAt(0) ?
            path.join(path.dirname(module.parent.path), plainPath) :
            path.normalize(plainPath);
        return normalizedPath.split(path.sep).filter(segment => '' !== segment);
    },

    /**
     * Return values for statSync.
     */
    stats: {
        isTrue: () => true,
        isFalse: () => false,
    },

    /**
     * Store a path in a tree.
     *
     * @param {Object} tree - Object representing a fs tree.
     * @param {string} path - Path to the file which will store content.
     * @param {string|Buffer} content - Content to be stored.
     */
    storePath: (tree, path = '', content) => {
        let buffer = content instanceof Buffer ? content : Buffer.from(content);
        let pointer = helpers.preparePath(tree, path);
        pointer.directory[pointer.filename] = buffer;
    },

};

module.exports = helpers;
