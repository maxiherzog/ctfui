<template>
  <div class="ui">
    
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
    <BButton @click="backToLobby">Spiel neustarten</BButton>
    </div>
</template>

<script>
import {socket, state} from '../socket'
import { useSound } from '@vueuse/sound'
import shortBeep from '../assets/sounds/short_beep.wav'
import longBeep from '../assets/sounds/long_beep.mp3'

// const modal = ref(false);

export default {
  name: 'CTFUI',
  data () {
    return {
      my_flag: null,
      modal: false,
      respawnInterval: null,
      value_blue: 50,
      value_red: 50,
      respawns: [],
      respawn_counter: 0,
      capturing: false,
    }
  },
  computed: {
    connected: () => state.connected,
    flags: () => state.flags,
    tickets: () => state.tickets,
    settings: () => state.settings
  },
  methods: {
    respawn () {
      // check if this is captured
      // if not, do nothing
      // if yes, respawn
      var status = 0
      

      for (let i = 0; i < this.flags.length; i++) {
        if (this.flags[i].players.includes(socket.id)) {
          status = this.flags[i].status;
        }
      }
      if (status == 100 || status == -100) {
        this.respawns.push({id: this.respawn_counter, time_left: 10});
        this.respawn_counter++;
        // resume audio context
        // audioContext.resume().then(() => {
        //   console.log('Playback resumed successfully');
        // });
      }

      
    },

    click() {
      socket.emit('click')
    },
    restartGame() {
      socket.emit('restart', this.rangeValue)
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
        if (this.flags[i].players.includes(socket.id)) {
          status = this.flags[i].status;
        }
      }

      socket.emit('capture', status)
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
        socket.emit('capture', status)
      }, 100)
    }
  },
  setup() {
    const LongSound = useSound(longBeep);
    const ShortSound = useSound(shortBeep);
    // const { playLong } = useSound(longBeep);
    console.log("Loaded sounds..")
    return {
      LongSound, ShortSound
    }
  },
  watch: {
    flags: function() {
      for (let i = 0; i < this.flags.length; i++) {
        if (this.flags[i].players.includes(socket.id)) {
          this.my_flag = this.flags[i].letter;
        }
      }
    },
    tickets: function(newVal) {
      this.value_blue = Math.round(newVal[0]/(newVal[0]+newVal[1])*100)
      this.value_red = Math.round(newVal[1]/(newVal[0]+newVal[1])*100)
    }
  },
  mounted() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();


    this.respawnInterval = setInterval(() => {
      var played = false;
      // this.play();
      for (let i = 0; i < this.respawns.length; i++) {
        this.respawns[i].time_left -= 1;
        

        if (this.respawns[i].time_left <= 0) {
          // remove respawn at index i
          this.respawns.splice(i,1);
          socket.emit('subtractTicket');

          if (played == false) {
            this.LongSound.play();
            played = true;
          }
        } else if (this.respawns[i].time_left <= 3) {
          if (played == false) {
            this.ShortSound.play();
            played = true;
          }
        }
        
      }
      // this.$forceUpdate()
      // if (played == false) {
      //   // playShort();
      // }
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
