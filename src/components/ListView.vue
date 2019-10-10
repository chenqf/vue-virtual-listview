<template>
  <div ref="list" class="infinite-list-container" @scroll="scrollEvent($event)">
    <div class="infinite-list-phantom" :style="{ height: listHeight + 'px' }"></div>
    <div class="infinite-list" :style="{ transform: getTransform }">
      <div ref="items"
        class="infinite-list-item" 
        v-for="item in visibleData" 
        :key="item.id"
        :style="{ height: itemSize + 'px',lineHeight: itemSize + 'px' }"
        >{{ item.id }}</div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    //所有列表数据
    listData:{
      type:Array,
      default:()=>[]
    },
    //每项高度
    itemSize: {
      type: Number
    }
  },
  computed:{
    //列表总高度
    listHeight(){
      return this.listData.length * this.itemSize;
    },
    //可显示的列表项数
    visibleCount(){
      return Math.ceil(this.screenHeight / this.itemSize);
    },
    //需要显示的数据
    visibleData(){
      return this.listData.slice(this.start, Math.min(this.end,this.listData.length));
    },
    //偏移量对应的style
    getTransform(){
      //获取偏移量
      const startOffset = this.scrollTop - (this.scrollTop % this.itemSize);
      return `translate3d(0,${startOffset}px,0)`;
    },
    //获取起始索引
    start(){
      return Math.floor(this.scrollTop / this.itemSize);
    },
    //获取结束索引
    end(){
      return this.start + this.visibleCount;
    }
  },
  mounted() {
    this.screenHeight = this.$el.clientHeight;
  },
  data() {
    return {
      //可视区域高度
      screenHeight:0,
      //滚动位移量
      scrollTop:0
    };
  },
  methods: {
    scrollEvent() {
      //当前滚动位置
      this.scrollTop = this.$refs.list.scrollTop;
    }
  }
};
</script>


<style scoped>
.infinite-list-container {
  height: 100%;
  overflow: auto;
  position: relative;
}

.infinite-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.infinite-list {
  left: 0;
  right: 0;
  top: 0;
  position: absolute;
  text-align: center;
}

.infinite-list-item {
  padding: 10px;
  color: #555;
  box-sizing: border-box;
}
</style>