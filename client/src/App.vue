<template>
  <CTFUI />
</template>

<script>
import CTFUI from './components/CTFUI.vue'

export default {
  name: 'App',
  components: {
    CTFUI
  }
}
</script>

<style>
html, body {
  background-color: #f5f5f5;
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
