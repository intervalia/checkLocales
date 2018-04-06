#!/usr/bin/env node
const startTime = (new Date().valueOf());

const clc = require('cli-color');
const fs = require('fs');
const i18nRe = /{[^}]+?}/g;
const htmlRe = /<[^>]+>/g;
const path = require('path');

const VERSION = '1.0.0';
const LOCALES_FOLDER_NAME = 'locales';
const PARTIALS_FOLDER_NAME = 'partials';
const SKIP_FOLDER_LIST = ['.DS_Store', '.nyc_output', 'bower_components', 'components', '.git', 'dist', 'docs', 'reports', 'coverage', 'bin', 'node_modules', 'test', 'vendors'];

const options = {
  deleteExtra: false,
  makeBackup: false,
  recursive: false
}

var cwd = process.cwd();

console.log(clc.blueBright('\n\ncheckLocale version '+VERSION+'\n'));

process.argv.forEach(
  function (arg) {
    if (arg === '-b') {
      options.makeBackup = true;
    }
    else if (arg === '-d') {
      options.deleteExtra = true;
    }
    else if (arg === '-r') {
      options.recursive = true;
    }
    else if (arg === '-?') {
      help();
      process.exit(0);
    }
  }
);

function processStrings(data, enStrings, group) {
  var enStringKeys = Object.keys(enStrings);
  //console.log('enStrings:', enStrings);
  //console.log('enKeys: '+enStringKeys);

  Object.keys(data).forEach(
    lang => {
      var strs = data[lang].strings;
      var fn = data[lang].fileName;
      var shortFn = data[lang].shortFn;
      var newStrings = {};
      var removed = 0;
      var errors = [];

      Object.keys(strs).sort().forEach(
        stringKey => {
          if (enStringKeys.indexOf(stringKey) > -1) {
            newStrings[stringKey] = strs[stringKey];
            var results = enStrings[stringKey].match(i18nRe);
            if (results) {
              var results2 = newStrings[stringKey].match(i18nRe);
              results.some(
                key => {
                  var same = results2.indexOf(key) > -1;
                  if (!same) {
                    errors.push(`\n${clc.green(shortFn)}:\nThe string for key ${clc.green(stringKey)} was incorrectly translated. ${clc.red(key)} was translated or is missing.\nThe string "${clc.yellowBright(enStrings[stringKey])}" became "${clc.yellowBright(newStrings[stringKey])}"`);
                    return true;
                  }
                  return false;
                }
              );
            }


            results = enStrings[stringKey].match(htmlRe);
            if (results) {
              var results2 = newStrings[stringKey].match(htmlRe);
              results2.some(function(key) {
                var same = results.indexOf(key) > -1;
                if (!same) {
                  errors.push(`\n${clc.green(shortFn)}:\nThe string for key ${clc.green(stringKey)} was incorrectly translated. ${clc.red(key)} is an incorrect translation.\nThe string "${clc.yellowBright(enStrings[stringKey])}" became "${clc.yellowBright(newStrings[stringKey])}"`);
                  return true;
                }
                return false;
              });
            }
          }
          else {
            //console.log(`Key: ${clc.green(stringKey)} was not found for ${clc.green(lang)}`);
          }
        }
      );

      if (options.deleteExtra) {
        removed = Object.keys(strs).length - Object.keys(newStrings).length;
        if (removed > 0) {
          console.log(clc.yellowBright(`Removed ${removed} unused strings`));
        }
      }

      errors.forEach(function(error) {
        console.error(error);
      });

      enStringKeys.forEach(function(stringkey) {
        if (!newStrings.hasOwnProperty(stringkey)) {
          console.error(`\n${clc.green(shortFn)} is missing the key "${clc.red(stringkey)}"`);
        }
      });

      if (options.deleteExtra) {
        if (options.makeBackup) {
          var fnBak = `${fn}.bak`;
          if (fs.existsSync(fnBak)) {
            fs.unlinkSync(fnBak);
          }
          fs.renameSync(fn, fnBak);
        }
        fs.writeFileSync(fn, JSON.stringify(newStrings, null, 2)+'\n');
      }
    }
  );
}

function processFolder(startPath) {
  var fn = path.basename(startPath);
  if (fn === LOCALES_FOLDER_NAME || fn === PARTIALS_FOLDER_NAME) {
    cwd = startPath;
  }
  else {
    cwd = path.join(startPath, LOCALES_FOLDER_NAME);
  }
  console.log(`Processing for folder: ${clc.green(cwd)}`);
  var fileNames = fs.readdirSync(cwd);
  var content = {};
  fileNames.forEach(function(fileName) {
    //console.log('file: ', fileName);
    var ext = path.extname(fileName);
    if (ext === '.json') {
      var basename = path.basename(fileName, ext);
      var lang = basename.slice(-2);
      var group = basename.slice(0,-3);
      //console.log('names:', basename, group, lang);
      var fn = path.join(cwd, fileName);
      if (lang !== 'eo') {
        if (!content.hasOwnProperty(group)) {
          //console.log('Creating object for', group);
          content[group] = {
            data: {},
            enStrings: {}
          };
        }

        var strings = JSON.parse(fs.readFileSync(fn, 'utf8'));
        if (lang === 'en') {
          content[group].enStrings = strings;
        }
        else {
          content[group].data[lang] = {
            fileName: fn,
            shortFn: fileName,
            lang: lang,
            strings: strings
          };
        }
      }
    }
  });

  Object.keys(content).forEach(function(group) {
    //console.log('group:', content[group]);
    var enStrings = content[group].enStrings;
    var data = content[group].data;
    if (!enStrings) {
      console.error(clc.black.bgRed(`English strings could not be found for ${group}!`));
    }
    else {
      processStrings(data, enStrings, group);
    }
  });
}

function getSubLocaleFolders(startPath) {
  var paths = [];
  var fileList = fs.readdirSync(startPath);

  fileList.forEach(function(fileName) {
    //console.log('fileName:', fileName);
    if (SKIP_FOLDER_LIST.indexOf(fileName) === -1) {
      var newPath = path.join(startPath, fileName);
      //console.log(newPath);
      var stat = fs.statSync(newPath);
      if (stat.isDirectory()) {
        //console.log('Directory:', newPath);
        if (fileName === LOCALES_FOLDER_NAME) {
          //console.log('Adding path: '+clc.green(newPath));
          paths.push(newPath);

          // TODO: Process ALL folders under the 'locales' folder and not just partials
          var partialsPath = path.join(newPath, PARTIALS_FOLDER_NAME);
          if (fs.existsSync(partialsPath)) {
            //console.log('Adding path: '+clc.green(partialsPath));
            paths.push(partialsPath);
          }
        }
        else if (fileName === PARTIALS_FOLDER_NAME) {
          var temp = path.basename(startPath);
          if (temp === LOCALES_FOLDER_NAME) {
            //console.log('Adding path: '+clc.green(newPath));
            paths.push(newPath);
          }
        }
        else {
          paths = paths.concat(getSubLocaleFolders(newPath));
        }
      }
    }
  });

  return paths;
}

if (options.recursive) {
  var paths = getSubLocaleFolders(cwd);
  var fileName = path.basename(cwd);
  if (fileName === LOCALES_FOLDER_NAME || fileName === PARTIALS_FOLDER_NAME) {
    paths.unshift(cwd);
  }

  //console.log('paths to inspect:', paths);
  paths.forEach(function(localePath) {
    processFolder(localePath);
    console.log('\n');
  });
}
else {
  processFolder(process.cwd());
}

// Display how long it took to run
var endTime = (new Date().valueOf());
var duration = endTime-startTime;
if (duration < 1500) {
  duration += 'ms';
}
else {
  duration = (duration/1000).toFixed(2)+'sec';
}
console.log(clc.blueBright('\nFinished processing.'), `(${duration})`);


function help() {
  var options = clc.yellow('options');
  console.log(
`Check translations of strings in the non-English locale files.
Reports any strings missing from each locale file and the number of non-English strings deleted, if any.

Usage: ${clc.green('cleanlocale')} ${options}

where ${options} include:
  -b   Make backup files.
  -d   Delete strings that are no longer found in the English file.
  -r   Recursivly scan sub-folders.
  -?   Help. Output this content.
`);
}
