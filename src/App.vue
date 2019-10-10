<template>
  <div id="app">
    <ListView2 :listData="data" :itemSize="50" />
  </div>
</template>

<script>
// import ListView from './components/ListView.vue'
import ListView2 from './components/ListView2.vue'
import faker from 'faker';

export default {
  name: 'app',
  data(){
    let data = [];
    for (let id = 0; id < 50; id++) {
      data.push({
        "id": id,
        value: faker.lorem.sentences() // 长文本
      })
    }
    
    return {
      data
    };
  },
  components: {
    // ListView,
    ListView2,
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
