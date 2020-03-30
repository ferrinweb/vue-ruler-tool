<template>
    <section>
        <div :style="{ transform: `translateY(${vGuideTop}px)` }" class="vue-ruler-ref-dot-h" />
        <div :style="{ transform: `translateX(${hGuideLeft}px)` }" class="vue-ruler-ref-dot-v" />
        <div class="guides-wrapper" :style="guidesWrapperStyle">
            <div
                v-for="item in guides"
                :title="item.title"
                :style="{
                    ...getLineStyle(item),
                    pointerEvents: zoom !== 1 || contentMove ? 'none' : '',
                    transform: `scale(${item.type === 'v' ? 1 / zoom + ', 1' : '1, ' + 1 / zoom})`
                }"
                :key="item.id"
                :class="`vue-ruler-ref-line-${item.type}`"
                @mousedown="$emit('line-drag', item, $event)"
                :type="item.type"
                :value="item.value"
            ></div>
        </div>
    </section>
</template>

<script>
export default {
  name: 'guide',
  props: {
    vGuideTop: Number,
    hGuideLeft: Number,
    contentMove: Boolean,
    left: Number,
    top: Number,
    contentWidth: Number,
    contentHeight: Number,
    scrollLeft: Number,
    scrollTop: Number,
    guides: {
      type: Array,
      default: () => []
    },
    zoom: Number,
    dragTransition: String
  },
  computed: {
    guidesWrapperStyle () {
      const style = []
      style.push(`width: ${this.contentWidth}px`)
      style.push(`height: ${this.contentHeight}px`)
      style.push(`left: ${this.left}px`)
      style.push(`top: ${this.top}px`)
      style.push(`transform: translate3d(${this.scrollLeft}px, ${this.scrollTop}px, 0) scale(${this.zoom})`)
      this.dragTransition && style.push(`transition: ${this.dragTransition}`)
      return style.join(';')
    }
  },
  methods: {
    getLineStyle ({ type, top, left, site }) {
      const style = {}
      type === 'h' && (style.top = `${top - this.top}px`)
      type === 'v' && (style.left = `${left - this.left}px`)
      site < 0 && (style.opacity = '0')
      return style
    }
  }
}
</script>

<style lang="scss" scoped>
  .guides-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 3;
      pointer-events: none;
      overflow: visible;
      transition: transform 0.4s;
  }
  .vue-ruler-ref-line-v,
  .vue-ruler-ref-line-h,
  .vue-ruler-ref-dot-h,
  .vue-ruler-ref-dot-v {
      position: absolute;
      left: 0;
      top: 0;
      pointer-events: auto;
  }
  .vue-ruler-ref-line-v,
  .vue-ruler-ref-line-h {
      transform-origin: left top;
  }

  .vue-ruler-ref-dot-h,
  .vue-ruler-ref-dot-v {
      z-index: 3;
  }

  .vue-ruler-ref-line-h {
      width: 10000%;
      height: 1px;
      left: -9999px;
      background-color: cyan;
      cursor: n-resize;
      &:hover{
        background-color: purple;
        border-top: #bfffd9bd 3px solid;
        border-bottom: #bfffd9bd 3px solid;
        transform: translateY(-3px) scale(1,1) !important;
      }
  }

  .vue-ruler-ref-line-v {
      width: 1px;
      height: 10000%;
      top: -9999px;
      background-color: cyan;
      cursor: w-resize;
      &:hover{
        background-color: purple;
        border-left: #bfffd9bd 3px solid;
        border-right: #bfffd9bd 3px solid;
        transform: translateX(-3px) scale(1,1) !important;
      }
  }

  .vue-ruler-ref-dot-h {
      width: 100%;
      height: 0;
      cursor: n-resize;
      border-top: grey 1px dotted;
      top: 0;
  }

  .vue-ruler-ref-dot-v {
      width: 0;
      height: 100%;
      _height: 9999px;
      border-left: grey 1px dotted;
      left: 0;
  }
</style>
