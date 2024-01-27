<template>
  <!-- <h1>Tickets:</h1> -->
  <BProgress height="80px">
    <BProgressBar :value="value_blue" :max="100" variant="primary"><h1>Blau {{tickets[0]}}</h1></BProgressBar>
    <BProgressBar :value="value_red" :max="100" variant="danger"><h1>Rot {{tickets[1]}}</h1></BProgressBar>
  </BProgress>
  <!-- <br> -->
  <div v-for="flag in flags" v-bind:key="flag.letter" :class="{me: flag.letter==my_flag, flag: true}">
    {{flag.letter}}: {{flag.status}}
    <BProgress 
      class="progress-flag"
      :variant="flag.status < 0 ? 'danger' : ''" 
      :value="Math.abs(flag.status)" 
      width="100%"
      :animated="capturing">
    </BProgress>

  </div>
  <br>
  <BButton variant="danger" @click="capture(-1)">Capture Red</BButton>
  <BButton variant="primary" @click="capture(+1)">Capture Blue</BButton><br>
  <BButton @click="respawn" :disabled="capturing">Respawn</BButton>

  <BBadge v-for="respawn in respawns" :key="respawn.id" variant="warning">{{respawn.id}}: {{ respawn.time_left }}</BBadge><br>

  <BButton @click="cycleFlag" :disabled="capturing">Next flag</BButton>

  <br>
  <BButton @click="restartModal = true">Spiel neustarten</BButton>
  <BModal v-model="this.restartModal" title="Restart" @ok="restartGame">
    <p>Bist du sicher, dass du das Spiel neustarten willst?</p>
    
    <BButton v-b-toggle.settings-collapse variant="primary">Einstellungen</BButton>

    <BCollapse id="settings-collapse">
      <label for="flagAmount">Anzahl Flaggen</label>
      <BFormInput id="flagAmount" type="number" v-model="form_flagAmount" min="1" max="8" />
      <label for="startingTickets">Starttickets pro Team</label>
      <BFormInput id="startingTickets" type="number" v-model="form_startingTickets" min="1" max="1000" />
      <label for="respawnTime">Respawnzeit</label>
      <BFormInput id="respawnTime" type="number" v-model="form_respawnTime" min="1" max="1000" />
      <label for="captureTime">Capturezeit</label>
      <BFormInput id="captureTime" type="number" v-model="form_captureTime" min="1" max="1000" />
    </BCollapse>
  </BModal>

</template>

<script>
import io from 'socket.io-client'

// const modal = ref(false);

export default {
  name: 'CTFUI',
  data () {
    return {
      socket: io('http://localhost:3000'),
      flags: null,
      my_flag: null,
      modal: false,
      form_flagAmount: 1,
      form_startingTickets: 100,
      form_respawnTime: 10,
      form_captureTime: 10,
      respawnInterval: null,
      tickets: [100, 100],
      value_blue: 50,
      value_red: 50,
      respawns: [],
      respawn_counter: 0,
      capturing: false,
      restartModal: false,
    }
  },
  created() {
    this.socket = io('http://localhost:3000', {
      withCredentials: true,
      extraHeaders: {
      "ctf-header-jo": ""
    }});
  },
  methods: {
    respawn () {
      // check if this is captured
      // if not, do nothing
      // if yes, respawn
      var status = 0
      for (let i = 0; i < this.flags.length; i++) {
        if (this.flags[i].players.includes(this.socket.id)) {
          status = this.flags[i].status;
        }
      }
      if (status == 100 || status == -100) {
        this.respawns.push({id: this.respawn_counter, time_left: 10});
        this.respawn_counter++;
      }

      
    },

    click() {
      this.socket.emit('click')
    },
    cycleFlag() {
      this.socket.emit('cycleFlag')
    },
    restartGame() {
      this.socket.emit('restart', this.rangeValue)
      // this.restartModal = false
    },
    capture(direction) {
      // create a loop that increases the flag status by 1 every 10 ms
      // until it reaches 100
      
      this.respawns = [];
      this.capturing = true;
      // get current flag status
      // find status of flag with my id
      var status = 0
      for (let i = 0; i < this.flags.length; i++) {
        if (this.flags[i].players.includes(this.socket.id)) {
          status = this.flags[i].status;
        }
      }

      this.socket.emit('capture', status)
      clearInterval(this.captureInterval)
      this.captureInterval = setInterval(() => {
        status += direction;

       
        if (status >= 100) {
          status = 100;
          clearInterval(this.captureInterval)
          this.capturing = false;
        } else if (status <= -100) {
          status = -100;
          clearInterval(this.captureInterval)
          this.capturing = false;
        }
        this.socket.emit('capture', status)
      }, 100)
    }
  },
  mounted() {
    this.socket.on('flags', flags => {
      this.flags = flags
      for (let i = 0; i < this.flags.length; i++) {
        if (this.flags[i].players.includes(this.socket.id)) {
          this.my_flag = this.flags[i].letter;
        }
      }

      this.$forceUpdate()
    });

    this.socket.on('tickets', tickets => {
      console.log(tickets)
      this.tickets = tickets
      this.value_blue = Math.round(tickets[0]/(tickets[0]+tickets[1])*100)
      this.value_red = Math.round(tickets[1]/(tickets[0]+tickets[1])*100)
    });


    this.respawnInterval = setInterval(() => {
      for (let i = 0; i < this.respawns.length; i++) {
        this.respawns[i].time_left -= 1;
        if (this.respawns[i].time_left <= 0) {
          // remove respawn at index i
          this.respawns.splice(i,1);
          this.socket.emit('subtractTicket');
        }
        this.$forceUpdate()
      }
    }, 1000)


  }
}
</script>

<style>
.me {
  background-color: rgb(248, 214, 214);
}

.progress-flag {
  transition: none !important;
}
</style>
