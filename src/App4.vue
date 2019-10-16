<template>
  <div id="app">
    <VirtualList4 :listData="data" :estimatedItemSize="200" v-slot="slotProps">
        <Item :item="slotProps.item"/>
    </VirtualList4>
  </div>
</template>

<script>
import VirtualList4 from './components/VirtualList4.vue'
import Item from './components/Item.vue'
import faker from 'faker';

export default {
  name: 'app',
  data(){
    

    
    return {
      data:[]
    };
  },
  created(){

    let data = [];
    for (let id = 0; id < 500; id++) {
      data.push({
        id,
        height:200,
        value: faker.lorem.sentences() // 长文本
      })
    }

    data[19].height = 300;
    data[29].height = 300;
    setTimeout(()=>{
      this.data = data;
    },500);
    
  },
  components: {
    VirtualList4,
    Item
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
