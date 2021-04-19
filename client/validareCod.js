$( document ).ready(function() {

function start(){
    let url=window.location.href;
    url=url.replace(url.split('/')[3], 'chestionar');
    window.location.href=url;
}
$("#startTest").on('click',start);
})