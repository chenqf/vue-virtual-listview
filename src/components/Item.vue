<template>
  <div
    class="infinite-list-item"
  >
    <p><span style="color:red">{{item.id}}</span>{{item.value}}</p>
  </div>
</template>


<script>
//组件api https://github.com/dwqs/react-virtual-list/blob/develop/README-CN.md
export default {
  props: {
    //所有列表数据
    item:{
      type:Object,
      default:()=>{}
    }
  },
  
  mounted() {
    
  },
  updated(){
    
  },
  data() {
    return {
      
    };
  },
  methods: {
    
  }
};
</script>


<style scoped>
.infinite-list-item {
  padding: 5px;
  color: #555;
  box-sizing: border-box;
  border-bottom: 1px solid #999;
  height:200px;
}
</style>