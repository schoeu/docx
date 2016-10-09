#!/usr/bin/env node

'use strict';

var commander = require('commander');
var Docx = require('./main');
var pkg = require('../package.json');

commander.version(pkg.version)
    .option('-v --version', 'get version')
    .option('-c --config <path>')
    .parse(process.argv);

commander.on('--help', function() {
    console.log('  Basic Examples:');
    console.log('  Deployment help:');
    console.log('    $ pm2 deploy help');
});

// 配置文件
if (commander.config) {
    console.log(commander.config);
    /**
     * 初始化docx
     * */
    new Docx(commander.config);
}

//
// snapshot PM2
//
commander.command('config')
.description('snapshot PM2 memory')
.action(function() {
    console.log('start');
});


/*
var name = process.argv[2];
 var exec = require('child_process').exec;

  var child = exec('ls ', function(err, stdout, stderr) { 
    if (err) throw err; 
      console.log(stdout);
 }); 
*/
