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

The string files are a flat JSON file that uses Key/Value pairs.

#### `strings_en.json` Example:

```JSON
{
  "BUTTON_CANCEL": "Cancel",
  "BUTTON_HTML": "<button class=\"my-button\">Buy a kite</button>"
  "BUTTON_OK": "OK",
  "LABEL_HIDE_DETAILS": "Hide Details",
  "LABEL_IMAGE_X_OF_Y": "Image %{number} of %{count}",
  "LABEL_SHOW_DETAILS": "Show Details"
}
```


## CLI Options

Here is the list of available command-line options for `checkLocales`.

| Options | Description |
| --- | --- |
| `-b` | Make backup files. _This does nothing id `-d` is not also set._ |
| `-d` | Delete strings that are no longer found in the default file. |
| `-l:<locale>` | Set the default locale. For example: `-l:fr` sets the default locale to `'fr'` (French). |
| `-r` | Recursively scan sub-folders. |
| `-?` | Output the help content. |



### Releases

| Version | Date | Description |
| --- | --- | --- |
| 1.1.0 | 16-Apr-2018 | * Added support to allow user to set the default locale (`-l:<locale>`)<br/>* Changed missing keys from ERROR to WARN.<br/>* Added `ERROR:`, `WARN:` and `INFO:` to clarify the output messages.<br/>* Removed unused `console.log` code.<br/>* Added options section and updated README. |
| 1.0.0 | 06-Apr-2018 | Initial Release |