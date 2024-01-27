const { Socket } = require('socket.io');

const Express = require('express')();
const Http = require('http').Server(Express);
const Socketio = require('socket.io')(Http, {
    cors: {
        origin: 'http://localhost:8080',
        methods: ['GET', 'POST'],
        allowedHeaders: ["ctf-header-jo"],
        credentials: true
    }
});

// string: buchstabe, list of socket_ids that represent players, status: -100 red, 0 neutral, 100 blue

var amountOfFlags = 4; 
const buchstaben = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

var tickets = [100, 100]; // TODO

var flags = [];

function initializeFlags() {
    for (let i = 0; i < amountOfFlags; i++) {
        flags[i] = {
            letter: buchstaben[i],
            players: [],
            status: 0
        }
    }
}
initializeFlags();

// create Game loop intveral updating each 5 seconds
var gameLoop = setInterval(() => {
    // check if a flag is captured
    for (let i = 0; i < amountOfFlags; i++) {
        if (flags[i].status == -100) {
            tickets[0] -= 1;
        } else if (flags[i].status == 100) {
            tickets[1] -= 1;
        }
    }
    Socketio.emit("tickets", tickets);
}, 5000);

// every time a player connects
Socketio.on('connection', socket => {
    console.log("player connected: " + socket.id);
    // assign flag to player, if their players array is empty
    var was_flag_assigned = false;
    for (let i = 0; i < amountOfFlags; i++) {
        if (flags[i].players.length == 0) {
            flags[i].players.push(socket.id);
            was_flag_assigned = true;
            break;
        }
    } // otherwise assign random flag to player
    if (!was_flag_assigned) {
        var random_flag = Math.floor(Math.random() * amountOfFlags);
        flags[random_flag].players.push(socket.id);
    }
    // send flags to client
    Socketio.emit("flags", flags);
    socket.emit("tickets", tickets);
    socket.on("cycleFlag", () => {
        // move socket id from one flag to the following one
        for (let i = 0; i < amountOfFlags; i++) {
            if (flags[i].players.includes(socket.id)) {
                flags[i].players.splice(flags[i].players.indexOf(socket.id), 1);
                if (i == amountOfFlags - 1) {
                    flags[0].players.push(socket.id);
                } else {
                    flags[i + 1].players.push(socket.id);
                }
                break;
            }
        }
        Socketio.emit("flags", flags);
    });

    socket.on("restart", amountOfFlags => {
        console.log("restart");
        amountOfFlags = amountOfFlags;
        initializeFlags(amountOfFlags);
        Socketio.emit("flags", flags);
        Socketio.broadcast.emit("flags", flags);
    });

    socket.on("capture", status => {
        // change status of flag
        for (let i = 0; i < amountOfFlags; i++) {
            if (flags[i].players.includes(socket.id)) {
                flags[i].status = status;
                break;
            }
        }
        socket.emit("flags", flags);
        socket.broadcast.emit("flags", flags);
    });

    socket.on("subtractTicket", () => { 
        for (let i = 0; i < amountOfFlags; i++) {
            if (flags[i].players.includes(socket.id)) {
                if (flags[i].status == -100) {
                    tickets[1] -= 1;
                } else if (flags[i].status == 100) {
                    tickets[0] -= 1;
                }
                break;
            }
        }
        socket.emit("tickets", tickets);
        socket.broadcast.emit("tickets", tickets);
    });
});

Socketio.on("disconnect", socket => {
    console.log("player disconnected: " + socket.id);
});

Http.listen(3000, () => {
    console.log('Listening at :3000...');
});
