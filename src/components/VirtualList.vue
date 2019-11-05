<template>
  <div ref="list" :style="{height}" class="infinite-list-container" 
    @scroll="scrollEvent($event)"
  >
    <div ref="phantom" class="infinite-list-phantom"></div>
    <!-- 顶部刷新区域 -->
    <div v-if="topLoadMore" v-show="dargState !== 'none'" :style="{height:touchDistance + 'px'}" class="infinite-top-container">
      <slot name="top" :dargState="dargState" :dargDistance="touchDistance">
        <div v-show="dargState === 'pull'">
          下拉刷新...
        </div>
        <div v-show="dargState === 'drop'">
          松开刷新...
        </div>
        <div v-show="dargState === 'loading'">
          刷新中...
        </div>
      </slot>
    </div>
    <div ref="content" class="infinite-list">
      <div ref="items" class="infinite-list-item-container flex" :id="row._key" :key="row._key" v-for="(row,row_index) in visibleData">
        <template v-for="(item,col_index) in row.value">
          <div class="infinite-item" :key="row._key + '-' + col_index">
            <slot name="default" :item="item" :row="row_index" :col="col_index"></slot>
          </div> 
        </template>
        <!-- 空占位 -->
        <template v-if="row.value.length < column">
          <div v-for="(item,index) in (column - row.value.length%column)" class="infinite-item" :key="'empty-' + index">
          </div> 
        </template>
      </div>

      <!-- 瀑布流 -->
    </div>
  </div>
</template>


<script>
// 参考：http://mint-ui.github.io/docs/#/
// TODO kebab-case
// 删除滚轮事件
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
    //是否开启下拉刷新
    topLoadMore:{
      type:Boolean,
      default:false
    },
    //超过阈值的回调 TODO 自定义校验
    topMethod:{
      type:Function
    },
    //最大滑动距离
    maxDistance:{
      type:Number,
      default:0
    },
    //滑动距离与真实距离比值
    distanceScale :{
      type:Number,
      default:2
    },
    //滑动距离阈值，超过阈值回调
    topDistance :{
      type:Number,
      default:60
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
  data() {
    return {
      //拖拽状态
      // pull 开始拖拽，距离未达到topDistance
      // drop 距离达到 topDistance 释放触发 topMethod
      // loading 已被释放，topMethod 已经执行
      // none 拖拽完成或未触发
      dargState:'none', 
      //当前下拉距离
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

    //添加拖拽事件
    if(this.topLoadMore){
      this.$refs.list.addEventListener('touchstart',this.touchStartEvent)
      this.$refs.list.addEventListener('touchmove',this.touchMoveEvent)
      this.$refs.list.addEventListener('touchend',this.touchEndEvent)
    }
  },
  beforeDestroy(){
    if(this.topLoadMore){
      this.$refs.list.removeEventListener('touchstart',this.touchStartEvent)
      this.$refs.list.removeEventListener('touchmove',this.touchMoveEvent)
      this.$refs.list.removeEventListener('touchend',this.touchEndEvent)
    }
  },
  updated(){
    if(this.dargState !== 'none'){
      return;
    }
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
      if(!this.topLoadMore){
        return;
      }
      //记录当前起始Y坐标
      this._startPos = event.touches[0].pageY;
    },
    //Move
    touchMoveEvent(event){
      if(!this.topLoadMore){
        return;
      }
      //TODO 暂时这样处理 loading 中不可滚动
      if(this.dargState === 'loading'){
        event.preventDefault();
        return ;
      }
      //当前Y坐标
      let curPos = event.touches[0].pageY;
      //变大 && 当前滚动位置为0--下拉刷新
      if(curPos > this._startPos && this.$el.scrollTop === 0){
        //当前拖拽距离
        let distance = Math.floor(Math.max(0,curPos - this._startPos)/this.distanceScale);
        //未达到阈值
        if(distance < this.topDistance){
          this.dargState = 'pull'
          this.$emit('top-status-change', this.dargState,distance)
        }
        //已达到阈值
        if(distance >= this.topDistance){
          this.dargState = 'drop'
          this.$emit('top-status-change', this.dargState,distance)
        }
        //设定偏移距离
        if(distance <= this.maxDistance || !this.maxDistance){
          this.touchDistance = distance;
          setTimeout(()=>{
              this.$refs.content.style.transform = `translate3d(0,${this.touchDistance}px,0)`
          },0);
        }
        event.preventDefault();
      }
    },
    //End
    touchEndEvent(){
      if(!this.topLoadMore){
        return;
      }
      if(this.dargState !== 'pull' && this.dargState !== 'drop'){
        return ;
      }
      if(this.dargState === 'pull'){
        setTimeout(()=>{
            this.dargState = 'none'
        },300);
        this.touchDistance = 0;
      }
      if(this.dargState === 'drop'){
        setTimeout(()=>{
            this.dargState = 'loading'
        },300);
        //将距离变更为阈值点
        this.touchDistance = this.topDistance;
        this.topMethod && this.topMethod();
      }
      this.$emit('top-status-change', this.dargState,this.touchDistance)
      this.$refs.content.style.transform = `translate3d(0,${this.touchDistance}px,0)`
      this.$refs.content.style.transition = ` transform 0.3s`
      setTimeout(()=>{
          this.$refs.content.style.transition = ``
      },350);
    },
    onBottomLoaded(){
      this.dargState = 'none'
      //将距离变更为阈值点
      this.touchDistance = 0;
      
      this.$emit('top-status-change', this.dargState,this.touchDistance)
      this.$refs.content.style.transform = `translate3d(0,${this.touchDistance}px,0)`
      this.$refs.content.style.transition = ` transform 0.3s`
      setTimeout(()=>{
          this.$refs.content.style.transition = ``
      },350);
    }
  }
};
</script>


<style scoped>

.infinite-top-container{
  transform:translateZ(0);
  position: relative;
  z-index: 2;
}

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
  z-index:1;
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

</style>
