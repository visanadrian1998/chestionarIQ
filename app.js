const http = require("http")
const express = require("express")
const expressModifyResponse = require('express-modify-response');
const crypto = require('crypto');
const app = express()
const fs = require("fs")
uuid = require("node-uuid")
jsonfile = require("jsonfile")
const bodyParser = require('body-parser');

app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString("hex");
    res.setHeader("Content-Security-Policy", `script-src 'nonce-${res.locals.cspNonce}' 'strict-dynamic'; connect-src 'self' wss://*.tradeville.eu https://*.microsoftonline.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; default-src 'self'; frame-ancestors 'self' https://*.tradeville.eu https://*.microsoft.com https://*.cookiebot.com;frame-src 'self' https://*.cookiebot.com;`);
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Permissions-Policy", "geolocation=(), camera=(), fullscreen=(), microphone=()");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Powered-By", "Tradeville");
    res.setHeader("X-Frame-Options", "sameorigin");
    next();
});

// app.use(
//     helmet.contentSecurityPolicy({
//         useDefaults: true,
//         directives: {
//             scriptSrc: [(req, res) => `'nonce-${res.locals.cspNonce}'`],
//         },
//     })
// );

app.use(expressModifyResponse(
    (req, res) => {
        // return true if you want to modify the response later
        if (res.getHeader('Content-Type')) {
            if (res.getHeader('Content-Type').includes('text/html')) {
                //res.setHeader('Cache-Control', 'no-store');
                return true;
            }
        }
        return false;
    },
    (req, res, body) => {
        // body is a Buffer with the current response; return Buffer or string with the modified response
        // can also return a Promise.
        let newHTML = body.toString();
        newHTML = newHTML.replace(/<script/g, '<script nonce="' + res.locals.cspNonce + '"').replace(/<style/g, '<style nonce="' + res.locals.cspNonce + '"');
        return newHTML;
    }
));



app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static('public'));
app.use(express.static('client'));

app.get('/test/:link',function (req,res) {
    res.writeHead(200, {"Content-Type": "text/html",'Cache-Control': 'private, no-cache, no-store, must-revalidate' })
    fs.readFile("client/html/validare.html", function(error,data) {
        if(error) {
            res.writeHead(404)
            res.write("Error: File Not Found")
        }else{
            testareToken(req,res,data,false);
        }
    })
})
app.get('/chestionar/:link', function (req, res) {
    res.writeHead(200, {"Content-Type": "text/html",'Cache-Control': 'private, no-cache, no-store, must-revalidate' })
    fs.readFile("client/html/chestionarTemplate.html", function(error,data) {
        if(error) {
            res.writeHead(404)
            res.write("Error: File Not Found")
        }else{
            testareToken(req,res,data,true);
        }
    })
  });
app.get("/chestionarData", (req,res) => {
    const token=req.headers.referer.split("/")[4];
    let timeLeft;
    let formToSendToClient;
    fs.readFile("rezultate.json",function(errorRezultate,dataRezultate){
        if(errorRezultate){
            res.writeHead(500)
            res.write("A aparut o problema")
        }else{
            objRez= JSON.parse(dataRezultate);
            let rezultatFound=returnTokenOrStatus(objRez.rezultate,token);
                if(rezultatFound){
                    timeLeft=(rezultatFound.timeToFinish-Date.now())/1000;
                    rezultatFound.form?formToSendToClient=rezultatFound.form:"";
                }
        }
        readTokensFile(res,token,timeLeft,formToSendToClient);
    })
})

app.get("/generare",function(req,res){
    res.writeHead(200, {"Content-Type": "text/html" })
    fs.readFile("client/html/generare.html", function(error,data) {
        if(error) {
             res.writeHead(404)
             res.write("Error: File Not Found")
                }else{
                    res.end(data);
                }
            })
})

app.post('/postRezultate', (req, res) => {    
    fs.readFile("rezultate.json", function(errorJSON,dataJSON){
        if(errorJSON){
            res.writeHead(500)
            res.write("A aparut o problema")
        }else{
            obj = JSON.parse(dataJSON);
            let gasitToken=false;
            //parcurgem fisierul de rezultate si cautam tokenul trimis de la client(adica tokenul pe care clientul da testul)
            for(let i= 0;i<obj.rezultate.length;i++){
                if(obj.rezultate[i].token == req.body.token){
                        gasitToken=true;
                        //daca am depasit momentul in care trebuia terminat testul sau daca userul a apasat pe submit(deci a trimis parametrul"timeExpired")
                        //inseamna ca testul a fost finalizat si nu mai updatam in fisierul de rezultate cu noi modificari
                        if(obj.rezultate[i].timeToFinish<Date.now() || req.body.timeExpired){
                            obj.rezultate[i].timeExpired=true;
                            //apoi citim fisierul de tokens si specificam si acolo ca testul e finalizat
                            //ca sa nu mai poata intra iar in test
                            fs.readFile('tokens.json',function readFileCallback(errToken, dataToken){
                                if (errToken){
                                    console.log(err);
                                } else {
                                objToken = JSON.parse(dataToken);
                                for(let i=0; i< objToken.tokens.length;i++){
                                    if(objToken.tokens[i].token == req.body.token){
                                        objToken.tokens[i].used=true;
                                    }
                                } 
                                fs.writeFile('tokens.json', JSON.stringify(objToken), function(error){
                                    if(error){
                                        console.error(error);
                                    }
                                });
                            }});
                            json = JSON.stringify(obj);
                                fs.writeFile('rezultate.json', json, function(error){
                                    if(error){
                                        console.error(error);
                                    }
                                });
                            //daca nu, inseamna ca testul inca e in curs si updatam fisierul de rezultate cu noile raspunsuri date de user
                        }else{
                            //TRIMITEM FORMUL CU RASPUNSURILE DE PANA ACUM CATRE CLIENT
                            req.body.form?obj.rezultate[i].form=req.body.form:"";
                            req.body.timeExpired?obj.rezultate[i].timeExpired=req.body.timeExpired:"";
                            //CALCULAM PUNCTAJUL
                            fs.readFile('iq_rezultate.json',function readFileCallback(errRezultate,dataRezultate){
                                if(errRezultate){
                                    console.log(errRezultate);
                                } else {
                                    let punctaj = 0;
                                    objRezultate = JSON.parse(dataRezultate);
                                    for(element of req.body.form){
                                        if(element.value == objRezultate[element.name]) punctaj++;
                                    }
                                    obj.rezultate[i].punctaj=punctaj;
                                    json = JSON.stringify(obj);
                                    fs.writeFile('rezultate.json', json, function(error){
                                        if(error){
                                            console.error(error);
                                        }
                                    });
                                }
                            })
                        }
                        return;
                    }
            }
            //daca nu am gasit tokenul inseamna ca e primul moment cand userul da vreun raspuns la test
            //deci adaugam tokenul si raspunsurile aferente in fisierul de rezultate
            if(gasitToken==false){
                if(req.body.token && req.body.form && req.body.punctaj){
                obj.rezultate.push({token:req.body.token,punctaj:req.body.punctaj,form:req.body.form});
                json = JSON.stringify(obj);
                        fs.writeFile('rezultate.json', json, function(error){
                            if(error){
                                console.error(error);
                            }
                        });
                    }
            }
        }
    })
    res.end("primit");
  });
app.post("/genereazaLink", (req,res) => {
    fs.readFile('tokens.json',function readFileCallback(err, data){
            if (err){
                console.log(err);
            } else {
            obj = JSON.parse(data); 
            obj.tokens.push(req.body); 
            json = JSON.stringify(obj); 
            fs.writeFile('tokens.json', json, function(error){
                if(error){
                    console.error(error);
                }
            });
        }});
        res.end("primit link");
})
app.use(function (request, response) {
    response.statusCode = 404;
    response.end('Pagina nu a fost gasita!');
  })
function readTokensFile(res,token,timeLeft,formToSendToClient){
    fs.readFile("tokens.json", function(errorJSON,dataJSON){
        if(errorJSON){
            res.writeHead(500)
            res.write("A aparut o problema")
        }else{
            obj = JSON.parse(dataJSON);
            let chestionarFound=returnTokenOrStatus(obj.tokens,token);
            if(chestionarFound){
                if(chestionarFound.tip == "IQ"){
                    const chestionar=require("./iq.json");
                    chestionar[0].time=timeLeft;
                    chestionar[0].form=formToSendToClient;
                    res.json(chestionar);
                    return;
                }else if(chestionarFound.tip == "Geografie"){
                    const chestionar=require("./geografie.json");
                    res.json(chestionar);
                    return;
                }
            }else  res.end("Nu am gasit chestionarul aferent.");
        }
    })
}
function testareToken(req,res,data, testareAvansata){
    fs.readFile("tokens.json", function(errorJSON,dataJSON){
        if(errorJSON){
            res.writeHead(500)
            res.write("A aparut o problema")
        }else{
            obj = JSON.parse(dataJSON);
            //parcurgem toti tokenii si il cautam pe cel curent(din link)
            let tokenFound=returnTokenOrStatus(obj.tokens,req.params.link);
                if(tokenFound){
                    //cand gasim tokenul, verificam daca are "used=true".Daca da, inseamna ca deja a fost folosit, si nu il mai lasam sa intre in test
                    if(tokenFound.used == true){
                        res.end(testareAvansata?"Ati rezolvat chestionarul.Va multumim pentru timpul acordat.":"Tokenul a fost deja utilizat.")
                        return;
                    //daca nu, inseamna ca este un token nefolosit, si il lasam sa intre in test.
                    }else{
                        if(testareAvansata){
                            fs.readFile("rezultate.json",function(errorRezultateJSON,dataRezultateJSON){
                                if(errorRezultateJSON){
                                    res.writeHead(500)
                                    res.write("A aparut o problema")
                                }else{
                                    objRezultate=JSON.parse(dataRezultateJSON);
                                    let rezultatFound=returnTokenOrStatus(objRezultate.rezultate,req.params.link);
                                    //daca il gasim, inseamna ca testul deja a fost inceput de utilizator si nu facem nimic
                                        if(rezultatFound){
                                            return;
                                        }
                                    //daca nu il gasim, inseamna ca acum intra prima oara in test, si adaugam tokenul in fisierul de rezultate,
                                    //dandu-i un timp de 50 de secunde de rezolvare(de modificat in 30 minute)
                                    objRezultate.rezultate.push({token:req.params.link,punctaj:0,form:null,timeToFinish:Date.now()+50000,timeExpired:false});
                                    fs.writeFile('rezultate.json', JSON.stringify(objRezultate), function(error){
                                        if(error){
                                            console.error(error);
                                        }
                                    })                                    }
                            })
                        }
                        res.end(data);
                        return;
                    }
                }
            res.end("Tokenul nu este valid");
        }
    })
}
function returnTokenOrStatus(data,comparator){
    let tokens=data.filter(x=>x.token==comparator);
    if(tokens.length>0){
        return tokens[0];
    }else return false;
}
http.createServer(app).listen(3000);
