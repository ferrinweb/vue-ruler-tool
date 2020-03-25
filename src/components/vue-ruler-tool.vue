<template>
  <div :style="wrapperStyle" class="vue-ruler-wrapper" onselectstart="return false;">
    <section v-show="rulerToggle">
      <div class="ruler-wrapper h">
        <div
          ref="horizontalRuler"
          class="vue-ruler-h"
          :style="`width: ${hrWidth + contentLayout.left * 2}px; transform: translateX(${contentScrollLeft}px)`"
          @mousedown.stop="horizontalDragRuler"
        >
          <span v-for="(item,index) in xScale" :key="index" :style="{left:index * 50 + 2 + 'px'}" class="n">{{ item.id }}</span>
        </div>
      </div>
      <div class="ruler-wrapper v">
        <div
          ref="verticalRuler"
          class="vue-ruler-v"
          :style="`height: ${vrHeight + contentLayout.top * 2}px; transform: translateY(${contentScrollTop}px)`"
          @mousedown.stop="verticalDragRuler"
        >
          <span v-for="(item,index) in yScale" :key="index" :style="{top:index * 50 + 2 + 'px'}" class="n">{{ item.id }}</span>
        </div>
      </div>
      <div :style="{transform:`translateY(${verticalDottedTop}px)`}" class="vue-ruler-ref-dot-h" />
      <div :style="{transform:`translateX(${horizontalDottedLeft}px)`}" class="vue-ruler-ref-dot-v" />
      <div
        v-for="item in lineList"
        :title="item.title"
        :style="getLineStyle(item)"
        :key="item.id"
        :class="`vue-ruler-ref-line-${item.type}`"
        @mousedown="handleDragLine(item)"></div>
    </section>
    <div
      ref="content"
      class="vue-ruler-content"
      :style="contentStyle"
      @mousedown.stop="markContentMoveStart($event)"
      @mouseup.stop="markContentMoveEnd($event)"
      @mousemove.prevent
    >
      <slot />
    </div>
    <div v-show="isDrag" class="vue-ruler-content-mask"></div>
  </div>
</template>

<script>
import { on, off } from './event.js'
export default {
  name: 'VRuler',
  components: {},
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
      hrWidth: 0,
      vrHeight: 0,
      contentMoveStartX: 0,
      contentMoveStartY: 0,
      contentScrollLeft: 0,
      contentScrollTop: 0,
      contentMove: false,
      contentDrag: false
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
    contentScrollRangeX () {
      return this.contentRef.scrollWidth - this.windowWidth
    },
    contentScrollRangeY () {
      return this.contentRef.scrollHeight - this.windowHeight
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
        transform: `translate3d(${this.contentScrollLeft}px, ${this.contentScrollTop}px, 0)`
        // transition: this.contentDrag ? 'transform 0s' : ''
      }
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
      this.hrWidth = width && width > this.windowWidth ? width : this.windowWidth
      const height = this.contentRef.scrollHeight
      this.vrHeight =  height && height > this.windowHeight ? height : this.windowHeight
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
      this.contentMoveStartX = e.clientX
      this.contentMoveStartY = e.clientY
      this.contentDrag = true
    },
    markContentMoveEnd () {
      this.contentMoveStartX = this.contentMoveStartY = 0
      this.contentDrag = false
    },
    getLineStyle({type, top, left, site}) {
      const style = [type === 'h' ? `top: ${top}px` : `left: ${left}px`]
      site < 0 && style.push('opacity: 0')
      this.contentMove && style.push('pointer-events: none')
      type === 'h' && style.push(`transform: translateY(${this.contentScrollTop}px)`)
      type === 'v' && style.push(`transform: translateX(${this.contentScrollLeft}px)`)
      return style.join(';')
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
      const contentLeft = this.isScaleRevise ? content.left : 0
      const contentTop = this.isScaleRevise ? content.top : 0
      this.getCalcRevise(this.xScale, contentLeft)
      this.getCalcRevise(this.yScale, contentTop)
      this.getCalc(this.xScale, this.hrWidth + contentLeft)
      this.getCalc(this.yScale, this.vrHeight + contentTop)
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
        this.contentScrollLeft += clientX - this.contentMoveStartX
        this.contentScrollTop += clientY - this.contentMoveStartY
        if (this.contentScrollLeft > 0) this.contentScrollLeft = 0
        if (this.contentScrollTop > 0) this.contentScrollTop = 0
        const endX = -this.contentScrollRangeX - this.contentLayout.left * 2
        const endY = -this.contentScrollRangeY - this.contentLayout.top * 2
        if (this.contentScrollLeft < endX) this.contentScrollLeft = endX
        if (this.contentScrollTop < endY) this.contentScrollTop = endY
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
.ruler-wrapper {
  position: absolute;
  box-shadow:#111 0 0 1px;
  &.h{
    width: calc(100% - 18px);
    height: 18px;
    top: 0;
    left: 18px;
    &:before{
      content:" ";
      position: absolute;
      left: -18px;
      width: 18px;
      height: 18px;
      z-index: 1000;
      background-color: #111;
    }
  }
  &.v{
    width: 18px;
    height: calc(100% - 18px);
    left: 0;
    top: 18px;
  }
}
.vue-ruler{
  &-wrapper {
    left: 0;
    top: 0;
    z-index: 1;
    overflow: hidden;
    user-select: none;
  }
  &-h,
  &-v,
  &-ref-line-v,
  &-ref-line-h,
  &-ref-dot-h,
  &-ref-dot-v {
    position: absolute;
    left: 0;
    top: 0;
    overflow: hidden;
    z-index: 3;
  }

  &-ref-line-v,
  &-ref-line-h,
  &-h,
  &-v,
  &-content {
    transition: transform .4s;
  }
  &-h {
    height: 18px;
    left: 0;
    opacity: 0.6;
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAASCAMAAAAuTX21AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRFMzMzAAAA////BqjYlAAAACNJREFUeNpiYCAdMDKRCka1jGoBA2JZZGshiaCXFpIBQIABAAplBkCmQpujAAAAAElFTkSuQmCC)
      repeat-x;
    cursor: n-resize;
  }

  &-v {
    width: 18px;
    top: 0;
    opacity: 0.6;
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAyCAMAAABmvHtTAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRFMzMzAAAA////BqjYlAAAACBJREFUeNpiYGBEBwwMTGiAakI0NX7U9aOuHyGuBwgwAH6bBkAR6jkzAAAAAElFTkSuQmCC)
      repeat-y;
    cursor: w-resize;
  }

  &-v .n,
  &-h .n {
    position: absolute;
    font: 10px/1 serif;
    color: #333;
    cursor: default;
  }

  &-v .n {
    width: 8px;
    left: 3px;
    word-wrap: break-word;
  }

  &-h .n {
    top: 1px;
  }

  &-ref-line-h {
    width: 100%;
    height: 3px;
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAABCAMAAADU3h9xAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFSv//AAAAH8VRuAAAAA5JREFUeNpiYIACgAADAAAJAAE0lmO3AAAAAElFTkSuQmCC)
      repeat-x left center; /*./image/line_h.png*/
    cursor: n-resize; /*url(./image/cur_move_h.cur), move*/
  }

  &-ref-line-v {
    width: 3px;
    height: 100%;
    _height: 9999px;
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAICAMAAAAPxGVzAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFSv//AAAAH8VRuAAAAA5JREFUeNpiYEAFAAEGAAAQAAGePof9AAAAAElFTkSuQmCC)
      repeat-y center top; /*./image/line_v.png*/
    cursor: w-resize; /*url(./image/cur_move_v.cur), move*/
  }

  &-ref-dot-h {
    width: 100%;
    height: 3px;
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAMAAABFaP0WAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFf39/////F3PnHQAAAAJ0Uk5T/wDltzBKAAAAEElEQVR42mJgYGRgZAQIMAAADQAExkizYQAAAABJRU5ErkJggg==)
      repeat-x left 1px; /*./image/line_dot.png*/
    cursor: n-resize; /*url(./image/cur_move_h.cur), move*/
    top: 0;
  }

  &-ref-dot-v {
    width: 3px;
    height: 100%;
    _height: 9999px;
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAMAAABFaP0WAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFf39/////F3PnHQAAAAJ0Uk5T/wDltzBKAAAAEElEQVR42mJgYGRgZAQIMAAADQAExkizYQAAAABJRU5ErkJggg==)
      repeat-y 1px top; /*./image/line_dot.png*/
    cursor: w-resize; /*url(./image/cur_move_v.cur), move*/
    left: 0;
  }
  &-content {
    position: absolute;
    z-index: 2;
    width: auto;
    height: auto;
    overflow: hidden;
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
