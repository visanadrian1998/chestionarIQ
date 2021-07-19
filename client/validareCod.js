$( document ).ready(function() {

function start(){
    let url=window.location.href;
    url=url.replace(url.split('/')[3], 'chestionar');
    window.location.replace(url);
}
$("#startTest").on('click',start);
})