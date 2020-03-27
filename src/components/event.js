export default {
    data () {
        return {
            clientX: 0,
            clientY: 0
        }
    },
    methods: {
        init () {
            this.box()
            this.setSpacing()
            this.updateRulerRange()
        },
        windowResize () {
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
            this.vrHeight = (height && height > this.windowHeight ? height : this.windowHeight) + contentTop
            this.scaleCalc()
        },
        toggleContentMove (e) {
            if (e.keyCode === 17) this.contentMove = true
        },
        // 获取窗口宽与高
        box () {
            const position = this.$refs.rulerWrapper.getBoundingClientRect()
            this.windowWidth = position.width
            this.windowHeight = position.height
            this.rulerWidth = this.$refs.verticalRuler.clientWidth
            this.rulerHeight = this.$refs.horizontalRuler.clientHeight
            this.contentWidth = this.contentRef.scrollWidth
            this.contentHeight = this.contentRef.scrollHeight
        },
        // 键盘事件
        keyboard ($event) {
            if (this.isHotKey) {
                switch ($event.keyCode) {
                    case this.keyCode.r:
                        this.rulerToggle = !this.rulerToggle
                        this.$emit('update:visible', this.rulerToggle)
                        break
                    case 17:
                        this.contentMove = false
                        this.contentMoveStartX = this.contentMoveStartY = 0
                        break
                }
            }
        },
        setMove ($event) {
            const { clientX, clientY } = $event
            this.clientX = clientX
            this.clientY = clientY
            if (this.contentDrag) {
                this.setContentMove(clientX, clientY)
                return
            }
            this.dottedLineMove(clientX, clientY)
        },
        stopMove ($event) {
            if (this.contentDrag) {
                this.markContentMoveEnd($event)
                return
            }
            this.dottedLineUp($event)
        }
    },
    mounted () {
        document.addEventListener('mousemove', this.setMove)
        document.addEventListener('mouseup', this.stopMove)
        document.addEventListener('keyup', this.keyboard)
        document.addEventListener('keydown', this.toggleContentMove)
        window.addEventListener('resize', this.windowResize)
        window.addEventListener('scroll', this.setSpacing)
        this.$refs.rulerWrapper.addEventListener('wheel', this.setZoom)
        this.$refs.rulerWrapper.addEventListener('dblclick', this.resetZoom)
        this.init()
    },
    beforeDestroy () {
        document.removeEventListener('mousemove', this.setMove)
        document.removeEventListener('mouseup', this.stopMove)
        document.removeEventListener('keyup', this.keyboard)
        document.removeEventListener('keydown', this.toggleContentMove)
        window.removeEventListener('resize', this.windowResize)
        window.removeEventListener('scroll', this.setSpacing)
        this.$refs.rulerWrapper.removeEventListener('wheel', this.setZoom)
        this.$refs.rulerWrapper.removeEventListener('dblclick', this.resetZoom)
    }
}
