# checkLocales

A Utility to check the validity of locale JSON files.

`checkLocales` validates that HTML tags and tokens `{key}` are not translated in a non-English locale file.


## Install

```
npm install --save-dev https://github.com/intervalia/checklocales.git
```

## Use

```
checkLocales -r
```

## Local File Format

All locale files are JSON files and their names include the locale that it supports. All locale file names must match (except for the locale). For example:

`strings_en.json` would be a locale file for the `en` locale and `strings_fr.json` would be for `fr`.


### Releases

| Version | Date | Description |
| --- | --- | --- |
| 1.0.0 | 6-Apr-2018 | Initial Release |