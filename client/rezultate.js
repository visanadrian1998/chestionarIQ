$(document).ready(function() {
    $.ajax("/rezultateData",{
        method: "GET",
        success: function(res) {
            let container=document.getElementById('RezultateContainer');
            res.rezultate.forEach((result)=>{
                const elem = document.createElement('div');
                elem.style.background="#596bff";
                const numeContainer=document.createElement('div');
                const labelNume=document.createElement("label");
                labelNume.innerText="Nume: ";
                const nume=document.createElement('span');
                nume.innerText=result.nume && result.nume.trim()?result.nume:"Anonim";
                numeContainer.append(labelNume,nume);
                const tokenContainer=document.createElement("div");
                const labelToken=document.createElement("label");
                labelToken.innerText="Cod unic: ";
                const token=document.createElement("span");
                token.innerText=result.token;
                tokenContainer.append(labelToken,token);
                const tipContainer=document.createElement("div");
                const labelTip=document.createElement("label");
                labelTip.innerText="Tipul chestionarului: ";
                const tip=document.createElement("span");
                tip.innerText=result.tipTest;
                tipContainer.append(labelTip,tip);
                const punctajContainer=document.createElement('div');
                const labelPunctaj=document.createElement("label");
                labelPunctaj.innerText="Punctaj: ";
                const punctaj=document.createElement('span');
                punctaj.innerText=result.punctaj;
                punctajContainer.append(labelPunctaj,punctaj);
                const dataExpirareContainer=document.createElement('div');
                const labelDataExpirare=document.createElement("label");
                labelDataExpirare.innerText="Ora la care expira chestionarul: ";
                const dataExpirare=document.createElement('span');
                dataExpirare.innerText=new Date(result.timeToFinish);
                dataExpirareContainer.append(labelDataExpirare,dataExpirare);
                const aFinalizatContainer=document.createElement("div");
                const labelAfinalizat=document.createElement("label");
                labelAfinalizat.innerText="A terminat chestionarul? ";
                const aFinalizat=document.createElement('span');
                aFinalizat.innerText=result.timeExpired?"DA":"NU";
                aFinalizatContainer.append(labelAfinalizat,aFinalizat);
                const raspunsuriContainer=document.createElement("div");
                const raspunsuriLabel=document.createElement('label');
                raspunsuriLabel.innerText="Raspunsuri: ";
                const raspunsuri=document.createElement("span");
                raspunsuri.innerText=result.form?JSON.stringify(result.form):"Nu a dat nici un raspuns.";
                raspunsuriContainer.append(raspunsuriLabel,raspunsuri);
                elem.append(numeContainer,tokenContainer,tipContainer,punctajContainer,dataExpirareContainer,aFinalizatContainer,raspunsuriContainer);
                elem.style.marginBottom="20px";
                container.append(elem);
            })
        },
        error: function(res){
            console.log("failure",res);
        }
        
    })
});
