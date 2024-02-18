<template>
  <div class="my-4">
    <h1>Capture The Flag</h1>
    {{  my_flag }}
    <div class="d-flex justify-content-center my-3">
      <BButton
        id="checkbox-1"
        @click="readyToggle"
        :variant="ready ? 'success' : 'danger'"
      >
        {{ ready ? "Bereit" : "Nicht bereit" }}
      </BButton>
      <BButton @click="cycleFlag">Nächste Flagge</BButton>
      <BButton @click="restartModal = true">Einstellungen</BButton>
    </div>

    <BCardGroup deck class="d-flex justify-content-center">
      <BCard
        v-for="flag in flags"
        v-bind:key="flag.letter"
        :class="{ me: flag.letter == my_flag, ready: flag.ready }"
        style="max-width: 5rem"
      >
        <BCardTitle class="text-center">{{ flag.letter }}</BCardTitle>
      </BCard>
    </BCardGroup>
    <p class="text-center my-3">
        {{ sum_of_ready }} / 2 Flaggen bereit
    </p>
    <p class="text-center my-3">
      Spiel startet in <strong>{{ countdown }} Sekunden</strong> ...
    </p>
    <BModal
      fullscreen
      v-model="this.restartModal"
      title="Restart"
      @ok="setSettings"
    >
      <label for="flagAmount">Anzahl Flaggen</label>
      <BFormInput
        id="flagAmount"
        type="number"
        v-model="form_flagAmount"
        min="1"
        max="8"
      />
      <label for="startingTickets">Starttickets pro Team</label>
      <BFormInput
        id="startingTickets"
        type="number"
        v-model="form_startingTickets"
        min="1"
        max="1000"
      />
      <label for="respawnTime">Respawnzeit</label>
      <BFormInput
        id="respawnTime"
        type="number"
        v-model="form_respawnTime"
        min="1"
        max="1000"
      />
      <label for="captureTime">Capturezeit</label>
      <BFormInput
        id="captureTime"
        type="number"
        v-model="form_captureTime"
        min="1"
        max="1000"
      />
      <label for="ticketDecrement">Ticketabzug pro Respawn</label>
      <BFormInput
        id="ticketDecrement"
        type="number"
        v-model="form_ticketDecrement"
        min="1"
        max="1000"
      />
      <label for="ticketDecay"
        >Ticketabzug pro eingenommene Flagge des Gegenerteams (pro 5
        Sekunden)</label
      >
      <BFormInput
        id="ticketDecay"
        type="number"
        v-model="form_ticketDecay"
        min="1"
        max="1000"
      />
    </BModal>
  </div>
</template>

<script>
import { socket, state } from '@/socket'
export default {
  name: 'StartUI',
  data () {
    return {
      restartModal: false,
      countdown: 10,
      form_flagAmount: 1,
      form_startingTickets: 100,
      form_respawnTime: 10,
      form_captureTime: 10,
      form_ticketDecrement: 1,
      form_ticketDecay: 1,
    }
  },
    computed: {
        flags: () => state.flags,
        my_flag: () => state.my_flag,
        ready: () => state.ready,
        // settings: () => state.settings,
        sum_of_ready: () => state.flags.filter(flag => flag.ready).length,
    },
  methods: {
    setSettings () {
        this.restartModal = false;
        var settings = {
            flagAmount: this.form_flagAmount,
            startingTickets: this.form_startingTickets,
            respawnTime: this.form_respawnTime,
            captureTime: this.form_captureTime,
            ticketDecrement: this.form_ticketDecrement,
            ticketDecay: this.form_ticketDecay
        };
        console.log(settings);
        socket.emit('restart', settings);
    },
    cycleFlag () {
        socket.emit('cycleFlag');
    },
    readyToggle () {
        socket.emit('ready', !this.ready);
    }
  },
}

</script>

<style scoped>
html, body {
  background-color: #ffffff;
  width: 100% !important;
  min-height: 100%;
}

.ready {
  text-decoration: underline;
}
.me {
  background-color: #fff5f5;
}
</style>