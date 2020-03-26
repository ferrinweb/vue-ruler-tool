<template>
  <div :style="wrapperStyle" class="vue-ruler-wrapper" onselectstart="return false;">
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
      @mouseup.stop="markContentMoveEnd($event)"
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
import { on, off } from './event.js'

export default {
  name: 'VRuler',
  components: {
    ruler,
    guides
  },
  props: {
    position: {
      type: String,
      default: 'relative',
      validator: function (val) {
        return ['absolute', 'fixed', 'relative', 'static', 'inherit'].indexOf(val) !== -1
      }
    }, // 规定元素的定位类型
    isHotKey: {
      type: Boolean, default: true
    }, // 热键开关
    isScaleRevise: {
      type: Boolean, default: false
    }, // 刻度修正(根据content进行刻度重置)
    value: {
      type: Array,
      default: () => {
        return [] // { type: 'h', site: 50 }, { type: 'v', site: 180 }
      }
    }, // 预置参考线
    contentLayout: {
      type: Object,
      default: () => {
        return { top: 0, left: 0 }
      }
    }, // 内容部分布局
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
    } // 步长
  },
  data () {
    return {
      size: 17,
      left_top: 18, // 内容左上填充
      windowWidth: 0, // 窗口宽度
      windowHeight: 0, // 窗口高度
      xScale: [], // 水平刻度
      yScale: [], // 垂直刻度
      topSpacing: 0, // 标尺与窗口上间距
      leftSpacing: 0, //  标尺与窗口左间距
      isDrag: false,
      isMoved: false,
      dragFlag: '', // 拖动开始标记，可能值x(从水平标尺开始拖动),y(从垂直标尺开始拖动)
      horizontalDottedLeft: -999, // 水平虚线位置
      verticalDottedTop: -999, // 垂直虚线位置
      rulerWidth: 0, // 垂直标尺的宽度
      rulerHeight: 0, // 水平标尺的高度
      dragLineId: '', // 被移动线的ID
      keyCode: {
        r: 82
      }, // 快捷键参数
      rulerToggle: true, // 标尺辅助线显示开关
      hrWidth: 0, // 水平标尺宽度
      vrHeight: 0, // 垂直标尺高度
      contentMoveStartX: 0, // 内容容器移动起始点水平时点值
      contentMoveStartY: 0, // 内容容器移动起始点垂直时点值
      contentScrollLeft: 0, // 内容容器拖动量水平时点值
      contentScrollTop: 0, // 内容容器拖动量垂直时点值
      contentMove: false, // 是否按下了 ctrl 键，启动内容区拖动
      contentDrag: false, // 是否正在执行内容区拖动
      contentDragTime: 0,
      contentDragDistanceX: 0,
      contentDragDistanceY: 0,
      easingMoveTimer: null
    }
  },
  computed: {
    wrapperStyle() {
      return {
        width : this.windowWidth + 'px',
        height : this.windowHeight + 'px',
        position: this.position
      }
    },
    // 容器可拖动的水平量
    contentScrollRangeX () {
      return (this.contentRef.scrollWidth - this.windowWidth + this.contentLayout.left * 2) | 0
    },
    // 容器可拖动的垂直量
    contentScrollRangeY () {
      return (this.contentRef.scrollHeight - this.windowHeight + this.contentLayout.top * 2) | 0
    },
    contentRef () {
      return this.$refs.content || {}
    },
    contentRect () {
      return this.$refs.content && this.$refs.content.getBoundingClientRect() || {}
    },
    contentStyle() {
      return {
        left: this.contentLayout.left + 'px',
        top: this.contentLayout.top + 'px',
        padding: this.left_top + 'px 0px 0px ' + this.left_top + 'px',
        cursor: this.contentMove ? 'move' : '',
        transform: `translate3d(${this.contentScrollLeft}px, ${this.contentScrollTop}px, 0)`,
        transition: this.dragTransition
      }
    },
    dragTransition () {
      const dragTime = this.contentDragTime
      return this.contentDrag ? 'transform 0s' : `transform ${dragTime < 300 ? 400 : dragTime > 800 ? 800 : dragTime}ms`
    },
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
  mounted () {
    on(document, 'mousemove', this.dottedLineMove)
    on(document, 'mouseup', this.dottedLineUp)
    on(document, 'keyup', this.keyboard)
    on(document, 'keydown', this.toggleContentMove)
    on(window, 'resize', this.windowResize)
    on(window, 'scroll', this.setSpacing)
    this.init()
  },
  beforeDestroy () {
    off(document, 'mousemove', this.dottedLineMove)
    off(document, 'mouseup', this.dottedLineUp)
    off(document, 'keyup', this.keyboard)
    off(document, 'keydown', this.toggleContentMove)
    off(window, 'resize', this.windowResize)
    off(window, 'scroll', this.setSpacing)
  },
  methods: {
    init () {
      this.box()
      this.setSpacing()
      this.updateRulerRange()
    },
    windowResize() {
      this.xScale = []
      this.yScale = []
      this.init()
    },
    updateRulerRange () {
      const width = this.contentRef.scrollWidth
      const content = this.contentLayout
      // 修正刻度
      const contentLeft = this.isScaleRevise ? content.left : 0
      const contentTop = this.isScaleRevise ? content.top : 0
      this.hrWidth = (width && width > this.windowWidth ? width : this.windowWidth) + contentLeft
      const height = this.contentRef.scrollHeight
      this.vrHeight =  (height && height > this.windowHeight ? height : this.windowHeight) + contentTop
      this.scaleCalc()
    },
    updateContentPos () {
      this.contentScrollLeft = this.contentRef.scrollLeft
      this.contentScrollTop = this.contentRef.scrollTop
    },
    toggleContentMove (e) {
      if (e.keyCode === 17) this.contentMove = true
    },
    markContentMoveStart (e) {
      if (!this.contentMove) return
      if (this.easingMoveTimer) {
        clearTimeout(this.easingMoveTimer)
        this.contentDragTime = 0
      }
      this.contentDragTime = Date.now()
      this.contentDragDistanceX = this.contentMoveStartX = e.clientX
      this.contentDragDistanceY = this.contentMoveStartY = e.clientY
      this.contentDrag = true
    },
    markContentMoveEnd (e) {
      if (!this.contentDrag) return
      this.contentMoveStartX = this.contentMoveStartY = 0
      this.contentDrag = false
      this.contentDragTime = Date.now() - this.contentDragTime
      this.contentDragDistanceX = e.clientX - this.contentDragDistanceX
      this.contentDragDistanceY = e.clientY - this.contentDragDistanceY
      this.easingMove()
    },
    // 释放后缓动
    easingMove () {
      const dragTime = this.contentDragTime
      this.contentScrollLeft += this.contentDragDistanceX / dragTime * 100 | 0
      this.contentScrollTop += this.contentDragDistanceY / dragTime * 100 | 0
      this.contentMoveFence()
      this.easingMoveTimer = setTimeout(() => {
        this.contentDragTime = 0
      }, dragTime)
    },
    // 内容区拖动围栏
    contentMoveFence () {
      if (this.contentScrollLeft > 0) this.contentScrollLeft = 0
      if (this.contentScrollTop > 0) this.contentScrollTop = 0
      const endX = -this.contentScrollRangeX
      const endY = -this.contentScrollRangeY
      if (this.contentScrollLeft < endX) this.contentScrollLeft = endX
      if (this.contentScrollTop < endY) this.contentScrollTop = endY
    },
    handleDragLine({type, id}) {
      return type === 'h' ? this.dragHorizontalLine(id) : this.dragVerticalLine(id)
    },
    box () {
      if (this.parent) {
        const style = window.getComputedStyle(this.$el.parentNode, null)
        this.windowWidth = parseInt(style.getPropertyValue('width'), 10)
        this.windowHeight = parseInt(style.getPropertyValue('height'), 10)
      } else {
        this.windowWidth = document.documentElement.clientWidth - this.leftSpacing
        this.windowHeight = document.documentElement.clientHeight - this.topSpacing
      }
      this.rulerWidth = this.$refs.verticalRuler.clientWidth
      this.rulerHeight = this.$refs.horizontalRuler.clientHeight
    }, // 获取窗口宽与高
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
    }, // 计算刻度
    getCalc (array,length) {
      for (let i = 0; i < length * this.stepLength / 50; i += this.stepLength) {
        if (i % this.stepLength === 0) {
          array.push({ id: i })
        }
      }
    }, // 获取刻度方法
    getCalcRevise (array,length) {
      array.splice(0)
      for (let i = -length * this.stepLength / 50; i < 0; i += this.stepLength) {
        if (i % this.stepLength === 0 && i + this.stepLength <= length) {
          array.push({ id: i })
        }
      }
    }, // 获取矫正刻度方法
    newLine (val) {
      this.isDrag = true
      this.dragFlag = val
    }, // 生成一个参考线
    dottedLineMove ($event) {
      const { clientX, clientY } = $event
      if (this.contentMove && this.contentDrag) {
        if (!this.contentMoveStartX && !this.contentMoveStartX) {
          this.contentMoveStartX = clientX
          this.contentMoveStartY = clientY
        }
        this.contentScrollLeft += (clientX - this.contentMoveStartX) / 4 | 0
        this.contentScrollTop += (clientY - this.contentMoveStartY) / 4 | 0
        this.contentMoveFence()
        this.contentMoveStartX = clientX
        this.contentMoveStartY = clientY
        return
      }
      if (!this.isDrag) return
      this.isMoved = true
      switch (this.dragFlag) {
        case 'x':
          this.verticalDottedTop = clientY - this.topSpacing
          break
        case 'y':
          this.horizontalDottedLeft = clientX - this.leftSpacing
          break
        case 'h':
          this.verticalDottedTop = clientY - this.topSpacing
          break
        case 'v':
          this.horizontalDottedLeft = clientX - this.leftSpacing
          break
        default:
          break
      }
    }, // 虚线移动
    dottedLineUp ($event) {
      if (!this.isDrag)  return
      const { clientX, clientY } = $event
      if (!this.isMoved) {
        if (this.verticalDottedTop !== -999 || this.horizontalDottedLeft !== -999) {
          this.verticalDottedTop = this.horizontalDottedLeft = -999
          this.isDrag = false
          return
        }
        switch (this.dragFlag) {
          case 'x':
            this.verticalDottedTop = clientY - this.topSpacing
            break
          case 'y':
            this.horizontalDottedLeft = clientX - this.leftSpacing
            break
          case 'h':
            this.verticalDottedTop = clientY - this.topSpacing
            break
          case 'v':
            this.horizontalDottedLeft = clientX - this.leftSpacing
            break
          default:
            break
        }
        return
      }
      this.isDrag = false
      this.isMoved = false
      const cloneList = JSON.parse(JSON.stringify(this.lineList))
      switch (this.dragFlag) {
        case 'x':
          cloneList.push({
            type: 'h',
            site: (clientY - this.topSpacing - this.size) * (this.stepLength / 50) - this.contentScrollTop | 0
          })
          break
        case 'y':
          cloneList.push({
            type: 'v',
            site: (clientX - this.leftSpacing - this.size) * (this.stepLength / 50) - this.contentScrollLeft | 0
          })
          break
        case 'h':
          this.dragCalc(cloneList, clientY, this.topSpacing, this.rulerHeight,'h')
          break
        case 'v':
          this.dragCalc(cloneList, clientX, this.leftSpacing, this.rulerWidth,'v')
          break
        default:
          break
      }
      this.$emit('input', cloneList)
      this.verticalDottedTop = this.horizontalDottedLeft = -999
    }, // 虚线松开
    dragCalc (list, page, spacing, ruler, type) {
      if (page - spacing < ruler) {
        let Index, id
        this.lineList.forEach((item, index) => {
          if (item.id === this.dragLineId) {
            Index = index
            id = item.id
          }
        })
        list.splice(Index, 1)
      } else {
        let Index, id
        this.lineList.forEach((item, index) => {
          if (item.id === this.dragLineId) {
            Index = index
            id = item.id
          }
        })
        list.splice(Index, 1, {
          type: type,
          site: (page - spacing - this.size) * (this.stepLength / 50)
        })
      }
    },
    horizontalDragRuler () {
      this.newLine('x')
    }, // 水平标尺处按下鼠标
    verticalDragRuler () {
      this.newLine('y')
    }, // 垂直标尺处按下鼠标
    dragHorizontalLine (id) {
      this.isDrag = true
      this.dragFlag = 'h'
      this.dragLineId = id
    }, // 水平线处按下鼠标
    dragVerticalLine (id) {
      this.isDrag = true
      this.dragFlag = 'v'
      this.dragLineId = id
    }, // 垂直线处按下鼠标
    keyboard ($event) {
      if (this.isHotKey) {
        switch ($event.keyCode) {
          case this.keyCode.r:
            this.rulerToggle = !this.rulerToggle
            this.$emit('update:visible', this.rulerToggle)
            if (this.rulerToggle) {
              this.left_top = 18;
            } else {
              this.left_top = 0;
            }
            break
          case 17:
            this.contentMove = false
            this.contentMoveStartX = this.contentMoveStartY = 0
            break
        }
      }
    }, // 键盘事件
  }
}
</script>

<style lang="scss">
.vue-ruler{
  &-wrapper {
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
