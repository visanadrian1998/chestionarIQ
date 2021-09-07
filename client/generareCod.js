$( document ).ready(function() {
    function uuidv4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    }
    function genereaza(){
        let randomID=uuidv4();
        let testType=$("#tipTest").val();
        let testName=$("#numeTest").val();
        let link=`http://localhost:3000/test/${randomID}`;
        let linkObj={};
        linkObj.nume=testName;
        linkObj.token=randomID;
        linkObj.used=false;
        linkObj.tip=testType;
        $(".linkGenerat").val(link);
        $.ajax("/genereazaLink",{
            method: 'POST',
            data:linkObj,
            success: function() {
            console.log("link Generat.");
            },
            error: function(){
                console.log("failure");
            }
        })
    }
    $("#GenereazaButton").on('click',genereaza);

    function copyTextfunc() {
        var copyText = document.getElementById("elem-generat");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(copyText.value);
        
        var tooltip = document.getElementById("toolTipCopiaza");
        tooltip.innerHTML = "Link copiat";
      }


    $("#buton-copiaza").on('click',copyTextfunc);
})
