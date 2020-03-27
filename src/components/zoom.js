export default {
  props: {
    zooms: {
      type: Array,
      default: () => [0.5, 1, 2]
    }
  },
  data () {
    return {
      zoomIndex: -1,
      zoomLength: 0
    }
  },
  watch: {
    zooms: {
      handler: function (val) {
        this.resetZoom()
      },
      immediate: true
    }
  },
  computed: {
    zoom () {
      return this.zooms[this.zoomIndex]
    },
    fixedWidth () {
      console.info(this.contentWidth)
      return this.contentWidth * (this.zoom - 1) / 2
    },
    fixedHeight () {
      return this.contentHeight * (this.zoom - 1) / 2
    },
    hRulerScrollLeft () {
      const paddingLeft = this.contentLayout.left
      const zoom = this.zoom
      return this.contentScrollLeft - this.fixedWidth - this.rulerRange / 2 + paddingLeft * zoom + (zoom - 1) * 18
    },
    vRulerScrollTop () {
      const paddingTop = this.contentLayout.top
      const zoom = this.zoom
      return this.contentScrollTop - this.fixedHeight - this.rulerRange / 2 + paddingTop * zoom + (zoom - 1) * 18
    }
  },
  methods: {
    setZoom (e) {
      e.preventDefault()
      e.stopPropagation()
      e.wheelDeltaY > 0 ? this.zoomIndex++ : this.zoomIndex--
      if (this.zoomIndex < 0) this.zoomIndex = 0
      if (this.zoomIndex >= this.zoomLength) this.zoomIndex = this.zoomLength - 1
      requestAnimationFrame(() => {
        this.scaleCalc()
      })
    },
    resetZoom (e) {
      e && e.stopPropagation()
      this.zoomIndex = this.zooms.findIndex(item => item === 1)
      this.zoomLength = this.zooms.length
    }
  }
}
