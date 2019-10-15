<template>
  <div ref="list" :style="{height}" class="infinite-list-container" @scroll="scrollEvent($event)">
    <div ref="phantom" class="infinite-list-phantom"></div>
    <div class="infinite-list" :style="getListStyle">
      <div ref="items"
        class="infinite-list-item" 
        v-for="item in visibleData" 
        :key="item.id"
        :id="'__' + item.id"
      >
        <p><span style="color:red">{{item.id}}</span>{{item.value}}</p>
      </div>
    </div>
  </div>
</template>


<script>
//组件api https://github.com/dwqs/react-virtual-list/blob/develop/README-CN.md
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
      default:100
    },
    //缓冲区比例
    bufferScale:{
      type:Number,
      default:1
    },
    //容器高度 100px or 50vh
    height:{
      type:String,
      default:'100%'
    }
  },
  computed:{
    //可显示的列表项数
    visibleCount(){
      return Math.ceil(this.screenHeight / this.estimatedItemSize);
    },
    //顶部预渲染数据条数
    aboveCount(){
      return Math.min(this.start,this.bufferScale * this.visibleCount)
    },
    //底部预渲染数据条数
    belowCount(){
      return Math.min(this.listData.length - this.end,this.bufferScale * this.visibleCount);
    },
    //偏移量对应的style
    getListStyle(){
      return {
        transform:`translate3d(0,${this.startOffset}px,0)`
      }
    },
    //获取真实显示列表数据
    visibleData(){
      let start = this.start - this.aboveCount;
      let end = this.end + this.belowCount;
      return this.listData.slice(start, end);
    }
  },
  mounted() {
    this.screenHeight = this.$el.clientHeight;
    this.start = 0;
    this.end = this.start + this.visibleCount;
    window.list = this.$refs.list //TODO delete
    window.cache = this.cache;
  },
  updated(){
    //设置列表项缓存
    this.setCacheByNodes(this.$refs.items)
    //修改列表高度
    this.setListHeight();
  },
  data() {
    return {
      cache:{
        positions:[
          // {
          //   top:顶部距离列表头的距离
          //   bottom:底部距离列表头的距离
          //   height:实际高度（bottom - top）
          // }
        ],
        knownSize:0,//已渲染过的列表项的高度总和(单位PX)
        knownNum:0,//已渲染过的列表项数
      },
      //可视区域高度
      screenHeight:0,
      //偏移量
      startOffset:0,
      //起始索引
      start:0,
      //结束索引
      end:0,
    };
  },
  methods: {
    //获取列表起始索引
    getStartIndex(scrollTop = 0){
      let item = this.cache.positions.find(i => i && i.bottom > scrollTop);
      if(item){
        return item.index;  
      }else{
        return Math.ceil((scrollTop - this.cache.knownSize)/this.estimatedItemSize)
      }
    },
    //设置列表高度
    setListHeight(){
      let height = this.cache.knownSize + (this.listData.length - this.cache.knownNum) * this.estimatedItemSize
      this.$refs.phantom.style.height = height + 'px'
    },
    //设置缓存
    setCacheByNodes(nodes){
      let items = Array.from(nodes);
      let scrollTop = this.$refs.list.scrollTop;
      items.forEach((el,i)=>{
          let rect = el.getBoundingClientRect();
          let top = rect.top + scrollTop;
          let bottom = rect.bottom + scrollTop;
          let height = bottom - top;
          //当前节点在总列表中的索引
          let index = this.start - this.aboveCount + i;
          //当前节点不存在缓存
          if(!this.cache.positions[index]){
              //修改已知的列表项总高度
              this.cache.knownSize = this.cache.knownSize + height;
              //修改已知的列表项数量
              this.cache.knownNum ++ ;
              //缓存节点的位置信息
              this.cache.positions[index] = {
                id:el.id,
                index,
                top,
                bottom,
                height
              }
          }
      })
    },
    //滚动事件
    scrollEvent() {
      //当前滚动位置
      let scrollTop = this.$refs.list.scrollTop;
      //此时的开始索引
      this.start = this.getStartIndex(scrollTop);
      //此时的结束索引
      this.end = this.start + this.visibleCount;
      //此时的偏移量
      if(this.start >= 1){
        let size = 0;
        for(let i = 1; i<= this.aboveCount;i++){
          size += this.cache.positions[this.start - i].height;
        }
        this.startOffset = this.cache.positions[this.start - 1].bottom - size;
      }else{
        this.startOffset = 0;
      }
    }
  }
};
</script>


<style scoped>
.infinite-list-container {
  overflow: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
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
}

.infinite-list-item {
  padding: 5px;
  color: #555;
  box-sizing: border-box;
  border-bottom: 1px solid #999;
}
</style>