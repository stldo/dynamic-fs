# Dynamic FS

A handler that reads files from memory or fallbacks to Node.js File System module. Dynamic FS doesn't handle write calls, the files are loaded during object construction. The following methods are handled by Dynamic FS:

```js
dynamicFs.createReadStream()
dynamicFs.existsSync()
dynamicFs.readFile()
dynamicFs.readFileSync()
dynamicFs.readdir()
dynamicFs.readdirSync()
dynamicFs.stat()
dynamicFs.statSync()
```

## Install

```bash
$ npm install dynamic-fs
```

## Use

```js
const DynamicFs = require('dynamic-fs');

let fs = new DynamicFs({
    '/path/to/fileA.jsx': 'import react from "react";',
});

fs.readFile('/path/to/fileA.jsx', (error, data) => {
    console.log(data); // import react from "react";
});

fs.readFile('/path/to/fileB.jsx', (error, data) => {
    // Fallbacks to Node.js fs...
});
```

## License

[The MIT License](./LICENSE)
