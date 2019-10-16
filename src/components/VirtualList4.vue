<template>
  <div ref="list" :style="{height}" class="infinite-list-container" @scroll="scrollEvent($event)">
    <div ref="phantom" class="infinite-list-phantom"></div>
    <div ref="content" class="infinite-list">
      <div ref="items"
        v-for="item in visibleData" 
        :key="item.id"
      >
        <slot :item="item"></slot> 
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
      default:200
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
    window.vm = this;
  },
  updated(){
    //TODO 
    let nodes = this.$refs.items;
    if(!nodes){
      return ;
    }
    //获取真实渲染的大小
    let itemPositions = this.getItemsPositions(this.$refs.items);
    //更新缓存信息
    this.updateCacheInfo(itemPositions);
    //更新列表总高度
    let height = this.positions[this.positions.length - 1].bottom;
    this.$refs.phantom.style.height = height + 'px'
    //更新真实偏移量
    this.setStartOffset();
  },
  //TODO 
  data() {
    let positions = [];
    this.listData.forEach((item,index)=>{
      positions.push({
        index,
        top:index ? positions[index - 1].bottom : 0,
        height:this.estimatedItemSize,
        bottom:(index ? positions[index - 1].bottom : 0) + this.estimatedItemSize
      })
    })
    return {
      positions,
      //可视区域高度
      screenHeight:0,
      //起始索引
      start:0,
      //结束索引
      end:0,
    };
  },
  methods: {
    //获取列表起始索引
    getStartIndex(scrollTop = 0){
      let item = this.positions.find(i => i && i.bottom > scrollTop);
      if(item){
        return item.index;  
      }
    },
    //获取列表项的当前位置
    getItemsPositions(nodes){
      let items = Array.from(nodes);
      let scrollTop = this.$refs.list.scrollTop;
      return items.map((el,i)=>{
          //当前节点在总列表中的索引
          let index = this.start - this.aboveCount + i;
          let oldPos = this.positions[index];
          if(oldPos.over){
            return oldPos;
          }
          let rect = el.getBoundingClientRect();
          let top = rect.top + scrollTop;
          let bottom = rect.bottom + scrollTop;
          let height = bottom - top;
          
          return {
            index,
            top,
            bottom,
            height
          }
      })
    },
    //更新缓存位置信息
    updateCacheInfo(posList){
      let startIndex = posList[0].index;
      let endIndex = posList.length + startIndex - 1;
      let oldEndPos = this.positions[endIndex];
      let nowEndPos = posList[posList.length - 1];
      let distance = nowEndPos.bottom - oldEndPos.bottom;
      posList.forEach((pos)=>{
        if(!pos.over){
          this.positions[pos.index] = {
            over:true,
            ...pos
          }
        }
      })
      for(let i = endIndex + 1; i<this.positions.length;i++){
        this.positions[i].bottom = this.positions[i].bottom + distance;
      }
    },
    //获取当前的偏移量
    setStartOffset(){
      let startOffset;
      if(this.start >= 1){
        let size = 0;
        for(let i = 1; i<= this.aboveCount;i++){
          size += this.positions[this.start - i].height;
        }
        startOffset = this.positions[this.start - 1].bottom - size;
      }else{
        startOffset = 0;
      }
      this.$refs.content.style.transform = `translate3d(0,${startOffset}px,0)`
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
      this.setStartOffset();
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