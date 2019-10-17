import VirtualList from './components/VirtualList.vue'

if (typeof window !== 'undefined' && window.Vue) {
    window.Vue.component('VirtualList', VirtualList)
}

VirtualList.install = function(Vue){
    Vue.component(VirtualList.name, VirtualList)
}

export default VirtualList;