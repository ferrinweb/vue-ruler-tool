<template>
  <div id="app">
    <div class="action-bar">
      <button @click="visible = !visible">显示/隐藏标尺</button>
      <button @click="presetLine = []">清空</button>
      <button @click="presetLine = [{ type: 'h', site: 100 }, { type: 'v', site: 200 }]">修改</button>
    </div>
    <section style="height: 100%; width: 100%;">
      <vue-ruler-tool
        v-model="presetLine"
        :step-length="50"
        :parent="true"
        :is-scale-revise="true"
        :visible.sync="visible"
        :contentLayout="{top: 100, left: 100}"
      >
        <img src="https://cn.vuejs.org/images/logo.png" style="width: 3000px;height: 3000px;margin: 100px;" alt="">
         <!--<iframe src="https://www.baidu.com" width="500" height="300" />-->
      </vue-ruler-tool>
    </section>
  </div>
</template>

<script>
import VueRulerTool from './components/vue-ruler-tool'
export default {
  name: 'app',
  components:{
    VueRulerTool
  },
  data () {
    return {
      presetLine: [{ type: 'h', site: 200 }, { type: 'v', site: 100 }],
      visible: true
    }
  },
  watch: {
    visible(val) {
      console.log(val)
    }
  }
}
</script>

<style lang="scss">
html, body{
  margin: 0;
  width: 100%;
  height: 100%;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100%;
  height: 100%;
}
.action-bar{
  position: absolute;
  bottom: 15px;
  right: 15px;
  z-index: 4;
}
</style>
