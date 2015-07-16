var express = require("express");

var app = express(),
    port     = 4040,
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    players = [];


app.configure(function(){
    // set up our express application
    app.use(express.static(__dirname + '/public')); // for static resources in the public folder
    app.use(express.logger('dev')); // log every request to the console
    app.use(express.cookieParser('huehuehue')); // read cookies
    app.use(express.session()); // manages user sessions
    app.use(express.bodyParser()); // get information from html forms
    app.set('view engine', 'ejs'); // set up ejs for templating
});


// get the main html page at /
app.get('/', function(req, res) {
    res.render('index', {userID: req.sessionID});
});

// when a client connects to the server,
io.sockets.on('connection', function(socket) {
    // the server registers a callback
    // if it receives an event called playerMove

    socket.on('playerConnect', function(data){
        if(players.indexOf(data.userID)== -1){
            players.push(data.userID);
            io.sockets.emit('currentPlayers', players);
        }
    })

    socket.on('playerMove', function(data) {
        // it adds the data (a new message) to the
        // messages array, and updates the other clients
        if (data !== undefined) {
            io.sockets.emit('update', data);
        }
    });

})

// tells the server to listen to port 8000
server.listen(port);
console.log('app started on port '+port);
