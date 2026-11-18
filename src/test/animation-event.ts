if (!('AnimationEvent' in window)) {
  Object.assign(window, { AnimationEvent: class AnimationEvent extends Event {} });
}
