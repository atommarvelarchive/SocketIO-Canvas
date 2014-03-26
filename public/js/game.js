var gameManager = function(){
    //TODO: remove player
    //TODO: connection status

    var canvas, userID, heroSpeed, ctx, images, playerManager, newData, keysDown, then, socket, stats;

    function initImage (url) {
        var img = new Image();
        img.isReady = false;
        img.onload = function(){
            img.isReady = true;
        }
        img.src = url;
        return img;
    }

    function fontStyle () {
        ctx.fillStyle = "rgb(250, 250, 250)";
        ctx.font = "18px Helvetica";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
    }

    function bgStyle() {
        ctx.fillStyle = "#69AB20";
    }

    function initSocketIO () {
        console.log("io init");
        // gets a socket object to work with
        socket = io.connect(document.location.href);
        // when the client connects to the server:
        socket.on('connect', function() {
            // Registers a callback for chat event
            var data = {userID : userID};
            socket.emit('playerConnect', data);
        });

        socket.on('currentPlayers', function(data){
            // TODO: delete old players
            for(var i = 0; i<data.length; i++){
                if(playerManager.ids.indexOf(data[i]) == -1){
                    playerManager[data[i]] = {};
                    playerManager.ids.push(data[i]);
                }
            }
        });

        socket.on('update', function(data) {
//            console.log(data);
            playerManager[data.id] = data.data;
        });
    }

    this.init = function(){
        initSocketIO();
        //    game constants
        userID = document.getElementById("script-data").getAttribute("data-id");
        heroSpeed = 256;
        //    create Canvas
        canvas = document.getElementById("game");
        ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth - 30;
        canvas.height = window.innerHeight - 60;
        //    load bg and hero images
        images = {};
        images.bg = initImage("/images/background.png"); //initImage("https://farm8.staticflickr.com/7333/13311761513_351c5e7633_o.png");
        images.hero = initImage("/images/hero.png"); //initImage("https://farm8.staticflickr.com/7142/13311980524_135fd568cd_o.png");
        //    add your own player to the player manager
        playerManager  = {
            ids: [userID]
        };
        playerManager[userID] = {
            x : canvas.width / 2,
            y:  canvas.height / 2
        };
        // Handle keyboard controls
        keysDown = {};
        addEventListener("keydown", function (e) {
//    console.log(e.keyCode);
            keysDown[e.keyCode] = true;
        }, false);
        addEventListener("keyup", function (e) {
            delete keysDown[e.keyCode];
        }, false);

        //  username init function
        document.getElementById("btnName").onclick = function(){
            var name = document.getElementById("textName").value;
            playerManager[userID].name = name;
        };
        document.getElementById("textName").value = "undefined";
        //  Start game
        then = Date.now();
        setInterval(main, 1); // Execute as fast as possible
    }

    // Update game objects
    function update (modifier) {
        if (38 in keysDown) { // Player holding up
            playerManager[userID].y -= heroSpeed * modifier;
            newData = true;
        }

        if (40 in keysDown) { // Player holding down
            playerManager[userID].y += heroSpeed * modifier;
            newData = true;
        }
        if (37 in keysDown) { // Player holding left
            playerManager[userID].x -= heroSpeed * modifier;
            newData = true;
        }
        if (39 in keysDown) { // Player holding right
            playerManager[userID].x += heroSpeed * modifier;
            newData = true;
        }
        if(192 in keysDown) {
            stats = true;
        }

        if(newData == true){
            socket.emit('playerMove', {data: playerManager[userID], id: userID});
            newData = false;
        }
    }

    // Draw everything
    function render () {
        if (images.bg.isReady) {
            bgStyle();
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (images.hero.isReady) {
            for(var i = 0; i<playerManager.ids.length; i++){
                var currentHero = playerManager[playerManager.ids[i]];
                fontStyle();
                ctx.fillText(currentHero.name,currentHero.x+16 , currentHero.y-30);
                ctx.drawImage(images.hero, currentHero.x, currentHero.y);
            }
        if(stats == true){
            var statsString = "";
        }
        }
    };

    // The main game loop
    function main () {
        var now = Date.now();
        var delta = now - then;
        update(delta / 1000);
        render();
        then = now;
    };
};

var gm = new gameManager();

gm.init();
