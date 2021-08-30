$(document).ready(function() {
    $.ajax("/chestionarData",{
        method: "GET",
        success: function(res) {
        let chestionarData=res;
        for(let i = 0; i < chestionarData.length;i++){
            if(chestionarData[i].esteObjInformativ){
                const title=document.createElement("h1");
                title.innerText=chestionarData[i].title;
                $("#submitButton").before(title);
                continue;  
            }else{
            const div = document.createElement("div");
            div.className="intrebare";
            let questionp;
            if(chestionarData[i].imageQuestion == false){
                questionp=document.createElement("p").innerHTML=chestionarData[i].question;
            }else{
                questionp=document.createElement("IMG");
                questionp.src=chestionarData[i].question;
                questionp.alt="Intrebare";
            }
            div.append(questionp);
            chestionarData[i].answers.forEach(answer => {
                if(chestionarData[i].imageAnswers == false){
                const answerp = document.createElement("label");
                const answerInput = document.createElement("input");
                answerInput.setAttribute("type","radio");
                answerInput.className="input";
                answerInput.setAttribute("name",chestionarData[i].id);
                answerInput.value=answer;
                answerp.append(answerInput);
                answerp.append(answer);
                div.append(answerp);
                }
                else{
                    const answerdiv = document.createElement("div");
                    const answerLabel = document.createElement("label");
                    const answerInput = document.createElement("input");
                    answerInput.setAttribute("type","radio");
                    answerInput.className="input";
                    answerInput.setAttribute("name",chestionarData[i].id);
                    answerInput.value=answer;
                    const answerImage=document.createElement("IMG");
                    answerImage.src=answer;
                    answerImage.alt="raspuns";
                    answerdiv.append(answerLabel);
                    answerLabel.append(answerInput);
                    answerLabel.append(answerImage);
                    div.append(answerdiv);
                }
            })
            $("#submitButton").before(div);
        }
        }
        $(".input").change(function() {
            form = $("#chestionar").serializeArray();
            let rezultat= {};
            rezultat.token=window.location.href.split("/")[4];
            rezultat.form = form;
            posteazaRezultate(rezultat,false,null);
        })
        if(chestionarData[0].form) umpleFormul(chestionarData[0].form);
        faTimer(chestionarData);
        },
        error: function(res){
            console.log("failure",res);
        }
        
    })
    $("#submitButton").on('click',submitChestionar); 

function submitChestionar(){
    let rezultat={};
    rezultat.token=window.location.href.split("/")[4];
    rezultat.timeExpired=true;
    posteazaRezultate(rezultat,true,null);
}
function umpleFormul(data){
    for(element of data){
        let optiuni = document.getElementsByName(element.name);
        for(optiune of optiuni){
            if (optiune.value == element.value) optiune.checked=true;
        }
    }
}
function posteazaRezultate(rezultat,refreshPagina,interval){
    $.ajax("/postRezultate",{
            method: 'POST',
            data:rezultat,
            success: function() {
            if(interval) clearInterval(interval);
            if(refreshPagina) location.reload();
            },
            error: function(){
            console.log("failure");
            }
        })
}
function faTimer(chestionarData){
    let time=Math.ceil(chestionarData[0].timeLeft);
    const timer = document.getElementById("timer");
    let interval=setInterval(updateCountdown, 1000);
    function updateCountdown() {
            const minutes = Math.floor(time/60);
            let seconds = time % 60;
            seconds = seconds < 10 ? "0"+seconds:seconds;
            timer.innerHTML = `${minutes}:${seconds}`;
            time--;
            if(time<0){
             let rezultat={};
             rezultat.token=window.location.href.split("/")[4];
             posteazaRezultate(rezultat,true,interval);
            }
    }
}
});