/*
* @file docx.js
* */

var express = require('express');
var handlebars = require('handlebars');
var app = express();

app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');

app.get('/', function (req, res) {
    res.render('main', {title: 'test'});
});

app.listen(8910);
