export default {
  props: {
    guideStep: {
      type: Number,
      default: 5
    }
  },
  data () {
    return {
      isDrag: false,
      isMoved: false,
      dragFlag: '', // 拖动开始标记，可能值x(从水平标尺开始拖动),y(从垂直标尺开始拖动)
      horizontalDottedLeft: -999, // 水平虚线位置
      verticalDottedTop: -999, // 垂直虚线位置
      dragGuideId: '', // 被移动线的ID
      guideDragStartX: 0,
      guideDragStartY: 0
    }
  },
  methods: {
    guideStepFence (value) {
      const step = this.guideStep
      const halfStep = step / 2
      const remaining = value % step
      if (remaining === 0) return Math.ceil(value)
      return Math.ceil(remaining < halfStep ? value - remaining : value + step - remaining)
    },
    setGuidePosition (clientX, clientY) {
      switch (this.dragFlag) {
        case 'x':
          this.verticalDottedTop = this.guideStepFence(clientY - this.topSpacing) - this.guideStepFixTop
          break
        case 'y':
          this.horizontalDottedLeft = this.guideStepFence(clientX - this.leftSpacing) - this.guideStepFixLeft
          break
        case 'h':
          this.verticalDottedTop = this.guideStepFence(clientY - this.topSpacing) - this.guideStepFixTop
          break
        case 'v':
          this.horizontalDottedLeft = this.guideStepFence(clientX - this.leftSpacing) - this.guideStepFixLeft
          break
        default:
          break
      }
    },
    dottedLineMove (clientX, clientY) {
      if (!this.isDrag) return
      this.isMoved = true
      this.setGuidePosition(clientX, clientY)
    },
    clickDraw (clientX, clientY) {
      if (this.verticalDottedTop !== -999 || this.horizontalDottedLeft !== -999) {
        this.verticalDottedTop = this.horizontalDottedLeft = -999
        this.isDrag = false
        return
      }
      this.setGuidePosition(clientX, clientY)
    },
    dragDrawEnd (clientX, clientY) {
      this.isDrag = false
      this.isMoved = false
      const cloneList = JSON.parse(JSON.stringify(this.lineList))
      const { stepLength, topSpacing, leftSpacing, size, rulerWidth, rulerHeight } = this
      switch (this.dragFlag) {
        case 'x':
          cloneList.push({
            type: 'h',
            site: this.guideStepFence((clientY - topSpacing - size) * (stepLength / 50) - this.contentScrollTop)
          })
          break
        case 'y':
          cloneList.push({
            type: 'v',
            site: this.guideStepFence((clientX - leftSpacing - size) * (stepLength / 50) - this.contentScrollLeft)
          })
          break
        case 'h':
          this.dragCalc(cloneList, clientY - this.guideDragStartY)
          break
        case 'v':
          this.dragCalc(cloneList, clientX - this.guideDragStartX)
          break
        default:
          break
      }
      this.$emit('input', cloneList)
      this.verticalDottedTop = this.horizontalDottedLeft = -999
      this.guideDragStartX = this.guideDragStartY = 0
    },
    // 虚线松开
    dottedLineUp ($event) {
      if (!this.isDrag) return
      const { clientX, clientY } = $event
      if (!this.isMoved) {
        this.clickDraw(clientX, clientY)
        return
      }
      this.dragDrawEnd(clientX, clientY)
    },
    dragCalc (list, dragDistance) {
      const guideIndex = list.findIndex(guide => guide.id === this.dragGuideId)
      if (guideIndex === -1) return
      const { site, type } = list[guideIndex]
      const newSite = site + dragDistance
      console.info(newSite)
      // 不在画布内则移除该参考线
      if (newSite >= 0 && (type === 'v' && newSite <= this.contentWidth || type === 'h' && newSite <= this.contentHeight)) {
        list[guideIndex].site = this.guideStepFence(newSite)
      } else {
        list.splice(guideIndex, 1)
      }
    },
    // 水平线处按下鼠标
    dragHorizontalLine (id) {
      this.isDrag = true
      this.dragFlag = 'h'
      this.dragGuideId = id
    },
    // 垂直线处按下鼠标
    dragVerticalLine (id) {
      this.isDrag = true
      this.dragFlag = 'v'
      this.dragGuideId = id
    },
    // 生成一个参考线
    newLine (val) {
      this.isDrag = true
      this.dragFlag = val
    },
    // 水平标尺处按下鼠标
    horizontalDragRuler (e) {
      if (e.which !== 1) return
      this.newLine('x')
    },
    // 垂直标尺处按下鼠标
    verticalDragRuler (e) {
      if (e.which !== 1) return
      this.newLine('y')
    },
    insertGuide (type) {
      const cloneList = JSON.parse(JSON.stringify(this.lineList))
      const site = window.prompt(`请输入${type === 'h' ? '水平' : '垂直'}参考线坐标`, '')
      if (!site) return
      cloneList.push({
        type,
        site: parseInt(site)
      })
      this.$emit('input', cloneList)
    }
  }
}
