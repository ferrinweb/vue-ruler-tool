export default {
  data () {
    return {
      contentWidth: 0,
      contentHeight: 0,
      contentMoveStartX: 0, // 内容容器移动起始点水平时点值
      contentMoveStartY: 0, // 内容容器移动起始点垂直时点值
      contentScrollLeft: 0, // 内容容器拖动量水平时点值
      contentScrollTop: 0, // 内容容器拖动量垂直时点值
      contentMove: false, // 是否按下了 ctrl 键，启动内容区拖动
      contentDrag: false, // 是否正在执行内容区拖动
      contentDragTime: 0, // 内容区拖动时长
      contentDragDistanceX: 0, // 内容区拖动水平距离
      contentDragDistanceY: 0, // 内容区拖动垂直距离
      easingMoveTimer: null // 内容区释放拖动后缓动定时器
    }
  },
  computed: {
    // 容器可拖动的水平量
    contentScrollRangeX () {
      return (this.contentWidth - this.windowWidth + this.contentLayout.left * 2) | 0
    },
    // 容器可拖动的垂直量
    contentScrollRangeY () {
      return (this.contentHeight - this.windowHeight + this.contentLayout.top * 2) | 0
    },
    contentRef () {
      return this.$refs.content || {}
    },
    contentRect () {
      return this.$refs.content && this.$refs.content.getBoundingClientRect() || {}
    },
    contentStyle () {
      return {
        paddingLeft: this.contentLayout.left + 18 + 'px',
        paddingTop: this.contentLayout.top + 18 + 'px',
        paddingRight: this.contentLayout.left + 18 + 'px',
        paddingBottom: this.contentLayout.top + 18 + 'px',
        cursor: this.contentMove ? 'move' : '',
        transform: `translate3d(${this.contentScrollLeft}px, ${this.contentScrollTop}px, 0) scale(${this.zoom})`,
        transition: this.dragTransition
      }
    },
    dragTransition () {
      const dragTime = this.contentDragTime
      return this.contentDrag ? 'transform 0s' : `transform ${dragTime < 300 ? 400 : dragTime > 800 ? 800 : dragTime}ms`
    },
  },
  methods: {
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
      const zoom = this.zoom
      this.contentScrollLeft += this.contentDragDistanceX / dragTime * 100 * (zoom > 1 ? zoom : 1) | 0
      this.contentScrollTop += this.contentDragDistanceY / dragTime * 100 * (zoom > 1 ? zoom : 1) | 0
      this.contentMoveFence()
      this.easingMoveTimer = setTimeout(() => {
        this.contentDragTime = 0
      }, dragTime)
    },
    // 内容区拖动围栏
    contentMoveFence () {
      const rulerRange = this.rulerRange
      const endX = -rulerRange
      const endY = -rulerRange
      if (this.contentScrollLeft < endX) this.contentScrollLeft = endX
      if (this.contentScrollTop < endY) this.contentScrollTop = endY
      const startX = 0 + rulerRange / 2
      const startY = 0 + rulerRange / 2
      if (this.contentScrollLeft > startX) this.contentScrollLeft = startX
      if (this.contentScrollTop > startY) this.contentScrollTop = startY
    },
    setContentMove (clientX, clientY) {
      if (!this.contentMoveStartX && !this.contentMoveStartX) {
        this.contentMoveStartX = clientX
        this.contentMoveStartY = clientY
      }
      const zoom = this.zoom
      this.contentScrollLeft += (clientX - this.contentMoveStartX) / 3 * (zoom > 1 ? zoom : 1) | 0
      this.contentScrollTop += (clientY - this.contentMoveStartY) / 3 * (zoom > 1 ? zoom : 1) | 0
      this.contentMoveFence()
      this.contentMoveStartX = clientX
      this.contentMoveStartY = clientY
    }
  }
}
