var gameManager = function(){
    var canvas, userID, heroSpeed, ctx, images, playerManager;

    function initImage (url) {
        var img = new Image();
        img.isReady = false;
        img.onload = function(){
            img.isReady = true;
        }
        img.src = url;
        return img;
    }

    this.init = function(){
        userID = document.getElementById("script-data").getAttribute("data-id");
        heroSpeed = 256;
        //    create Canvas
        canvas = document.getElementById("game");
        ctx = canvas.getContext("2d");
        canvas.width = 512;
        canvas.height = 480;
        //    load bg image
        images.bg = initImage("https://farm8.staticflickr.com/7333/13311761513_351c5e7633_o.png");
        images.hero = initImage("https://farm8.staticflickr.com/7142/13311980524_135fd568cd_o.png");
        playerManager  = {
            ids: [userID]
        };
        playerManager[userID] = {
            x : canvas.width / 2,
            y:  canvas.height / 2
        };
    }



}




//
//// Background image
//var bgReady = false;
//var bgImage = new Image();
//bgImage.onload = function () {
//    bgReady = true;
//};
//bgImage.src = "https://farm8.staticflickr.com/7333/13311761513_351c5e7633_o.png";

var emitData = {
    newData: false
};

// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
//    console.log(e.keyCode);
    keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
    delete keysDown[e.keyCode];
}, false);

// Reset the game when the player catches a monster
var reset = function () {

};

// Update game objects
var update = function (modifier) {
    if (38 in keysDown) { // Player holding up
        heroes[userID].y -= heroSpeed * modifier;
        emitData.newData = true;
    }

    if (40 in keysDown) { // Player holding down
        heroes[userID].y += heroSpeed * modifier;
        emitData.newData = true;
    }
    if (37 in keysDown) { // Player holding left
        heroes[userID].x -= heroSpeed * modifier;
        emitData.newData = true;
    }
    if (39 in keysDown) { // Player holding right
        heroes[userID].x += heroSpeed * modifier;
        emitData.newData = true;
    }
    if(emitData.newData == true){
        socket.emit('playerMove', {data: heroes[userID], id: userID});
        emitData.newData = false;
    }
};

// Draw everything
var render = function () {
    if (bgReady) {
        ctx.drawImage(bgImage, 0, 0);
    }

    if (heroReady) {
        for(var i = 0; i<heroes.ids.length; i++){
            var currentHero = heroes[heroes.ids[i]];
            ctx.fillText(currentHero.name,currentHero.x+16 , currentHero.y-30);
            ctx.drawImage(heroImage, currentHero.x, currentHero.y);
        }
    }

    if (monsterReady) {
        ctx.drawImage(monsterImage, monster.x, monster.y);
    }

    // Score
    ctx.fillStyle = "rgb(250, 250, 250)";
    ctx.font = "18px Helvetica";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
//    ctx.fillText("Goblins caught: " + monstersCaught, 32, 32);
};

// The main game loop
var main = function () {
    var now = Date.now();
    var delta = now - then;

    update(delta / 1000);
    render();

    then = now;
};




var then = Date.now();
setInterval(main, 1); // Execute as fast as possible



// gets a socket object to work with
var socket = io.connect(document.location.href);
// when the client connects to the server:
socket.on('connect', function() {
    // Registers a callback for chat event
    var data = {userID : userID};
    socket.emit('playerConnect', data);
});

socket.on('currentPlayers', function(data){
    // TODO: delete old players
    for(var i = 0; i<data.length; i++){
        if(heroes.ids.indexOf(data[i]) == -1){
            heroes[data[i]] = {};
            heroes.ids.push(data[i]);
        }
    }
});

// If the client gets an update event
// it adds the message it gets to the web page.
socket.on('update', function(data) {
    console.log(data);
    heroes[data.id] = data.data;
});

document.getElementById("btnName").onclick = function(){
    var name = document.getElementById("textName").value;
    heroes[userID].name = name;
};


