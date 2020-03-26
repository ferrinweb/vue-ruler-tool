<template>
  <div ref="rulerWrapper" :style="`position: ${position}`" class="vue-ruler-wrapper" onselectstart="return false;">
    <ruler
      :show="rulerToggle"
      :xScale="xScale"
      :yScale="yScale"
      :hrWidth="hrWidth + contentLayout.left"
      :vrHeight="vrHeight + contentLayout.top"
      :scrollLeft="contentScrollLeft"
      :scrollTop="contentScrollTop"
      :contentMove="contentMove"
      :create-h-guide="horizontalDragRuler"
      :create-v-guide="verticalDragRuler"
      :dragTransition="dragTransition"
    ></ruler>

    <guides
      v-show="rulerToggle"
      :vGuideTop="verticalDottedTop"
      :hGuideLeft="horizontalDottedLeft"
      :contentMove="contentMove"
      :guides="lineList"
      :scrollLeft="contentScrollLeft"
      :scrollTop="contentScrollTop"
      :dragTransition="dragTransition"
      @line-drag="handleDragLine"
    ></guides>
    
    <div
      ref="content"
      class="vue-ruler-content"
      :style="contentStyle"
      @mousedown.stop="markContentMoveStart($event)"
      @mousemove.prevent
    >
      <div class="content-bod" :style="contentMove && 'pointer-events: none'">
        <slot />
      </div>
    </div>
    <div v-show="isDrag" class="vue-ruler-content-mask"></div>
  </div>
</template>

<script>
import ruler from './ruler'
import guides from './guides'
import eventHandlers from './event'
import contentDrag from './content-drag'
import guideDrag from './guide-drag'

export default {
  name: 'VRuler',
  mixins: [eventHandlers, contentDrag, guideDrag],
  components: {
    ruler,
    guides
  },
  props: {
    // 规定元素的定位类型
    position: {
      type: String,
      default: 'relative',
      validator: function (val) {
        return ['absolute', 'fixed', 'relative', 'static', 'inherit'].indexOf(val) !== -1
      }
    },
    // 热键开关
    isHotKey: {
      type: Boolean, default: true
    },
    // 刻度修正，根据 contentLayout 参数确定 0 刻度位置 
    isScaleRevise: {
      type: Boolean, default: false
    },
    // 预置参考线
    value: {
      type: Array,
      default: () => {
        return [] // { type: 'h', site: 50 }, { type: 'v', site: 180 }
      }
    },
    // 内容部分布局
    contentLayout: {
      type: Object,
      default: () => {
        return { top: 0, left: 0 }
      }
    },
    parent: {
      type: Boolean,
      default: false
    },
    visible: {
      type: Boolean,
      default: true
    },
    stepLength: {
      type: Number,
      default: 50,
      validator: (val) => val % 10 === 0
    }
  },
  data () {
    return {
      size: 17,
      windowWidth: 0, // 窗口宽度
      windowHeight: 0, // 窗口高度
      xScale: [], // 水平刻度
      yScale: [], // 垂直刻度
      topSpacing: 0, // 标尺与窗口上间距
      leftSpacing: 0, //  标尺与窗口左间距
      rulerWidth: 0, // 垂直标尺的宽度
      rulerHeight: 0, // 水平标尺的高度
      keyCode: {
        r: 82
      }, // 快捷键参数
      rulerToggle: true, // 标尺辅助线显示开关
      hrWidth: 0, // 水平标尺宽度
      vrHeight: 0 // 垂直标尺高度
    }
  },
  computed: {
    lineList() {
      let hCount = 0;
      let vCount = 0;
      return this.value.map((item) => {
        const isH = item.type === 'h'
        return {
          id: `${item.type}_${isH ? hCount++ : vCount++}`,
          type: item.type,
          title: item.site.toFixed(2) + 'px',
          site: item.site,
          [isH ? 'top' : 'left']: item.site / (this.stepLength / 50) + this.size
        }
      }).filter(item => item.site > -18)
    }
  },
  watch: {
    visible: {
      handler(visible) {
        this.rulerToggle = visible;
      },
      immediate: true
    }
  },
  methods: {
    handleDragLine({type, id}) {
      return type === 'h' ? this.dragHorizontalLine(id) : this.dragVerticalLine(id)
    },
    setSpacing () {
      this.topSpacing = this.$refs.horizontalRuler.getBoundingClientRect().y //.offsetParent.offsetTop
      this.leftSpacing = this.$refs.verticalRuler.getBoundingClientRect().x// .offsetParent.offsetLeft
    },
    scaleCalc () {
      const content = this.contentLayout
      // 修正刻度
      this.getCalcRevise(this.xScale, this.isScaleRevise ? content.left : 0)
      this.getCalcRevise(this.yScale, this.isScaleRevise ? content.top : 0)
      this.getCalc(this.xScale, this.hrWidth)
      this.getCalc(this.yScale, this.vrHeight)
    },
    // 获取刻度方法
    getCalc (array,length) {
      for (let i = 0; i < length * this.stepLength / 50; i += this.stepLength) {
        if (i % this.stepLength === 0) {
          array.push({ id: i })
        }
      }
    },
    // 生成 0 刻度前置刻度
    getCalcRevise (array,length) {
      array.splice(0)
      for (let i = -length * this.stepLength / 50; i < 0; i += this.stepLength) {
        if (i % this.stepLength === 0 && i + this.stepLength <= length) {
          array.push({ id: i })
        }
      }
    }
  }
}
</script>

<style lang="scss">
.vue-ruler{
  &-wrapper {
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    z-index: 1;
    overflow: hidden;
    user-select: none;
  }
  &-content {
    position: absolute;
    z-index: 2;
    width: auto;
    height: auto;
    padding: 18px;
    overflow: hidden;
    transition: transform .4s;
  }
  &-content-mask{
    position: absolute;
    width: 100%;
    height: 100%;
    background: transparent;
    z-index: 4;
  }
}
</style>
