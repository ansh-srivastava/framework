const fs = require('fs');
const path = require('path');


const ARR_NOTFOUND = -1;
const JSON_EXT = '.json';
/*
Normalization of a class name, subject to namespace
 */
function nz(className, namespace) {
  if (className && className.indexOf('@') === ARR_NOTFOUND && namespace) {
    return `${className}@${namespace}`;
  }
  return className;
}
module.exports.normilizeNamespase = nz;

function getNS(className) {
  if (className) {
    let symNameSpace = className.indexOf('@');
    if (symNameSpace !== ARR_NOTFOUND) {
      return className.substring(++symNameSpace);
    }
  }
  return '';
}
module.exports.getNameSpace = getNS;

function getBaseName(className) {
  if (className) {
    const symNameSpace = className.indexOf('@');
    if (symNameSpace !== ARR_NOTFOUND) {
      return className.substring(0, symNameSpace);
    }
  }
  return className;
}
module.exports.getBaseName = getBaseName;

function getDirList(sourcePath) {
  const fileList = [];
  const dirList = [];
  try {
    fs.accessSync(sourcePath, fs.constants.F_OK);
    const files = fs.readdirSync(sourcePath);
    for (let i = 0; i < files.length; i++) {
      const stat = fs.lstatSync(path.join(sourcePath, files[i]));
      if (stat.isDirectory()) {
        dirList.push(files[i]);
      } else {
        fileList.push(files[i]);
      }
    }
  } catch (err) {
    throw err;
  }
  return {
    dirList,
    fileList
  };
}
module.exports.getDirList = getDirList;

function getViewsList(sourcePath, ignore) {
  const ns = path.basename(sourcePath) === 'workflows' ?
    path.basename(path.join(sourcePath, '../..')) :
    path.basename(path.join(sourcePath, '..'));
  const viewsList = [];
  getDirList(sourcePath).dirList.forEach((viewName) => {
    if (!ignore || ignore.indexOf(viewName) === ARR_NOTFOUND) {
      viewsList.push(nz(viewName, ns));
    }
  });
  return viewsList;
}
module.exports.getViewsList = getViewsList;

function getMetaFiles(pathMeta, meta = {}) {
  const metaType = path.basename(pathMeta);
  const ns = path.basename(path.join(pathMeta, '..'));
  processDir(pathMeta,
    (nm) => {return nm.substr(-JSON_EXT.length) === JSON_EXT;},
    (fn) => {
      try {
        let tempMetaClass = require(fn);
        if (metaType === 'meta') {
          meta[nz(tempMetaClass.name, tempMetaClass.namespace || ns)] = tempMetaClass;
        } else if (metaType === 'navigation') {
          meta[tempMetaClass.code] = tempMetaClass;
        } else if (metaType === 'workflows') {
          meta[nz(tempMetaClass.name, ns)] = tempMetaClass;
        } else {
          console.error('Unprocessed meta type', metaType);
        }
      } catch (err) {
        console.error('Error in', err.message);
      }
    },
    (err) => {console.error('File reading error', err);});
  return meta;
}

module.exports.getMetaFiles = getMetaFiles;

/*
 * Основана на const processDir = require('core/util/read').processDir;
 */
function processDir(dir, filter, handler) {
  try {
    fs.accessSync(dir, fs.constants.F_OK);
    let files = fs.readdirSync(dir);
    for (let i = 0; i < files.length; i++) {
      let fn = path.join(dir, files[i]);
      let stat = fs.lstatSync(fn);
      if (stat.isDirectory()) {
        processDir(fn, filter, handler);
      } else if (filter(files[i])) {
        handler(fn);
      }
    }
  } catch (err) {
      throw err;
  }
}

