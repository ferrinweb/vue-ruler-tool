<template functional>
  <section v-show="props.show" :style="(props.contentMove || props.zoom !== 1) && 'pointer-events: none'">
    <div class="ruler-wrapper h">
      <div
        ref="horizontalRuler"
        class="vue-ruler-h"
        :style="`width: ${props.hrWidth}px; transform: translateX(${props.scrollLeft}px); transition: ${props.dragTransition};`"
        @mousedown.stop="props.createHGuide"
      >
        <span
          v-for="(item,index) in props.xScale"
          :key="index"
          :style="{left:index * 50 + 2 + 'px'}"
          :class="{zeroScale: item.id === 0}"
          class="n"
        >{{ item.id }}</span>
      </div>
    </div>
    <div class="ruler-wrapper v">
      <div
        ref="verticalRuler"
        class="vue-ruler-v"
        :style="`height: ${props.vrHeight}px; transform: translateY(${props.scrollTop}px); transition: ${props.dragTransition};`"
        @mousedown.stop="props.createVGuide"
      >
        <span
          v-for="(item,index) in props.yScale"
          :key="index"
          :style="{top:index * 50 + 2 + 'px'}"
          class="n"
        >{{ item.id }}</span>
      </div>
    </div>
    <div class="mouse-position x" :style="`transform: translateX(${props.clientX + 1}px)`"></div>
    <div class="mouse-position y" :style="`transform: translateY(${props.clientY + 1}px)`"></div>
  </section>
</template>

<style lang="scss" scoped>
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
  
  .vue-ruler-h,
  .vue-ruler-v {
    position: absolute;
    left: 0;
    top: 0;
    overflow: hidden;
    z-index: 3;
    transition: transform .4s;
  }
  
  .vue-ruler-h {
    height: 18px;
    left: 0;
    opacity: 0.6;
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAASCAMAAAAuTX21AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRFMzMzAAAA////BqjYlAAAACNJREFUeNpiYCAdMDKRCka1jGoBA2JZZGshiaCXFpIBQIABAAplBkCmQpujAAAAAElFTkSuQmCC)
      repeat-x;
    cursor: n-resize;
  }

  .vue-ruler-v {
    width: 18px;
    top: 0;
    opacity: 0.6;
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAyCAMAAABmvHtTAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRFMzMzAAAA////BqjYlAAAACBJREFUeNpiYGBEBwwMTGiAakI0NX7U9aOuHyGuBwgwAH6bBkAR6jkzAAAAAElFTkSuQmCC)
      repeat-y;
    cursor: w-resize;
  }

  .vue-ruler-v .n,
  .vue-ruler-h .n {
    position: absolute;
    font: 10px/1 serif;
    color: #333;
    cursor: default;
  }

  .vue-ruler-v .n {
    width: 8px;
    left: 3px;
    word-wrap: break-word;
  }

  .vue-ruler-h .n {
    top: 1px;
    pointer-events: none;
  }
}
.mouse-position{
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  pointer-events: none;
  &.x{
    height: 18px;
    width: 1px;
    background-color: rgba(0,0,0,.4);
  }
  &.y{
    height: 1px;
    width: 18px;
    background-color: rgba(0,0,0,.4);
  }
}
</style>
