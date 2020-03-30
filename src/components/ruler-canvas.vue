<template>
    <div ref="rulerWrapper" :style="`position: ${position}`" class="vue-ruler-wrapper" onselectstart="return false;">
        <ruler
            :show="rulerToggle"
            :xScale="xScale"
            :yScale="yScale"
            :hrWidth="rulerRange * 1.5"
            :vrHeight="rulerRange * 1.5"
            :scrollLeft="hRulerScrollLeft"
            :scrollTop="vRulerScrollTop"
            :contentMove="contentMove"
            :create-h-guide="horizontalDragRuler"
            :create-v-guide="verticalDragRuler"
            :dragTransition="dragTransition"
            :clientX="clientX - rulerLeft"
            :clientY="clientY - rulerTop"
            :zoom="zoom"
        ></ruler>

        <guides
            v-show="rulerToggle"
            :vGuideTop="verticalDottedTop"
            :hGuideLeft="horizontalDottedLeft"
            :contentMove="contentMove"
            :left="contentLayout.left + 18"
            :top="contentLayout.top + 18"
            :contentWidth="contentWidth"
            :contentHeight="contentHeight"
            :guides="lineList"
            :scrollLeft="contentScrollLeft"
            :scrollTop="contentScrollTop"
            :dragTransition="dragTransition"
            :zoom="zoom"
            @line-drag="handleDragLine"
        ></guides>

        <div :class="{ drag: contentMove }" class="vue-ruler-content" @mousedown="markContentMoveStart($event)" @mousemove.prevent>
            <div ref="content" :style="contentStyle" class="content-body">
                <slot />
            </div>
        </div>
        <div class="zoom-tip">ZOOM: {{ zoom }}</div>
        <div v-show="isDrag" class="vue-ruler-content-mask"></div>
    </div>
</template>

<script>
import ruler from './ruler'
import guides from './guides'
import eventHandlers from './event'
import contentDrag from './content-drag'
import guideDrag from './guide-drag'
import zoom from './zoom'

export default {
  name: 'VRuler',
  mixins: [eventHandlers, contentDrag, guideDrag, zoom],
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
    },
    rulerRange: {
      type: Number,
      default: 10000
    }
  },
  data () {
    return {
      size: 18,
      windowWidth: 0, // 窗口宽度
      windowHeight: 0, // 窗口高度
      xScale: [], // 水平刻度
      yScale: [], // 垂直刻度
      topSpacing: 0, // 标尺与窗口上间距
      leftSpacing: 0, //  标尺与窗口左间距
      rulerWidth: 0, // 垂直标尺的宽度
      rulerHeight: 0, // 水平标尺的高度
      rulerTop: 0,
      rulerLeft: 0,
      keyCode: {
        r: 82
      }, // 快捷键参数
      rulerToggle: true, // 标尺辅助线显示开关
      hrWidth: 0, // 水平标尺宽度
      vrHeight: 0 // 垂直标尺高度
    }
  },
  computed: {
    lineList () {
      let hCount = 0;
      let vCount = 0;
      const { left, top } = this.contentLayout
      return this.value.map((item) => {
        const isH = item.type === 'h'
        const site = item.site
        const value = site - (isH ? top : left)
        return {
          id: `${item.type}_${isH ? hCount++ : vCount++}`,
          type: item.type,
          title: value + 'px',
          site: site,
          value,
          [isH ? 'top' : 'left']: site / (this.stepLength / 50) + this.size
        }
      }).filter(item => item.site > -18)
    }
  },
  watch: {
    visible: {
      handler (visible) {
        this.rulerToggle = visible;
      },
      immediate: true
    }
  },
  methods: {
    handleDragLine ({ type, id }, e) {
      if (e.which !== 1) return
      this.guideDragStartX = e.clientX
      this.guideDragStartY = e.clientY
      return type === 'h' ? this.dragHorizontalLine(id) : this.dragVerticalLine(id)
    },
    setSpacing () {
      this.topSpacing = Math.ceil(this.$refs.horizontalRuler.getBoundingClientRect().y)
      this.leftSpacing = Math.ceil(this.$refs.verticalRuler.getBoundingClientRect().x)
    },
    scaleCalc () {
      const rulerRange = this.rulerRange
      // 负刻度
      this.getCalcRevise(this.xScale, rulerRange / 2)
      this.getCalcRevise(this.yScale, rulerRange / 2)
      this.getCalc(this.xScale, rulerRange)
      this.getCalc(this.yScale, rulerRange)
    },
    // 获取刻度方法
    getCalc (array, length) {
      const step = this.stepLength / this.zoom
      for (let i = 0; i < length * step / 50; i += step) {
        if (i % step === 0) {
          array.push({ id: i })
        }
      }
    },
    // 生成 0 刻度前置刻度
    getCalcRevise (array, length) {
      array.splice(0)
      const step = this.stepLength / this.zoom
      for (let i = -length * step / 50; i < 0; i += step) {
        if (i % step === 0 && i + step <= length) {
          array.push({ id: i })
        }
      }
    }
  }
}
</script>

<style lang="scss">
  .vue-ruler {
      &-wrapper {
          width: 100%;
          height: 100%;
          left: 0;
          top: 0;
          z-index: 1;
          overflow: hidden;
          user-select: none;
          background-color: rgba(0, 0, 0, 0.1);
      }
      &-content {
          position: absolute;
          left: 0;
          top: 0;
          z-index: 2;
          width: 100%;
          height: 100%;
          overflow: hidden;
          &.drag {
              cursor: move;
          }
          .content-body {
              position: absolute;
              left: 0;
              top: 0;
              width: auto;
              height: auto;
              border: 18px transparent solid;
              overflow: hidden;
              transition: transform 0.4s;
              overflow: hidden;
          }
      }
      &-content-mask {
          position: absolute;
          width: 100%;
          height: 100%;
          background: transparent;
          z-index: 4;
      }
  }
  .zoom-tip {
      position: absolute;
      bottom: 15px;
      left: 33px;
      color: white;
      font-size: 12px;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 4px 8px;
      z-index: 10;
  }
</style>
