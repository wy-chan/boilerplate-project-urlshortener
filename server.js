require('dotenv').config();
var bodyParser = require("body-parser");
const express = require('express');
const cors = require('cors');
const app = express();
var mongoose = require('mongoose');

//Database connection
const mySecret = process.env['MONGO_URI'];
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

//create a person schema called urlSchema
const { Schema } = mongoose;

let urlSchema = new Schema({
  original:{type: String, required: true},//the original url
  short: Number//the short number of the url
});

//create a model called "URL" from the urlSchema
let Url = mongoose.model("Url", urlSchema);

let responseObject = {};

mongoose.set('useFindAndModify', false);




// Basic Configuration
const port = process.env.PORT || 3000;

let inputShort = 1;


app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

//the url only works when you press the "POST URL" button on the page
app.post("/api/shorturl", (request, response) => {//<form action="api/shorturl" method="POST">
  let inputUrl = request.body.url;//name="url" in the <input /> element
 console.log(inputUrl);
  let urlRegex = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
  //reference - https://stackoverflow.com/questions/8188645/javascript-regex-to-match-a-url-in-a-field-of-text

  if(!inputUrl.match(urlRegex)){
    response.json({ error: 'invalid url' });
    return
  };
  
  responseObject.original_url = inputUrl;
  
  Url.findOne({})
      .sort({short: -1})//-1 for descending order.
      .exec((error, dataFound) => {
          if(!error && dataFound != undefined){//if there are urls already saved
            inputShort = dataFound.short +1;
          }
          if (!error){
            Url.findOneAndUpdate(
              {original: inputUrl},//filter to match
              {original: inputUrl, short: inputShort},//what to update?
              {new: true, upsert: true},//new:return the modified doc, upsert:creates the object if it doesn't exist
              (error, savedUrl) =>{
                if(!error){
                  responseObject.short_url = savedUrl.short;
                  console.log(inputShort);
                  response.json(responseObject);
                }
              }
            )
          }
       })
});

app.get("/api/shorturl/:input",(req, res) =>{
  let input = req.params.input;

  Url.findOne({short:input},(error, dataFound)=>{
    if (!error && dataFound != undefined){
      res.redirect(dataFound.original);//redirect to another page
    }else{
      res.json({"error":"URL not found"});
    }
  })
})

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
