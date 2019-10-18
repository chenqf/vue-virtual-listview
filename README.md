# vue-virtual-listview

一个基于Vue2.6+的虚拟列表组件，支持动态高度。

>注意: 由于在 iOS UIWebviews 中，`scroll` 事件是在滚动停止之后触发的，所以不兼容iOS UIWebviews。[了解更多](https://developer.mozilla.org/en-US/docs/Web/Events/scroll#Browser_compatibility)

## 安装

通过 npm:

```shell
// npm
npm install vue-virtual-listview --save
```

## 基本使用

```html
<template>
    <VirtualList
        :listData="data" :estimatedItemSize="100" v-slot="slotProps"
    >
        <div class="context">
            {{ slotProps.item.value }}
        </div>
    </VirtualList>
</template>
```

```javascript
import VirtualList from 'vue-virtual-listview'

export default{
    data(){
        return [
            {
                value:'This is one demo~'
            },
            {
                value:'This is tow demo~'
            }
            //.....
        ]
    },
    component:{
        VirtualList
    }
}

```

## 基本演示

10000条数据，动态高度下的虚拟列表：

![](./1.gif)

## Prop Types

|Property|Type|Default|Required?|Description|
|:--:|:--:|:--:|:--:|:--:|
|listData|Array||✓|列表所需要的数据|
|bufferScale|Number|1||在可见区域之外的上/下方预渲染比例，避免快速滑动时出现闪烁|
|estimatedItemSize|Number|150||列表项的预估高度，用于预先计算可视区域的显示项数|
|height|String|100%||包裹元素的高度。|
