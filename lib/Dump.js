const fs = require('fs');
const path = require('path');
const { geVarFromPHPFile } = require('./utils');

/**
 * Represents a Dump class for WordPress configuration.
 *
 * @class Dump
 */
class Dump {
  /**
   * Constructor for the class.
   *
   * Initializes the class with the necessary folders for WordPress.
   */
  constructor () {
    this.wpFolder = process.cwd();
    this.themeFolder = path.join(this.wpFolder, 'wp-content', 'themes');
    this.pluginsFolder = path.join(this.wpFolder, 'wp-content', 'plugins');
  }

  /**
   * Initializes the function by logging the `wpFolder` and `themeFolder` properties,
   * scanning the theme and plugins directories, retrieving the website name from the
   * `wpFolder` path, getting the WordPress version from `wp-includes/version.php`,
   * determining the language using `Intl.DateTimeFormat().resolvedOptions().locale`,
   * and saving the result to a JSON file.
   *
   * @return {void}
   */
  init () {
    console.log(this.wpFolder);
    console.log(this.themeFolder);
    const themes = this.scanDirectory(this.themeFolder);
    const plugins = this.scanDirectory(this.pluginsFolder);

    // the website name
    const name = path.basename(this.wpFolder);

    // get the WordPress version from wp-includes/version.php
    const versionFile = path.join(this.wpFolder, 'wp-includes', 'version.php');
    const versionFileContent = fs.readFileSync(versionFile, 'utf8');
    const version = geVarFromPHPFile(versionFileContent, 'wp_version');

    const language = Intl.DateTimeFormat().resolvedOptions().locale;

    const result = {
      name,
      wordpress: {
        version,
        language
      },
      themes,
      plugins
    };

    const outputPath = path.join(process.cwd(), 'wp-package.json');

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`🆗 Wordpress configuration Dump completed. Configuration saved to ${outputPath}`);
  }

  /**
   * Scans a directory and returns an array of objects containing the name and version of each item found.
   *
   * @param {string} directory - The path of the directory to scan.
   * @return {Array} - An array of objects with the name and version of each item found.
   */
  scanDirectory (directory) {
    const items = fs.readdirSync(directory);
    const result = [];

    for (const item of items) {
      const fullPath = path.join(directory, item);
      console.log(`🔍️ Scanning ${fullPath}`);
      const isDirectory = fs.statSync(fullPath).isDirectory();

      if (isDirectory) {
        const stylePath = path.join(fullPath, 'style.css');
        const themeFile = path.join(fullPath, `${item}.php`);
        const pluginFile = `${item}.php`; // ie: 'hello-dolly.php'

        if (fs.existsSync(stylePath)) {
          const version = this.extractVersionFromStyleFile(stylePath);
          if (version) {
            console.log(`ℹ️ Found ${item} version ${version}`);
            result.push({ name: item, version });
          }
        }

        if (fs.existsSync(themeFile) || fs.existsSync(pluginFile)) {
          const version = this.extractVersionFromPHPFile(themeFile) || this.extractVersionFromPHPFile(pluginFile);
          if (version) {
            console.log(`ℹ️ Found ${item} version ${version}`);
            result.push({ name: item, version });
          }
        }
      }
    }

    return result;
  }

  /**
   * Extracts the version number from a style file.
   *
   * @param {string} filePath - The path to the style file.
   * @return {string|null} The version number extracted from the style file, or null if no match was found.
   */
  extractVersionFromStyleFile (filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = /Version:\s*([\d.]+)/i.exec(content);
    return match ? match[1] : null;
  }

  /**
   * Extracts the version number from a PHP file.
   *
   * @param {string} filePath - The path to the PHP file.
   * @return {string|null} The version number extracted from the file, or null if no version is found.
   */
  extractVersionFromPHPFile (filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = /Version:\s*([\d.]+)/i.exec(content);
    return match ? match[1] : null;
  }
}

module.exports = Dump;