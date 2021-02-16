const http = require("http")
const express = require("express")
const app = express()
const fs = require("fs")
uuid = require("node-uuid")
jsonfile = require("jsonfile")
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true })); 

app.get('/testIQ/:link',function (req,res) {
    res.writeHead(200, {"Content-Type": "text/html",'Cache-Control': 'private, no-cache, no-store, must-revalidate' })
    fs.readFile("validare.html", function(error,data) {
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
                    for(let i= 0;i<obj.tokens.length;i++){
                        if(obj.tokens[i].token == req.params.link){
                            if(obj.tokens[i].used == true){
                                res.end("Tokenul a fost deja utilizat.")
                                return;
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
    fs.readFile("chestionar.html", function(error,data) {
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
                    for(let i= 0;i<obj.tokens.length;i++){
                        if(obj.tokens[i].token == req.params.link){
                            if(obj.tokens[i].used == true){
                                res.end("Ati rezolvat chestionarul.Va multumim pentru timpul acordat.")
                                return;
                            }else{
                                obj.tokens[i].used=true;
                                json = JSON.stringify(obj);
                                fs.writeFile('tokens.json', json, function(error){
                                    if(error){
                                        console.error(error);
                                    }
                                });
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
app.get("/generare",function(req,res){
    res.writeHead(200, {"Content-Type": "text/html" })
    fs.readFile("generare.html", function(error,data) {
        if(error) {
             res.writeHead(404)
             res.write("Error: File Not Found")
                }else{
                    randomID = uuid.v4();
                    data = data.toString().replace(/\{\{valoare\}\}/, "http://localhost:3000/testIQ/"+randomID);
                    fs.readFile('tokens.json',function readFileCallback(err, data){
                        if (err){
                            console.log(err);
                        } else {
                        obj = JSON.parse(data); 
                        obj.tokens.push({token: randomID, used:false}); 
                        json = JSON.stringify(obj); 
                        fs.writeFile('tokens.json', json, function(error){
                            if(error){
                                console.error(error);
                            }
                        });
                    }});
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
            for(let i= 0;i<obj.rezultate.length;i++){
                if(obj.rezultate[i].token == req.body.token){
                        gasitToken=true;
                        obj.rezultate[i].punctaj=req.body.punctaj;
                        obj.rezultate[i].form=req.body.form;
                        json = JSON.stringify(obj);
                        fs.writeFile('rezultate.json', json, function(error){
                            if(error){
                                console.error(error);
                            }
                        });
                        return;
                    }
            }
            if(gasitToken==false){
                if(req.body.token && req.body.punctaj && req.body.form){
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
app.use(function (request, response) {
    response.statusCode = 404;
    response.end('Pagina nu a fost gasita!');
  })
http.createServer(app).listen(3000);
