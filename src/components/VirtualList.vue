<template>
  <div ref="list" :style="{height}" class="infinite-list-container" 
    @scroll="scrollEvent($event)"
    @touchstart="touchStartEvent($event)"
    @touchmove="touchMoveEvent($event)"
    @touchend="touchEndEvent($event)"
  >
    <div ref="phantom" class="infinite-list-phantom"></div>
    <div ref="content" class="infinite-list">
      <!-- 单列展示 -->
      <template v-if="column === 1">
        <div ref="items" class="infinite-list-item-container" :id="row._key" :key="row._key" v-for="row in visibleData">
          <template v-for="item in row.value">
            <slot :item="item"></slot>
          </template>
        </div>
      </template>

      <!-- 多列展示 -->
      <template v-if="column > 1">
        <div ref="items" class="infinite-list-item-container flex" :id="row._key" :key="row._key" v-for="row in visibleData">
          <template v-for="(item,index) in row.value">
            <div class="infinite-item" :key="row._key + '-' + index">
              <slot :item="item"></slot>
            </div> 
          </template>
          <!-- 空占位 -->
          <template v-if="row.value.length < column">
            <div v-for="(item,index) in (column - row.value.length%column)" class="infinite-item" :key="'empty-' + index">
            </div> 
          </template>
        </div>
      </template>

      <!-- 瀑布流 -->
    </div>
  </div>
</template>


<script>
import _ from '../util'
export default {
  name:'VirtualList',
  props: {
    //所有列表数据
    listData:{
      type:Array,
      default:()=>[]
    },
    //列表列数
    column:{
      type:Number,
      default:1
    },
    //最大滑动距离
    maxDistance:{
      type:Number,
      default:150
    },
    //滑动距离与真实距离比值
    distanceScale :{
      type:Number,
      default:2
    },
    //超过阈值的回调
    topMethod:{
      type:Function
    },
    //滑动距离阈值，超过阈值回调
    topDistance :{
      type:Number,
      default:100
    },
    onScroll:{
      type:Function
    },
    onScrollEnd:{
      type:Function
    },
    //预估高度
    estimatedItemSize:{
      type:Number,
      required: true
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
    _listData(){
      return this.listData.reduce((init,cur,index)=>{
        if(index % this.column === 0){
          init.push({
            // _转换后的索引_第一项在原列表中的索引_本行包含几列
            _key:`_${index/this.column}_${index}_${this.column}`,
            value:[cur]
          })
        }else{
          init[init.length - 1].value.push(cur)
        }
        return init;
      },[])
    },
    anchorPoint(){
      return this.positions.length ? this.positions[this.start] : null;
    },
    visibleCount(){
      return Math.ceil(this.screenHeight / this.estimatedItemSize);
    },
    aboveCount(){
      return Math.min(this.start,this.bufferScale * this.visibleCount);
    },
    belowCount(){
      return Math.min(this.listData.length - this.end,this.bufferScale * this.visibleCount);
    },
    visibleData(){
      let start = this.start - this.aboveCount;
      let end = this.end + this.belowCount;
      return this._listData.slice(start, end);
    }
  },
  watch:{
    // scrolling(cur,pre){
    //   //滚动结束
    //   if(!cur && pre){
        
    //   }
    // }
  },
  created(){
    this.initPositions();
    this.setScrollState(false);
    window.vm = this;
  },
  mounted() {
    this.screenHeight = this.$el.clientHeight;
    this.start = 0;
    this.end = this.start + this.visibleCount;
    this.setStartOffset();
  },
  updated(){
    //列表数据长度不等于缓存长度
    if(this._listData.length !== this.positions.length){
      this.initPositions();
    }
    
    this.$nextTick(function () {
      if(!this.$refs.items || !this.$refs.items.length){
        return ;
      }
      //获取真实元素大小，修改对应的尺寸缓存
      this.updateItemsSize(); 
      //更新列表总高度
      let height = this.positions[this.positions.length - 1].bottom;
      this.$refs.phantom.style.height = height + 'px'
      //更新真实偏移量
      this.setStartOffset();
    })
  },
  data() {
    return {
      //下拉状态
      topLoading:false,
      //下拉刷新距离
      touchDistance:0,
      //是否正在滚动
      scrolling:false,
      //可视区域高度
      screenHeight:0,
      //起始索引
      start:0,
      //结束索引
      end:0,
    };
  },
  methods: {
    //设定滚动状态
    setScrollState(flg = false){
      this.scrolling = flg;
    },
    //防抖处理，设置滚动状态 
    scrollEnd:_.debounce(function(event,data){
      this.setScrollState(false)
      this.onScrollEnd && this.onScrollEnd(event,data);
    },100),
    scrollingEvent:function(event,data){
      this.onScroll && this.onScroll(event,data)
    },
    //初始化缓存
    initPositions(){
      this.positions = this._listData.map((d,index)=>({
          index,
          height:this.estimatedItemSize,
          top:index * this.estimatedItemSize,
          bottom:(index+1) * this.estimatedItemSize
        })
      );
    },
    //获取列表起始索引
    getStartIndex(scrollTop = 0){
      //二分法查找
      return this.binarySearch(this.positions,scrollTop)
    },
    //二分法查找
    binarySearch(list,value){
      let start = 0;
      let end = list.length - 1;
      let tempIndex = null;

      while(start <= end){
        let midIndex = parseInt((start + end)/2);
        let midValue = list[midIndex].bottom;
        if(midValue === value){
          return midIndex + 1;
        }else if(midValue < value){
          start = midIndex + 1;
        }else if(midValue > value){
          if(tempIndex === null || tempIndex > midIndex){
            tempIndex = midIndex;
          }
          end = end - 1;
        }
      }
      return tempIndex;
    },
    //获取列表项的当前尺寸
    updateItemsSize(){
      let nodes = this.$refs.items;
      nodes.forEach((node)=>{
        let rect = node.getBoundingClientRect();
        let height = rect.height;
        let index = +node.id.replace(/^_(\d+).*/,'$1')
        let oldHeight = this.positions[index].height;
        let dValue = oldHeight - height;
        //存在差值
        if(dValue){
          this.positions[index].bottom = this.positions[index].bottom - dValue;
          this.positions[index].height = height;
          this.positions[index].over = true; // TODO
          
          for(let k = index + 1;k<this.positions.length; k++){
            this.positions[k].top = this.positions[k-1].bottom;
            this.positions[k].bottom = this.positions[k].bottom - dValue;
          }
        }
      })
    },
    //更新偏移量
    setStartOffset(){
      let startOffset;
      if(this.start >= 1){
        let size = this.positions[this.start].top - (this.positions[this.start - this.aboveCount] ? this.positions[this.start - this.aboveCount].top : 0);
        startOffset = this.positions[this.start - 1].bottom - size;
      }else{
        startOffset = 0;
      }
      this.startOffset = startOffset;
      this.$refs.content.style.transform = `translate3d(0,${startOffset}px,0)`
    },
    //滚动事件
    scrollEvent(event) {
      //当前滚动位置
      let scrollTop = this.$refs.list.scrollTop;
      //更新滚动状态
      this.setScrollState(true);
      //排除不需要计算的情况
      if(scrollTop > this.anchorPoint.bottom || scrollTop < this.anchorPoint.top){
        //此时的开始索引
        this.start = this.getStartIndex(scrollTop);
        //此时的结束索引
        this.end = this.start + this.visibleCount;
        //更新偏移量
        this.setStartOffset();
      }
      //触发外部滚动事件
      this.scrollingEvent(event,{
          start:this.start * this.column,
          end:Math.min(this.end * this.column,this.listData.length - 1),
          startOffset:this.startOffset,
          scrollTop
        }
      )
      //防抖处理滚动结束
      this.scrollEnd(event,{
          start:this.start * this.column,
          end:Math.min(this.end * this.column,this.listData.length - 1),
          startOffset:this.startOffset,
          scrollTop
        }
      );
    },
    //Start
    touchStartEvent(event){
      //当前右距离，不记录起始位置
      if(this.touchDistance){
        event.preventDefault();
        return ;
      }
      if(!this.scrolling && !this.$el.scrollTop){
        //起始位置
        this._startPos = event.touches[0].pageY;
      }
    },
    //Move
    touchMoveEvent(event){
      if(!this.scrolling && !this.$el.scrollTop){
        let curPos = event.touches[0].pageY;
        this.touchDistance = Math.floor(Math.max(0,curPos - this._startPos)/this.distanceScale);
        if(this.touchDistance <= this.maxDistance){
          this.$refs.content.style.transform = `translate3d(0,${this.touchDistance}px,0)`
        }
        // event.preventDefault();
      }
      if(this.touchDistance){
        event.preventDefault();
      }
    },
    //End
    touchEndEvent(){
      if(this.touchDistance){
        this.log(this.touchDistance);
        
        if(this.touchDistance >= this.topDistance){
          //
          this.touchDistance = 50;
          this.topMethod && this.topMethod();
        }else{
          this.touchDistance = 0;
        }
        // this.$refs.content.classList = ['infinite-list touch-transition']
        this.$refs.content.style.transform = `translate3d(0,${this.touchDistance}px,0)`
      }
    }
  }
};

//http://mint-ui.github.io/docs/#/zh-cn2/loadmore
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

.infinite-list-item-container {
    border-bottom:1px solid red;
}

.infinite-list-item-container.flex {
  display: flex;

}

.infinite-item{
  flex:1
}

.touch-transition{
  transition: transform 0.5s;
}

</style>


