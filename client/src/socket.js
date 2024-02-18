import { reactive } from "vue";
import { io } from "socket.io-client";

export const state = reactive({
  connected: false,
  flags: [{letter: "A", players: [], status: 0}],
  tickets: [100, 100],
  gamestate: "lobby",
  my_flag: "A",
  ready: false,
  settings: {flagAmount: 1, startingTickets: 100, respawnTime: 10, captureTime: 10, ticketDecrement: 3, ticketDecay: 1},
});

// "undefined" means the URL will be computed from the `window.location` object
// const URL = process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000";

export const socket = io('http://localhost:3000', {
    withCredentials: true,
    extraHeaders: {
    "ctf-header-jo": ""
}});

socket.on("connect", () => {
  if(localStorage.id == null) {
    localStorage.id = socket.id;
  } else {
    socket.emit("namechange", localStorage.id)
    localStorage.id = socket.id;
  }
  
  state.connected = true;
});

socket.on("disconnect", () => {
  state.connected = false;
});

socket.on("flags", (...args) => {
  state.flags = args[0];
  for (let i = 0; i < args[0].length; i++) {
    if (args[0][i].players.includes(socket.id)) {
      state.my_flag = args[0][i].letter;
      state.ready = args[0][i].ready;
      return;
    }
  } 
});

socket.on("tickets", (...args) => {
  state.tickets = args[0];
});

socket.on("gamestate", (...args) => {
  state.gamestate = args[0];
});

socket.on("settings", (...args) => {
  state.settings = args[0];
});