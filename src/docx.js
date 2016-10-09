#!/usr/bin/env node

'use strict';

var commander = require('commander');
var child_process = require('child_process');
var path = require('path');

var Docx = require('./main');
var pkg = require('../package.json');

commander.version(pkg.version)
    .option('-v --version', 'get version')
    .option('-c --config <path>');

commander.on('--help', function() {
    console.log('  Basic Examples:');
    console.log('  Deployment help:');
    console.log('    $ pm2 deploy help');
});

commander
    .command('start')
    .action(function() {
        child_process.exec('../node_modules/pm2/bin/pm2 start ./main.js', {
            cwd: __dirname
        }, function (err, result) {
            if (err) {
                console.error(err);
            }
            else {
                /**
                 * 初始化docx
                 * */
                new Docx(commander.config);
                console.log('config', commander.config);
            }
        });
    });

commander.parse(process.argv);

if (commander.config) {
    /**
     * 初始化docx
     * */
    console.log('commander.config', commander.config);
    //new Docx(commander.config);
}
