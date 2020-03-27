<template>
  <section>
    <div :style="{transform:`translateY(${vGuideTop}px)`}" class="vue-ruler-ref-dot-h" />
    <div :style="{transform:`translateX(${hGuideLeft}px)`}" class="vue-ruler-ref-dot-v" />
    <div class="guides-wrapper" :style="guidesWrapperStyle">
      <div
        v-for="item in guides"
        :title="item.title"
        :style="{
          ...getLineStyle(item),
          pointerEvents: (zoom !== 1 || contentMove) ? 'none' : ''
        }"
        :key="item.id"
        :class="`vue-ruler-ref-line-${item.type}`"
        @mousedown="$emit('line-drag', item)"
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
      style.push(`transform: translate3d(${this.scrollLeft}px, ${this.scrollTop}px, 0) scale(${this.zoom})`)
      this.dragTransition && style.push(`transition: ${this.dragTransition}`)
      return style.join(';')
    }
  },
  methods: {
    getLineStyle({type, top, left, site}) {
      const style = {}
      type === 'h' && (style.top = `${top}px`)
      type === 'v' && (style.left = `${left}px`)
      type === 'h' && (style.top = `${top}px`)
      site < 0 && (style.opacity = '0')
      return style
    }
  }
}
</script>

<style lang="scss" scoped>
.guides-wrapper{
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  pointer-events: none;
  overflow: visible;
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
  transition: transform .4s;
}

.vue-ruler-ref-dot-h,
.vue-ruler-ref-dot-v {
  z-index: 3;
}

.vue-ruler-ref-line-h {
  width: 10000%;
  height: 3px;
  left: -9999px;
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAABCAMAAADU3h9xAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFSv//AAAAH8VRuAAAAA5JREFUeNpiYIACgAADAAAJAAE0lmO3AAAAAElFTkSuQmCC)
    repeat-x left center;
  cursor: n-resize;
}

.vue-ruler-ref-line-v {
  width: 3px;
  height: 10000%;
  _height: 9999px;
  top: -9999px;
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAICAMAAAAPxGVzAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFSv//AAAAH8VRuAAAAA5JREFUeNpiYEAFAAEGAAAQAAGePof9AAAAAElFTkSuQmCC)
    repeat-y center top;
  cursor: w-resize;
}

.vue-ruler-ref-dot-h {
  width: 100%;
  height: 3px;
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAMAAABFaP0WAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFf39/////F3PnHQAAAAJ0Uk5T/wDltzBKAAAAEElEQVR42mJgYGRgZAQIMAAADQAExkizYQAAAABJRU5ErkJggg==)
    repeat-x left 1px;
  cursor: n-resize;
  top: 0;
}

.vue-ruler-ref-dot-v {
  width: 3px;
  height: 100%;
  _height: 9999px;
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAMAAABFaP0WAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFf39/////F3PnHQAAAAJ0Uk5T/wDltzBKAAAAEElEQVR42mJgYGRgZAQIMAAADQAExkizYQAAAABJRU5ErkJggg==)
    repeat-y 1px top;
  cursor: w-resize;
  left: 0;
}
</style>
