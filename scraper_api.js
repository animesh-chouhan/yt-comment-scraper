const puppeteer = require('puppeteer');
const express = require('express');

//Express API

const app = express();

app.get('/', function(req, res){
  console.log(req.params)
  res.send("Access the api @/api?[youtube link]");  
  // res.sendFile(__dirname + '/index.html');
  res.end();
});

app.get('/api/', url = function(req, res){
    if(!req.query.url){
        res.send("You need to provide an URL");
        res.end()
        throw "No URL provided";
    }
    console.log(req.query.url);
    // var file = getJSON(req.query.url);
    //Puppeteer

    function delay(time) {
    // console.log("one")
    return new Promise(function(resolve) { 
        setTimeout(resolve, time);
    });
    }

    (async function json() {
        try{
        var myRe = /https:\/\/www.youtube.com\/(user|channel)\/[\s\S]*/i;  //regex to check the url`

        if(!myRe.test(req.query.url)) throw "Not a valid URL";
            const browser = await puppeteer.launch({headless: true, devtools: false});
            const page = await browser.newPage();
            page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36');
            await page.goto(req.query.url);

            while(1){
                const h_prev = await page.evaluate(()=>{
                    scrollheight_prev = window.scrollY;
                    // console.log(scrollheight_prev);
                    return scrollheight_prev;
                });
                await page.keyboard.down('End');
                await delay(3000);
                const h_new = await page.evaluate(()=>{
                    scrollheight_new = window.scrollY;
                    // console.log(scrollheight_new);
                    return scrollheight_new;
                });           
                if(h_new==h_prev) {
                    console.log("Done loading the page");
                    break;
                }

            }                         
        
            const get_json = await page.evaluate(()=>{
                const data = [];
                const raw = document.getElementsByTagName('ytd-grid-video-renderer');
                console.log(raw[0]);
                for (var i in raw){
                    try{
                        console.log(raw[i].children[0].children[0].children[0].href);
                        console.log(raw[i].children[0].children[1].children[0].children[0].innerText);
                        data.push({
                            title: raw[i].children[0].children[1].children[0].children[0].innerText,
                            link: raw[i].children[0].children[0].children[0].href
                        });
                    }catch(e){};
                }
                console.log(data);
                return data;
            });
            var jsondata = JSON.stringify(get_json, null, 2);
            // console.log(jsondata);
            res.send(jsondata);
            await browser.close();
            
        } catch(e){
            console.log('ERROR ', e);
        }
  })();
});

app.listen('3000',() => {
    console.log("Server started at http://localhost:3000");
});


