// Create a rectangle with an (x, y) coordinate, a width, and a height
function rect(x, y, w, h) {
  return { x: x, y: y, w: w, h: h }
}

// Represent the level as a list of rectangles
var rects = [
  rect(0, 0, 400, 20),
  rect(0, 0, 20, 300),
  rect(0, 280, 400, 20),
  rect(380, 0, 20, 300),
  rect(0, 100, 100, 20),
  rect(100, 120, 20, 20),
  rect(120, 140, 20, 20),
  rect(140, 160, 20, 20),
  rect(160, 180, 20, 20),
  rect(180, 200, 20, 20),
  rect(200, 220, 100, 20)
]

var gameManager = function(){
    //TODO: remove player
    //TODO: connection status

    var canvas, userID, heroSpeed, ctx, images, playerManager, newData, keysDown, then, socket, stats;
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
            if(data.id !== userID){
                playerManager[data.id] = data.data;
            }
        });
    }

    this.init = function(){
        document.addEventListener('keydown', function(e){
                e.preventDefault();
        })
        initSocketIO();
        //    game constants
        userID = document.getElementById("script-data").getAttribute("data-id");
        //heroSpeed = 256;
        //    create Canvas
        canvas = document.getElementById("game");
        ctx = canvas.getContext("2d");
        //    add your own player to the player manager
        playerManager  = {
            ids: [userID]
        };
        playerManager[userID] = {
            x : 20,
            y:  20,
            velocity: {
                x: 0,
                y: 0
            },
            onFloor: false,
            w: 20,
            h: 20,
            id: userID,
            old: {}
        };
        // Handle keyboard controls
        keysDown = {};
        document.onkeydown = function(e) { keysDown[e.which] = true }
        document.onkeyup = function(e) { keysDown[e.which] = false }

        renderEnvironment();
        setInterval(main,1000 / 30 ); // 30fps
    }

    // Update game objects
    function update (modifier) {

        //save old location
        playerManager[userID].old.x = playerManager[userID].x;
        playerManager[userID].old.y = playerManager[userID].y;

        // Update the velocity
        playerManager[userID].velocity.x = 3 * (!!keysDown[39] - !!keysDown[37]) // right - left
        playerManager[userID].velocity.y += 1 // Acceleration due to gravity

        // Move the player and detect collisions
        var expectedY = playerManager[userID].y + playerManager[userID].velocity.y
        move(playerManager[userID], playerManager[userID].velocity.x, playerManager[userID].velocity.y)
        playerManager[userID].onFloor = (expectedY > playerManager[userID].y)
        if (expectedY != playerManager[userID].y) playerManager[userID].velocity.y = 0

        // Only jump when we're on the floor
        if (playerManager[userID].onFloor && keysDown[38]) {
          playerManager[userID].velocity.y = -13
          jumpSound.play()
        }
        socket.emit('playerMove', {data: playerManager[userID], id: userID});
    }

    function renderEnvironment(){
      // Draw background
      ctx.fillStyle = '#EEE'
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)


      // Draw levels
      ctx.fillStyle = '#BBB'
      for (var i = 0; i < rects.length; i++) {
        var r = rects[i]
        ctx.fillRect(r.x, r.y, r.w, r.h)
      }
    }
    // Draw everything
    function render () {
      for(var i = 0; i<playerManager.ids.length; i++){
          var currentHero = playerManager[playerManager.ids[i]];
          //erase old location
          ctx.fillStyle = '#EEE';
          ctx.fillRect(currentHero.old.x, currentHero.old.y, 20,20);
          // Draw players
          ctx.fillStyle = '#D00'
          if(currentHero.id !== userID) ctx.fillStyle = "0D0";
          ctx.fillRect(currentHero.x, currentHero.y, 20, 20)
      }
    };
    // Returns true iff a and b overlap
   function overlapTest(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x &&
             a.y < b.y + b.h && a.y + a.h > b.y
    }

    // Move the rectangle p along vx then along vy, but only move
    // as far as we can without colliding with a solid rectangle
    function move(p, vx, vy) {
      // Move rectangle along x axis
      for (var i = 0; i < playerManager.ids.length; i++) {
        var c = { x: p.x + vx, y: p.y, w: p.w, h: p.h }
        var friend = playerManager[playerManager.ids[i]];
        if (friend.id !== userID && overlapTest(c, friend)) {
          if (vx < 0) vx = friend.x + friend.w - p.x
          else if (vx > 0) vx = friend.x - p.x - p.w
        }
      }
      for (var i = 0; i < rects.length; i++) {
        var c = { x: p.x + vx, y: p.y, w: p.w, h: p.h }
        if (overlapTest(c, rects[i])) {
          if (vx < 0) vx = rects[i].x + rects[i].w - p.x
          else if (vx > 0) vx = rects[i].x - p.x - p.w
        }
      }
      p.x += vx

      // Move rectangle along y axis
      for (var i = 0; i < playerManager.ids.length; i++) {
        var c = { x: p.x, y: p.y + vy, w: p.w, h: p.h }
        var friend = playerManager[playerManager.ids[i]];
        if (friend.id !== userID && overlapTest(c, friend)) {
          if (vy < 0) vy = friend.y + friend.h - p.y
          else if (vy > 0) vy = friend.y - p.y - p.h
        }
      }
      for (var i = 0; i < rects.length; i++) {
        var c = { x: p.x, y: p.y + vy, w: p.w, h: p.h }
        if (overlapTest(c, rects[i])) {
          if (vy < 0) vy = rects[i].y + rects[i].h - p.y
          else if (vy > 0) vy = rects[i].y - p.y - p.h
        }
      }
      p.y += vy
    }

    // The main game loop
    function main () {
        update();
        render();
    };
};

var gm = new gameManager();

gm.init();
