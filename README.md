jquery-slideview-mc
===================

JQuery Slider Component

Features
--------
* touch, mousewheel and keyboard interaction
* dynamically loads content slides via ajax
* setup slide urls from navigation links
* endless scrolling

Example
-------

```
$(document).ready(function() {
  $("#slideview").slideview();
});
```

Get access to the plugin-instance:
```
var slideview = $("#slideview").data('slideview');
```


Options
-------
<table>
  <tr>
    <th>Name</th><th>Description</th><th>Default</th>
  </tr>
  <tr>
    <td>transitionStyle</td><td>currently only swipe is supported</td><td>swipe</td>
  </tr>
  <tr>
    <td>transitionDuration</td><td>the duration of the transition in milliseconds</td><td>750</td>
  </tr>
  <tr>
    <td>transitionEasing</td><td>easing of the transition</td><td>swing</td>
  </tr>
  <tr>
    <td>transitionCSS</td><td>specifies whether to use css transitions if supported or not</td><td>transform3d</td>
  </tr>
  <tr>
    <td>scrollStyle</td><td>one of position, transform or transform3d. falls back to position if transforms are not supported</td><td>true</td>
  </tr>
  <tr>
    <td>linkSelector</td><td>automatically read content urls from href attribute of the matched elements</td><td>null</td>
  </tr>
  <tr>
    <td>itemSelector</td><td>the selector of the content element</td><td>.slide</td>
  </tr>
  <tr>
    <td>slideClass</td><td>slide css class</td><td>slide</td>
  </tr>
  <tr>
    <td>currentSlideClass</td><td>current slide class</td><td>current-slide</td>
  </tr>
  <tr>
    <td>preloadImages</td><td>specifies whether to preload images before showing slide</td><td>true</td>
  </tr>
  <tr>
    <td>mouseDragging</td><td>enables mouse-dragging interaction</td><td>false</td>
  </tr>
  <tr>
    <td>userInteraction</td><td>enables user-interaction on the component</td><td>true</td>
  </tr>
  <tr>
    <td>locationControl</td><td>control history</td><td>true</td>
  </tr>
  <tr>
    <td>slideLoaded</td><td>callback that is fired when a slide has been loaded</td><td>null</td>
  </tr>
  <tr>
    <td>slideBefore</td><td>callback that is fired before a slide transition</td><td>null</td>
  </tr>
  <tr>
    <td>slideComplete</td><td>callback that is fired when a slide transition has finished</td><td>null</td>
  </tr>
  
  
</table>

Methods
-------
<table>
  <tr>
    <th>Name</th><th>Description</th><th>Return</th>
  </tr>
  <tr>
    <td>add</td><td>adds the specified slide to the component</td><td>void</td>
  </tr>
  <tr>
    <td>addAll</td><td>adds the specified slides to the component</td><td>void</td>
  </tr>
  <tr>
    <td>remove</td><td>removes the specified slide to the component</td><td>void</td>
  </tr>
  <tr>
    <td>removeAll</td><td>removes the specified slides to the component</td><td>void</td>
  </tr>
  <tr>
    <td>size</td><td>get the size of the slide collection</td><td>int</td>
  </tr>
  <tr>
    <td>invalidate</td><td>Refreshes the component</td><td>void</td>
  </tr>
  <tr>
    <td>slideTo</td><td>slides to the specified element</td><td>void</td>
  </tr>
  <tr>
    <td>next</td><td>shows the next slide</td><td>void</td>
  </tr>
  <tr>
    <td>previous</td><td>show the previous slide</td><td>void</td>
  </tr>
  <tr>
    <td>getPosition</td><td>returns the current slide index</td><td>int</td>
  </tr>
  <tr>
    <td>getCurrentItem</td><td>returns the current slide element</td><td>element</td>
  </tr>
</table>