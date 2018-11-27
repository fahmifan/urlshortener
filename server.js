'use strict';

require('dotenv').config()
var express = require('express');
var mongoose = require('mongoose');
var cors = require('cors');
const bodyParser = require('body-parser');
const { isURL } = require('./utils')

var app = express();
app.use(bodyParser.urlencoded());

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI, {
  useMongoClient: true,
});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

// root views
app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// make a Schema
const Schema = mongoose.Schema
const urlSchema = new Schema({
  original: String,
  shorten: {type:Number,default:0},
})

// make a Model
const ShortenURL = mongoose.model("ShortenURL", urlSchema) 

// your first API endpoint... 
app.post("/api/shorturl/new", (req, res) => {
  // validate the url
  if(!isURL(req.body.url)) return res.json({"error":"invalid URL"})

  // count datas to get new `shorten value`
  ShortenURL.count({}, (error, urls) => {
    console.log("urls", urls)

    // insert to the Model
    const shortenURL = new ShortenURL({
      original: req.body.url,
      shorten: urls + 1
    }) 

    shortenURL.save((error, el) => {
      if(error) return res.json({error: error})

      return res.json({
        original: el.original,
        shorten: el.shorten,
      })
    })
  })
});

app.get("/api/shorturl/:shorten?", async (req, res) => {
  // validate
  if(req.params.shorten === "") {
    return
  }

  // query from the DB
  ShortenURL.findOne({shorten: req.params.shorten}, (error, shortenURL) => {
    if(error) {
      console.log("Error", error)    
      return res.json({error: error})
    }

    return (shortenURL.original === "") 
      ? null
      : res.redirect(shortenURL.original)
  })
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});