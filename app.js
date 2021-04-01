const http = require("http")
const express = require("express")
const app = express()
const fs = require("fs")
uuid = require("node-uuid")
jsonfile = require("jsonfile")
const bodyParser = require('body-parser');

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
            fs.readFile("tokens.json", function(errorJSON,dataJSON){
                if(errorJSON){
                    res.writeHead(500)
                    res.write("A aparut o problema")
                }else{
                    obj = JSON.parse(dataJSON);
                    //parcurgem toti tokenii si il cautam pe cel curent(din link)
                    for(let i= 0;i<obj.tokens.length;i++){
                        if(obj.tokens[i].token == req.params.link){
                            //cand gasim tokenul, verificam daca are "used=true".Daca da, inseamna ca deja a fost folosit, si nu il mai lasam sa intre in test
                            if(obj.tokens[i].used == true){
                                res.end("Tokenul a fost deja utilizat.")
                                return;
                            //daca nu, inseamna ca este un token nefolosit, si il lasam sa intre in test.
                            }else{
                                res.end(data);
                                return;
                            }
                        }
                    }
                    res.end("Tokenul nu este valid");
                }
            })

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
            fs.readFile("tokens.json", function(errorJSON,dataJSON){
                if(errorJSON){
                    res.writeHead(500)
                    res.write("A aparut o problema")
                }else{
                    obj = JSON.parse(dataJSON);
                    //parcurgem tokenii si il cautam pe cel curent(din link)
                    for(let i= 0;i<obj.tokens.length;i++){
                        if(obj.tokens[i].token == req.params.link){
                            //verificam daca tokenul este "used=true".Daca da, nu il lasam sa intre in test
                            if(obj.tokens[i].used == true){
                                res.end("Ati rezolvat chestionarul.Va multumim pentru timpul acordat.")
                                return;
                                //daca nu, updatam fisierul de tokens cu noul token introdus
                            }else{
                                //citim fisierul de rezultate si cautam tokenul folosit in prezent
                                fs.readFile("rezultate.json",function(errorRezultateJSON,dataRezultateJSON){
                                    if(errorRezultateJSON){
                                        res.writeHead(500)
                                        res.write("A aparut o problema")
                                    }else{
                                        objRezultate=JSON.parse(dataRezultateJSON);
                                        for(let i=0;i<objRezultate.rezultate.length;i++){
                                        //daca il gasim, inseamna ca testul deja a fost inceput de utilizator si nu facem nimic
                                            if(objRezultate.rezultate[i].token == req.params.link){
                                                return;
                                            }
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
                                res.end(data);
                                return;
                            }
                        }
                    }
                     res.end("Tokenul nu este valid.");
                }
            })
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
            for(let i=0;i<objRez.rezultate.length;i++){
                if(objRez.rezultate[i].token==token){
                    timeLeft=(objRez.rezultate[i].timeToFinish-Date.now())/1000;
                    objRez.rezultate[i].form?formToSendToClient=objRez.rezultate[i].form:"";
                }
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
            for(let i= 0;i<obj.tokens.length;i++){
                if(obj.tokens[i].token == token){
                    if(obj.tokens[i].tip == "IQ"){
                        const chestionar=require("./iq.json");
                        chestionar[0].time=timeLeft;
                        chestionar[0].form=formToSendToClient;
                        res.json(chestionar);
                        return;
                    }else if(obj.tokens[i].tip == "Geografie"){
                        const chestionar=require("./geografie.json");
                        res.json(chestionar);
                        return;
                    }
                }
            }
            res.end("Nu am gasit chestionarul aferent.")
        }
    })
}
http.createServer(app).listen(3000);
