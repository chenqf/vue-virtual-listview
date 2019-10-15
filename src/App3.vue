<template>
  <div id="app">
    <VirtualList3 :listData="data" :estimatedItemSize="200" />
  </div>
</template>

<script>
import VirtualList3 from './components/VirtualList3.vue'
import faker from 'faker';

export default {
  name: 'app',
  data(){
    let data = [];
    for (let id = 0; id < 50000; id++) {
      data.push({
        id,
        value: faker.lorem.sentences() // 长文本
      })
    }
    
    return {
      data:Object.freeze(data)
    };
  },
  components: {
    VirtualList3
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
