<template>
  <div id="app">
    <VirtualListD1 :listData="data" :itemSize="40" />
  </div>
</template>

<script>
import VirtualListD1 from './components/VirtualListD1.vue'
import faker from 'faker';
import _ from 'lodash'

export default {
  name: 'app',
  data(){
    let data = [];
    for (let id = 0; id < 100000; id++) {
      data.push({
        id,
        value: faker.lorem.sentences().slice(0,5) // 长文本
      })
    }
    return {
      data:Object.freeze(data)
    };
  },
  components: {
    VirtualListD1
  }
}
</script>

<style>
html{
  height: 100%;
}
body{
  height: 100%;
  margin:0;
}
#app{
  height:100%;
}

</style>
