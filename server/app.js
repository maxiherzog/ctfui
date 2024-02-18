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

var amountOfFlags = 8;
var ticketDecay = 1;
const buchstaben = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

var tickets = [100, 100]; // TODO

var previousFlags = [];
var flags = [];

function initializeFlags() {
    // keep state of flags in previousFlags (deep copy)
    previousFlags = JSON.parse(JSON.stringify(flags));
    var flags_new = [];
    for (let i = 0; i < amountOfFlags; i++) {
        flags_new[i] = {
            letter: buchstaben[i],
            players: [],
            status: 0,
            ready: false,
        }
    }
    flags = flags_new;
}

initializeFlags();
// console.log(flags);
// create Game loop intveral updating each 5 seconds
var gameLoop = setInterval(() => {
    // check if a flag is captured
    for (let i = 0; i < amountOfFlags; i++) {
        if (flags[i].status == -100) {
            tickets[0] -= ticketDecay;
        } else if (flags[i].status == 100) {
            tickets[1] -= ticketDecay;
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
    // console.log(flags)
    // send flags to client
    socket.emit("flags", flags);
    socket.emit("tickets", tickets);

    // stuff for lobby
    socket.on("ready", (ready) => {
        console.log("ready: " + ready, socket.id)
        for (let i = 0; i < amountOfFlags; i++) {
            if (flags[i].players.includes(socket.id)) {
                flags[i].ready = ready;
                break;
            }
        }
        socket.emit("flags", flags);
        socket.broadcast.emit("flags", flags);

        // check if >= 2 players are ready
        var readies = flags.filter(flag => flag.ready).length;
        if (readies >= 2) {
            // start game
            console.log("start game");
            socket.emit("gamestate", "running");
            socket.broadcast.emit("gamestate", "running");
        }

    });


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
        socket.emit("flags", flags);
    });

    socket.on("restart", settings => {
        console.log("restart");
        console.log(settings)
        // keep list of players
        // if amount of flags did not change, keep players on flags
        
        var players = [];
        for (let i = 0; i < amountOfFlags; i++) {
            players = players.concat(flags[i].players);
        }

        //make deep copy of flags
        var flags_from_before = JSON.parse(JSON.stringify(flags));
        
        amountOfFlags = settings.flagAmount;
        // init flags
        initializeFlags(amountOfFlags);
        console.log(flags_from_before);
        // TODO: Don't reassign players if amount of flags did not change


        // reassign players to flags
        for (let i = 0; i < players.length; i++) {
            var was_flag_assigned = false;
            for (let j = 0; j < amountOfFlags; j++) {
                if (flags[j].players.length == 0) {
                    flags[j].players.push(players[i]);
                    was_flag_assigned = true;
                    break;
                }
            } // otherwise assign random flag to player
            if (!was_flag_assigned) {
                var random_flag = Math.floor(Math.random() * amountOfFlags);
                flags[random_flag].players.push(players[i]);
            }
        }

        console.log(flags)
        tickets = [settings.startingTickets, settings.startingTickets];
        ticketDecay = settings.ticketDecay;

        // restart game loop
        clearInterval(gameLoop);
        gameLoop = setInterval(() => {
            // check if a flag is captured
            for (let i = 0; i < amountOfFlags; i++) {
                if (flags[i].status == -100) {
                    tickets[0] -= ticketDecay;
                } else if (flags[i].status == 100) {
                    tickets[1] -= ticketDecay;
                }
            }
            Socketio.emit("tickets", tickets);
        }, 5000);

        socket.emit("settings", settings);
        socket.broadcast.emit("settings", settings);
        socket.emit("gamestate", "lobby");
        socket.broadcast.emit("gamestate", "lobby");
        socket.emit("flags", flags);
        socket.broadcast.emit("flags", flags);
    });

    socket.on("backToLobby", () => {
        socket.emit("gamestate", "lobby");
        socket.broadcast.emit("gamestate", "lobby");
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
        // socket.emit("tickets", tickets);
        socket.broadcast.emit("tickets", tickets);
    });

    socket.on('disconnect', (reason) => {
        console.log('player disconnected: ' + socket.id);
        console.log('\treason: ' + reason);
        // remove player from flags
        for (let i = 0; i < amountOfFlags; i++) {
            if (flags[i].players.includes(socket.id)) {
                flags[i].players.splice(flags[i].players.indexOf(socket.id), 1);
            }
        }
        console.log("\tremoved player from flags.");
    });
});

Http.listen(3000, () => {
    console.log('Listening at :3000...');
});
