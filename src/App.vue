<template>
  <div id="app">
    <VirtualList :listData="data" :itemSize="150" />
  </div>
</template>

<script>
import VirtualList from './components/VirtualList.vue'
import faker from 'faker';

export default {
  name: 'app',
  data(){
    let data = [];
    for (let id = 0; id < 50000; id++) {
      data.push({
        id,
        value: faker.lorem.sentences().slice(0,5) // 长文本
      })
    }
    return {
      data
    };
  },
  components: {
    VirtualList
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
