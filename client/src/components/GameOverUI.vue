<template>
    <div class="my-4">
        <h1>Game Over</h1>
        <div class="d-flex justify-content-center my-3">
        <p>Team {{winner}} hat gewonnen!</p>
        </div>
        <div class="d-flex justify-content-center my-3">
            <BButton @click="backToLobby">Spiel neustarten</BButton>
        </div>
        
        
    </div>  
</template>
  
  <script>
  import { socket, state } from '@/socket'
  export default {
    name: 'StartUI',
    computed: {
        winner: () => {
        if (state.tickets[0] > state.tickets[1] ) {
            return 'Blau';
        } else {
            return 'Rot';
        }
        }
    },
    methods: {
      backToLobby () {
        socket.emit('backToLobby')
      }
    }
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