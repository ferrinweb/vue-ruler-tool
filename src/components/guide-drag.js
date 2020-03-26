export default {
  data () {
    return {
      isDrag: false,
      isMoved: false,
      dragFlag: '', // 拖动开始标记，可能值x(从水平标尺开始拖动),y(从垂直标尺开始拖动)
      horizontalDottedLeft: -999, // 水平虚线位置
      verticalDottedTop: -999, // 垂直虚线位置
      dragLineId: '' // 被移动线的ID
    }
  },
  methods: {
    dottedLineMove (clientX, clientY) {
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
    },
    clickDraw (clientX, clientY) {
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
    },
    dragDrawEnd (clientX, clientY) {
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
          this.dragCalc(cloneList, clientY, this.topSpacing, this.rulerHeight, 'h')
          break
        case 'v':
          this.dragCalc(cloneList, clientX, this.leftSpacing, this.rulerWidth, 'v')
          break
        default:
          break
      }
      this.$emit('input', cloneList)
      this.verticalDottedTop = this.horizontalDottedLeft = -999
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
    // 水平线处按下鼠标
    dragHorizontalLine (id) {
      this.isDrag = true
      this.dragFlag = 'h'
      this.dragLineId = id
    },
    // 垂直线处按下鼠标
    dragVerticalLine (id) {
      this.isDrag = true
      this.dragFlag = 'v'
      this.dragLineId = id
    },
    // 生成一个参考线
    newLine (val) {
      this.isDrag = true
      this.dragFlag = val
    },
    // 水平标尺处按下鼠标
    horizontalDragRuler () {
      this.newLine('x')
    },
    // 垂直标尺处按下鼠标
    verticalDragRuler () {
      this.newLine('y')
    }
  }
}
