<template>
  <div id="app">
    <div v-if="!this.connected">Verbindungsfehler</div>
    <div v-else>
    <div v-if="gamestate === 'lobby'">
      <StartUI />
    </div>
    <div v-else-if="gamestate === 'running'">
      <CTFUI />
    </div>
  </div>
  </div>
</template>

<script>
import CTFUI from './components/CTFUI.vue'
import StartUI from './components/StartUI.vue'

import { state } from '@/socket'


export default {
  name: 'App',
  components: {
    StartUI,
    CTFUI
  },
  computed: {
    connected: () => state.connected,
    gamestate: () => state.gamestate
  }
}
</script>

<style>
html, body {
  background-color: #ffffff;
  width: 100% !important;
  min-height: 100%;
}
h1 {
  font-size: 4rem;
  text-align: center;
  margin: 0;
  padding: 0;
}
</style>
