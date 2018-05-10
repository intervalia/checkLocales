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
  defaultLocale: 'en',
  deleteExtra: false,
  makeBackup: false,
  recursive: false
}

var cwd = process.cwd();
var hadErrors = false;

console.log(clc.blueBright('\n\ncheckLocales version '+VERSION+'\n'));

process.argv.forEach(
  function (arg) {
    if (arg === '-b') {
      options.makeBackup = true;
    }
    else if (arg === '-d') { // TODO: Skip the Linogport specific keys
      options.deleteExtra = true;
    }
    else if (arg === '-r') {
      options.recursive = true;
    }
    else if (arg === '-?') {
      help();
      process.exit(0);
    }
    else if (arg.substr(0,3) === '-l:') {
      options.defaultLocale = arg.substr(3);
    }
  }
);


function help() {
  var options = clc.yellow('options');
  console.log(
`Check translations of strings in the non-default locale files.
Reports any strings missing from each locale file and the number of non-default strings deleted, if any.
The default locale in English ('en') unless changed by the -l option.

Usage: ${clc.green('cleanlocale')} ${options}

where ${options} include:
  -b           Make backup files. This does nothing id -d is not also set.
  -d           Delete strings that are no longer found in the default file.
  -l:<locale>  Set the default locale. For example: -l:fr sets the default locale to 'fr' (French).
  -r           Recursively scan sub-folders.
  -?           Help. Output this content.
`);
}

function processStrings(data, defaultStrings, group, options) {
  var defaultStringKeys = Object.keys(defaultStrings);

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
          if (defaultStringKeys.indexOf(stringKey) > -1) {
            newStrings[stringKey] = strs[stringKey];
            var results = defaultStrings[stringKey].match(i18nRe);
            if (results) {
              var results2 = newStrings[stringKey].match(i18nRe);
              results.some(
                key => {
                  var same = results2.indexOf(key) > -1;
                  if (!same) {
                    errors.push(`${clc.green(shortFn)}:\n${clc.red('ERROR:')} The string for key ${clc.green(stringKey)} was incorrectly translated. ${clc.red(key)} was translated or is missing.\nThe string "${clc.yellowBright(defaultStrings[stringKey])}" became "${clc.yellowBright(newStrings[stringKey])}"\n`);
                    hadErrors = true;
                    return true;
                  }
                  return false;
                }
              );
            }


            results = defaultStrings[stringKey].match(htmlRe);
            if (results) {
              var results2 = newStrings[stringKey].match(htmlRe);
              results2.some(function(key) {
                var same = results.indexOf(key) > -1;
                if (!same) {
                  errors.push(`${clc.green(shortFn)}:\n${clc.red('ERROR:')} The string for key ${clc.green(stringKey)} was incorrectly translated. ${clc.red(key)} is an incorrect translation.\nThe string "${clc.yellowBright(defaultStrings[stringKey])}" became "${clc.yellowBright(newStrings[stringKey])}"\n`);
                  hadErrors = true;
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
          console.info(clc.yellowBright(`INFO: Removed ${removed} unused strings.`));
        }
      }

      errors.forEach(
        error => {
          console.error(error);
        }
      );

      defaultStringKeys.forEach(
        stringkey => {
          if (!newStrings.hasOwnProperty(stringkey)) {
            console.warn(clc.yellowBright('WARNING: ')+clc.green(shortFn)+clc.yellowBright(' is missing the key "')+clc.red(stringkey)+'"');
            //hadErrors = true; // This is really just a warning.
          }
        }
      );

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

function processFolder(startPath, options) {
  var fn = path.basename(startPath);
  if (fn === LOCALES_FOLDER_NAME || fn === PARTIALS_FOLDER_NAME) {
    cwd = startPath;
  }
  else {
    cwd = path.join(startPath, LOCALES_FOLDER_NAME);
  }
  console.info(`Processing for folder: ${clc.green(cwd)}`);
  var fileNames = fs.readdirSync(cwd);
  var content = {};
  fileNames.forEach(function(fileName) {
    var ext = path.extname(fileName);
    if (ext === '.json') {
      var basename = path.basename(fileName, ext);
      var lang = basename.slice(-2);
      var group = basename.slice(0,-3);
      var fn = path.join(cwd, fileName);
      if (lang !== 'eo') {
        if (!content.hasOwnProperty(group)) {
          content[group] = {
            data: {},
            defaultStrings: {}
          };
        }

        var strings = JSON.parse(fs.readFileSync(fn, 'utf8'));
        if (lang === options.defaultLocale) {
          content[group].defaultStrings = strings;
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
    var defaultStrings = content[group].defaultStrings;
    var data = content[group].data;
    if (!defaultStrings) {
      console.error(clc.black.bgRed(`ERROR: Default strings (${options.defaultLocale}) could not be found for ${group}!`));
    }
    else {
      processStrings(data, defaultStrings, group, options);
    }
  });
}

function getSubLocaleFolders(startPath) {
  var paths = [];
  var fileList = fs.readdirSync(startPath);

  fileList.forEach(function(fileName) {
    if (SKIP_FOLDER_LIST.indexOf(fileName) === -1) {
      var newPath = path.join(startPath, fileName);
      var stat = fs.statSync(newPath);
      if (stat.isDirectory()) {
        if (fileName === LOCALES_FOLDER_NAME) {
          paths.push(newPath);

          // TODO: Process ALL folders under the 'locales' folder and not just partials
          var partialsPath = path.join(newPath, PARTIALS_FOLDER_NAME);
          if (fs.existsSync(partialsPath)) {
            paths.push(partialsPath);
          }
        }
        else if (fileName === PARTIALS_FOLDER_NAME) {
          var temp = path.basename(startPath);
          if (temp === LOCALES_FOLDER_NAME) {
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

  paths.forEach(function(localePath) {
    processFolder(localePath, options);
    //console.log('\n');
  });
}
else {
  processFolder(process.cwd(), options);
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
console.log(clc.blueBright('checkLocales finished processing.'), `(${duration})`);

if (hadErrors) {
  process.exit(1);
}
else {
  console.log('No errors were found.');
}
