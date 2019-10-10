<template>
  <div ref="list" class="infinite-list-container" @scroll="scrollEvent($event)">
    <div class="infinite-list-phantom" :style="{ height: listHeight + 'px' }"></div>
    <div class="infinite-list" :style="{ transform: getTransform }">
      <div ref="items"
        class="infinite-list-item" 
        v-for="item in visibleData" 
        :id="'cqf' + item.id"
        :key="item.id"
        style="height:150px"
      >
        <p>{{item.value}}</p>
      </div>
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
    //预估高度
    estimatedItemSize:{
      type:Number,
      default:150
    },
    itemSize:{
      type:Number,
      default:50
    }
  },
  computed:{
    //列表总高度 OK
    listHeight(){
      return this.cache.knownSize + (this.listData.length - this.cache.knownNum) * this.estimatedItemSize
    },
    //可显示的列表项数 OK
    visibleCount(){
      return Math.ceil(this.screenHeight / this.estimatedItemSize);
    },
    //需要显示的数据
    visibleData(){
      return this.listData.slice(this.start, Math.min(this.end,this.listData.length));
    },
    //偏移量 TODO 
    startOffset(){
      return this.scrollTop - (this.scrollTop % this.estimatedItemSize);
    },
    //偏移量对应的style OK
    getTransform(){
      return `translate3d(0,${this.startOffset}px,0)`;
    },
    //获取起始索引
    start(){
      return Math.floor(this.scrollTop / this.estimatedItemSize);
    },
    //获取结束索引
    end(){
      return this.start + this.visibleCount;
    }
  },
  mounted() {
    this.screenHeight = this.$el.clientHeight;
  },
  updated(){
    let items = Array.from(this.$refs.items);
    items.forEach((el,index)=>{
        let rect = el.getBoundingClientRect();
        let top = rect.top + this.scrollTop + this.startOffset;
        let bottom = rect.bottom + this.scrollTop + this.startOffset;
        let height = bottom - top;
        let i = this.start + index;
        if(!this.cache.list[i]){
            this.cache.knownSize = this.cache.knownSize + height;
            this.cache.knownNum ++ ;
            this.cache.list[this.start + index] = {
              top,
              bottom,
              height
            }
        }
    })
    console.log(this.cache.list);
    
  },
  data() {
    return {
      /**
       * 缓存列表项真实高度及距离顶部的偏移量,格式如下
       * [
       *    {
       *        top:顶部距离列表头的距离
       *        bottom:底部距离列表头的距离
       *        height:实际高度（bottom - top）
       *    }
       * ]
       */
      cache:{
        list:[],
        knownSize:0,//已渲染过的列表项的高度总和(单位PX)
        knownNum:0,//已渲染过的列表项数
      },
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
  padding: 5px;
  color: #555;
  box-sizing: border-box;
  border-bottom: 1px solid #999;
}
</style>