(function() {

  window.console = window.console || {
    log: function() {}, 
    info: function() {}, 
    warn: function() {}, 
    error: function() {}
  };
  
  var pluginName = "slideview";
  
  var defaults = {
    transitionStyle: 'swipe', 
    transitionDuration: 750, 
    transitionEasing: 'swing', 
    scrollStyle: 'transform3d', 
    transitionCSS: true, 
    linkSelector: null, 
    itemSelector: ".slide", 
    slideClass: 'slide', 
    preloadImages: false, 
    mouseDragging: false, 
    userInteraction: true, 
    currentSlideClass: 'current-slide', 
    locationControl: true, 
    // callbacks
    slideLoaded: null, 
    slideBefore: null, 
    slideComplete: null 
  };
  
  
  function decodeEntities(input) {
    var y = document.createElement('textarea');
    y.innerHTML = input;
    return y.value;
  }

  /* Image Loading */
  
  function isImageComplete(img, options) {

    options = options || {}; 
    options.dataSourceAttribute = options.dataSourceAttribute || 'source';
    
    if (!img) return true;

    var src = img.getAttribute('src');

    if (src) {
      
      if (typeof(img.complete) != "undefined") {
        return img.complete === true;
        } else if (img.naturalHeight && img.naturalWidth) {
          return true;
      }
      return false;
      
    } else if ($(img).data(options.dataSourceAttribute)) {
      return false;
    }
    return true;

  }
  
  
  function isAllImageComplete(element) {
    var result = true;
    $('img', element).each(function(index, object) {
      if (result && !isImageComplete(this)) {
        result = false;
      }
    });
    return result;
  }
  
  
  /**
   * CSS-Transition Class
   */
  function Transition(element, options) {
   
      options = options || {};
      options.css = typeof options.css == "boolean" ? options.css : true;
      options.duration = typeof options.duration == "number" ? options.duration : 0;
      
      this.options = options;
      this.element = element; 
      
      var properties = {};
      this.properties = properties;
      
      var transition = this;
      var isPlaying = false;
      
      var transitionTimeout = null;
      var transitionStyle = getVendorStyle('transition');
      var vendorEvents = ['transitionend', 'transitionEnd', "webkitTransitionEnd", "oTransitionEnd"];
      
      function completeHandler(event) {
        
        if (transition.isPlaying()) {
          transition.stop();
          if (typeof options.complete == "function") {
            options.complete.call(this);
          }
        } else {
          // transition is already complete
        }
      }
      
      this.start = function(properties, duration) {
        
        duration = typeof duration == "number" ? duration : options.duration;
       
        this.properties = properties;
        
        if (this.isPlaying()) {
          this.stop();
        }
          
    
        isPlaying = true;
              
        if (options.css && transitionStyle) {
          
          if (Object.keys(properties).length == 0 || duration == 0) {
            // TODO: check if start and endvalue are the same
            completeHandler.call(this);
            return;
          }
            
          for (var i = 0; i < vendorEvents.length; i++) {
            element.addEventListener(vendorEvents[i], completeHandler);
          }
  
          element.style[transitionStyle + "Property"] = Object.keys(properties).join(",");
          element.style[transitionStyle + "Duration"] = Math.round(duration / 1000).toFixed(2) + "s";
          element.style[transitionStyle + "Easing"] = options.easing;

          window.setTimeout(function() {
            for (var x in properties) {
              element.style[x] = properties[x];
            }
          }, 1);
              
          transitionTimeout = window.setTimeout(function() {
            if (transition.isPlaying()) {
              completeHandler.call(element);
            }
          }, duration + 1000);
            
          return;
        }
            
        // jquery time-based

        var opts = {};
        for (var x in options) {
          
          opts[x] = options[x];
        }
        opts['complete'] = completeHandler;
        opts['duration'] = duration;
        
        $(element).animate(properties, opts);
          
          return this;
      };
      
      
      this.stop = function() {
        
        if (this.isPlaying()) {
          
          isPlaying = false;
          
          
          // time-based jquery
          $(element).stop();
          
          
          // css
          
          for (var i = 0; i < vendorEvents.length; i++) {
            $(element).unbind(vendorEvents[i], completeHandler);
          }
          window.clearTimeout(transitionTimeout);
          transitionTimeout = null;
          
          element.style[transitionStyle + "Property"] = "";
          element.style[transitionStyle + "Duration"] = "0s";
          element.style[transitionStyle + "Easing"] = "";  
          
          
          var properties = this.properties;
          
          if (typeof options.stop == "function") {
            options.stop.call(this);
          }
          

        }
      };
      
      this.isPlaying = function() {
        return isPlaying;
      };
      
    }
  
    /* Helper methods */
 
 
    function getTranslate(string, width, height, depth) {
      
      var x = y = z = 0; 
      var match = string.match(/^translate(?:3d)?\(([-\d]*)([a-z%]*)?,([-\d]*)([a-z%]*)?(?:,\s*([-\d]*)([a-z%]*)?)?\)/);
      
      if (match) {
        
        var xv = match[1], xu = match[2], yv = match[3], yu = match[4], zv = match[5], zu = match[6];
        var x = xu == "%" ? xv / 100 * width : parseFloat(xv);
        var y = yu == "%" ? yv / 100 * height : parseFloat(yv);
        var z = zu == "%" ? zv / 100 * depth : parseFloat(zv);
      }
      return {
        x: x, 
        y: y, 
        z: z
      };
    }
    
    function getTransformPosition(string) {
      var result = {};
      if (typeof string == "string") {
        var re = new RegExp(/^matrix(?:3d)?\((.*)\)/);
        //
        var match = string.match(re);
        if (match) {
          var values = match[1].split(/\s*,\s*/);
          if (string.indexOf('matrix3d') == 0) {
            return {
              x: parseFloat(values[12]), y: parseFloat(values[13])
              
            };
          } else {
            return {
              x: parseFloat(values[4]), y: parseFloat(values[5])
            };
          }
          return result;
        }
      }
      return {
        x: 0, y: 0
      };
    }
    
    var getVendorStyle = (function() {

      var cache = [];
      
      return function (styleName) {
  
        var vendorPrefixes = ['Webkit', 'Moz', 'O', 'Ms'];
        result = null;
        if (typeof cache[styleName] != 'undefined') {
          return cache[styleName];
        }
        var elem = document.createElement('div');
        document.documentElement.appendChild(elem);
        if (!result) {
          if (typeof (elem.style[styleName]) == 'string') {
            cache[styleName] = styleName;
            result = styleName;
          }
        }
        if (!result) {
          var capitalized = styleName.substring(0, 1).toUpperCase() + styleName.substring(1);
          for (var i = 0; i < vendorPrefixes.length; i++) {
            var prop = vendorPrefixes[i] + capitalized;
            if (typeof elem.style[prop] == 'string') {
              cache[styleName] = prop;
              result = prop;
              break;
            }
          }
        }
        cache[styleName] = result;
        elem.parentNode.removeChild(elem);
        return result;
      };
      
    })();
 
  
  
  
  /* SlideView Plugin */
 
  // keep track of all instances to find content within the entire document
  var slideViews = []; 
  
  /* SlideView Implementation */
  var pluginClass = function SlideView(element, options) {
    
    var container = null;
    
    var slideView = this;
    var $element = $(element);
    
    var invalidateFlag = true;
    
    
    var items = [];
    
    var scrollPosition = null;
    var scrollTransition = null;

    var currentTransition = null;
    
    var lastItem = null;
    var currentItem = null;
    
    var currentSlide = null;
    var queuedSlide = null;
    
    var readySlides = [];
    var $container;
    
    function isItem(item) {
      return item.nodeType == 1
        && $.inArray(item.tagName.toLowerCase(), ["br", "script", "link", "map"]) == -1
        || item.nodeType == 3 && $.trim(item.nodeValue);
    }
    
    this.indexOf = function(item) {
      for (var i = 0; i < items.length; i++) if (items[i] == item) return i;
    };
    
    this.get = function(index) {
      return items[index];
    };
    
    this.size = function() {
      return items.length;
    };
    
    this.add = function(item, index) {
      items.splice(index, 0, item);
      this.invalidate();
    };
    
    this.remove = function(item) {
      items.splice(this.indexOf(item), 1);
      this.invalidate();
    };
    
    this.removeAll = function() {
      for (var i = 0; i < this.size(); i++) {
        invalidateFlag = false;
        this.remove(this.get(i));
        invalidateFlag = true;
        i--;
      }
      this.invalidate();
    };
    
    this.addAll = function(collection, index) {
      index = typeof index == 'number' ? index : this.size();
      for (var i = 0; i < collection.length; i++) {
        invalidateFlag = false;
        this.add(collection[i], index + i);
        invalidateFlag = true;
      }
      this.invalidate();
    };
    
    this.invalidate = function() {
      if (!invalidateFlag) return;
      layout.call(this);
    };
    
  
    function getElementPosition(item, style) {
      var transformStyle = getVendorStyle('transform');
      style = typeof style == "string" ? style : options.scrollStyle;
      style = transformStyle ? style : 'position';
      
      var x = 0, y = 0;
      switch (style) {
        
        case 'position':
          
          var left = $(item).css('left');
          var x = parseFloat(left);
          var top = $(item).css('top');
          var y = parseFloat(top);
          break;
  
        case 'transform': 
        case 'transform3d': 
  
          var styleValue = $(item).css(transformStyle);
          var matrix = getTransformPosition(styleValue);
          
          if (matrix) {
            
            var x = matrix.x; 
            var y = matrix.y;
  
          }
          
          break;
  
          default: 

      }
        
      x = !isNaN(x) ? x : 0;
      y = !isNaN(y) ? y : 0;
        
      return {x: x, y: y};
    }
    
    function setElementPosition(item, left, top, style) {
      
      var transformStyle = getVendorStyle('transform');
      style = typeof style == "string" ? style : options.scrollStyle;
      style = transformStyle ? style : 'position';
    
      switch (style) {
        
        case 'position': 
        
          $(item).css('left', left);
          $(item).css('top', top);
          break;
          
        case 'transform': 
        case 'transform3d': 
        
          var transformStyle = getVendorStyle('transform');
          var translateMethod = style == 'transform3d' ? 'translate3d' : 'translate';
          var styleValue = translateMethod + "(" + left + ", " + top + ")";
          var styleValue;
          if (style == 'transform3d') {
             styleValue = "translate3d(" + left + ", " + top + ",0)";
          } else {
             styleValue = "translate(" + left + ", " + top + ")";
          }
          
          item.style[transformStyle] = styleValue;
          break; 
      }
    }
    
    function getElementAtScrollPosition(x, y) {
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var p = getElementPosition(item);
        if ($(item).is(":visible") && p.x >= x && p.x < x + element.clientWidth) {
          return item;
        }
      }
      return null;
    }

    function invalidateScrollPosition() {
      scrollPosition = null;
    }
    
    function getScrollPosition() {
      if (!scrollPosition) {
        scrollPosition = getComputedScrollPosition();
      } else {
        // get cached position
      }
      return scrollPosition;
    }
    
    function getComputedScrollPosition() {
      var s = getElementPosition(container, options.scrollStyle);
      return {
        x: -s.x, y: -s.y
      };
    }

    function setScrollPosition(x, y, duration, _layoutItems) {
      
      duration = typeof duration == "number" ? duration : typeof duration == "boolean" ? duration ? options.transitionDuration : 0 : 0;
      
      x = typeof x == "number" ? x : 0;
      y = typeof y == "number" ? y : 0;
      
      if (!options.endless) {
        if (x < 0) {
          x = 0;
        } else if (x > (slideView.size() - 1) * element.clientWidth) {
          x = (slideView.size() - 1) * element.clientWidth;
        }
      }

      var xp = -x / element.clientWidth * 100;
      var yp = -y / element.clientHeight * 100;
      
     if (currentTransition) {
       
        var t = getStylePosition(currentTransition.properties);
        if (x == -t.x && y == -t.y) {
          // a transition to this position is already running
          return;
        }

        currentTransition.stop();
        currentTransition = null;
      }
      
      
      var s = getScrollPosition();

      if (duration == 0 || s.x == x && s.y == y) {
        
        // no transition

        if (s.x != x || s.y != y) {
          
          setElementPosition(container, xp + "%", yp + "%");
          scrollPosition = {x: x, y: y};
          
        }
        
        scrollComplete();
        
      } else {
        
        // transition
        var properties = {};
        switch (options.scrollStyle) {
          case 'position': 
            properties = {
              left: xp + "%", 
              top: yp + "%"
            };
            break;
            
          case 'transform':
          case 'transform3d': 
          
            var transformStyle = getVendorStyle('transform');
            var transformValue = "translate(" + xp + "%" + "," + yp + "%)";
            if (options.scrollStyle == "transform3d") {
              transformValue = "translate3d(" + xp + "%" + "," + yp + "%,0)";
            }
            properties[transformStyle] = transformValue; 
        }
        
        currentTransition = scrollTransition.start(properties, duration);
        scrollPosition = {x: x, y: y};
        layoutItems();
      }
      
      
    }
    
    
    function getStylePosition(props) {
      var p = {x: 0, y: 0};
      for (var prop in props) {
        if (prop == "scrollLeft" || prop == "scrollTop") {
          // TODO: implement overflow support
        } else if (prop == "left" || prop == "top") {
          // get position
          var m = props[prop].match(/(-?[\d\.]*)([a-z%]*)?/);
          if (m) {
            if (prop == "left") {
              p.x = m[2] == "%" ? - m[1] / 100 * element.clientWidth : - m[1];
            } else {
              p.y = m[2] == "%" ? - m[1] / 100 * element.clientHeight : - m[1];
            }
          }
        } else if (prop.indexOf('transform') >= 0) {
          // TODO: implement transform support
          p = getTranslate(props[prop], element.clientWidth, element.clientHeight);
        }
      }
      return p;
    }
    
    
    function scrollTo(x, y, duration) {
        validateLayoutItems();
        setScrollPosition(x, y, duration);
    }
    
    function getCurrentItem() {
      invalidateScrollPosition();
      var s = getScrollPosition();
      var elem = getElementAtScrollPosition(s.x, s.y);
      return elem;
      // 
      var si = Math.floor(s.x / element.clientWidth) * element.clientWidth;
      for (var i = 0; i < items.length; i++) {
        var elem = items[i];
        var p = getElementPosition(elem);
        if (p.x >= si && p.x < si + element.clientWidth) {
          return elem;
        }
      }
      return null;
    }
    
    function getVisibleItems(scrollPosition) {
      var s = typeof scrollPosition == 'number' ? scrollPosition : getScrollPosition();
      var vItems = [];
      var currentItem = null;
      for (var i = 0; i < items.length; i++) {
        var elem = items[i];
        var p = getElementPosition(elem);
        if (elem.style.display != 'none' && p.x > s.x - element.clientWidth && p.x < s.x + element.clientWidth) {
          vItems.push({item: elem, scrollIndex: p.x / element.clientWidth});
        }
      }
      return vItems;
    }
    
    function inViewport (element) {

        var $element = $(element);
        var $win = $(window); 
     
        var viewport = {
            top : $win.scrollTop(),
            left : $win.scrollLeft()
        };
        viewport.right = viewport.left + $win.width();
        viewport.bottom = viewport.top + $win.height();
         
        var bounds = $element.offset();
        bounds.right = bounds.left + $element.outerWidth();
        bounds.bottom = bounds.top + $element.outerHeight();
        
        return bounds.left >= viewport.left && bounds.right <= viewport.right;
        
    }

    function swipeTo(item, duration, direction) {

      var items = getLayoutItems();
      
      var s = getScrollPosition();
      var p = getElementPosition(item);
      
      var currentPage = Math.floor(s.x / element.clientWidth);
      var currentItem = getCurrentItem();
      var currentIndex = $.inArray(currentItem, items);
      
      var itemIndex = slideView.indexOf(item);
      
      var vItems = getVisibleItems(s);
      
      if (vItems.length == 0) {
        invalidateLayoutItems();
        layoutItems();
        vItems = getVisibleItems(s);
        if (vItems.length == 0) {
          // error
          console.error('no visible items', element.className, items);
          return;
        }
      }

      var vMinScrollIndex = vItems[0].scrollIndex;
      var vMaxScrollIndex = vItems[vItems.length - 1].scrollIndex;
      
      
      // get direction
      duration = !inViewport(element) ? 0 : duration;
      direction = typeof direction == "number" ? direction : itemIndex < currentIndex ? -1 : itemIndex > currentIndex ? 1 : 0;

      
      // check for visible neighbors
      var currentNextIndex = (currentIndex + 1) % items.length;
      currentNextIndex = currentNextIndex < 0 ? currentNextIndex + items.length : currentNextIndex;
      var currentNextItem = items[currentNextIndex];
      
      var currentPrevIndex = (currentIndex - 1) % items.length;
      currentPrevIndex = currentPrevIndex < 0 ? currentPrevIndex + items.length : currentPrevIndex;
      var currentPrevItem = items[currentPrevIndex];
      
      var scrollOffset = s.x / element.clientWidth - currentPage;
      
      
      if (direction > 0 && currentNextItem == item) {
        setScrollPosition((currentPage + 1) * element.clientWidth, 0, duration);
        return;
      } else if (direction < 0 && currentPrevItem == item) {
        setScrollPosition((currentPage - 1) * element.clientWidth, 0, duration);
        return;
      }

      var lItems = [];
      var mItems = items.slice();
      
      if (direction == 0) {
         return;
      }
      
      if (direction > 0) {
        
        // forward

        for (var i = vMinScrollIndex; i <= vMinScrollIndex + items.length; i++) {

          var m = i % items.length;
          m = m < 0 ? m + items.length : m;
          elem = items[m];

          if (i > vMaxScrollIndex && i <= vMaxScrollIndex + 2) {
            
            var me = (itemIndex + i - vMaxScrollIndex - 1) % items.length;
            me = me < 0 ? me + items.length : me;
            elem = slideView.get(me);
            
          } else {
          }
          
          while ($.inArray(elem, lItems) >= 0 && mItems.length > 0) {
            elem = mItems.shift();
          }
          
         
          lItems[m] = elem;
        }
 
      } else if (direction < 0) {
        
        // backward
          
        for (var i = currentPage; i > currentPage - items.length; i--) {

          var m = i % items.length;
          m = m < 0 ? m + items.length : m;
          elem = items[m];
            
          if (i < currentPage && i >= currentPage - 2) {
            
            mItems.push(elem);
            var me = (itemIndex + i - currentPage + 1) % items.length;
            var me = me < 0 ? me + items.length : me;
            elem = slideView.get(me);
            
          }
          
          while ($.inArray(elem, lItems) >= 0 && mItems.length > 0) {
            elem = mItems.shift();
          }
          lItems[m] = elem;
          
        }
        
      }
         
      setLayoutItems(lItems);
      setScrollPosition((currentPage + direction) * element.clientWidth, 0, duration);
      
      
    }
    
    function slideBefore(item) {
      if (typeof options.slideBefore == "function") {
        options.slideBefore.call(slideView, item);
      }
    }
    
    function slideTo(item, slideOptions) {
      
      slideOptions = slideOptions || {};
      slideOptions.duration = typeof slideOptions.duration == "number" ? slideOptions.duration : true;
      
      slideBefore(item);
      
      switch (slideOptions.transitionType) {

        case 'scroll': 
        default:
         
          swipeTo(item, slideOptions.duration, slideOptions.direction);

      }
    }
    
    this.slideTo = function(item, slideOptions) {
      if (typeof item == "number") {
        var index = item;
        if (options.endless) {
          index = amod(item, slideView.size());
        }
        item = slideView.get(index);
      }
      if (!item) return;
      if (scrollTransition.isPlaying()) {
        queuedSlide = {item: item, options: slideOptions};
      } else {
        slideTo(item, slideOptions);
      }
    };
    

    function scrollComplete() {
      
      var s = getScrollPosition();
      
      if (s.x % element.clientWidth == 0) {
        
        layoutItems.call(this);
        var currentItem = getCurrentItem();
        // page
        if (queuedSlide && queuedSlide.item != currentItem) {
          
          var item = queuedSlide.item, slideOptions = queuedSlide.options;
          queuedSlide = null;
          slideTo(item, slideOptions);
          
        } else {
          
          queuedSlide = null;
          if (currentSlide != currentItem) {
            
            
            currentSlide = currentItem;
            slideComplete();
          }

        }
        
      }
    }
   
    function transitionComplete() {
      
      currentTransition = null;
      validateLayoutItems();
      scrollComplete();
      
    }
    
    var historyTimeoutID = null;
    
    function getLinkItem(href, _slideView) {
       _slideView = _slideView ? _slideView : slideView;
      for (var i = 0; i < _slideView.size(); i++) {
        var item = _slideView.get(i);
        if ($(item).data('src') == href) {
          return item;
        }
      }
      return null;
    }
    
    function updateLinks() {
       var currentItem = getCurrentItem();
       $(options.linkSelector).each(function() {
         var $this = $(this);
         if (getLinkItem(this.href) == currentItem) {
           $this.addClass(options.currentSlideClass);
         } else {
           $this.removeClass(options.currentSlideClass);
         }
       });
    }
    
    var stateItem = {};
    
    function pushItem(item) {
      
      if (!options.locationControl) return;
      
      var $item = $(item);
      var href =  $item.data('src');
      var title = $item.data('title');
      if (href != stateItem.href) {
        stateItem = {
          href: href, 
          title: title
        };
        window.clearTimeout(historyTimeoutID);
        historyTimeoutID = window.setTimeout(function() {
          if (inViewport(element)) {
            if (History && History.pushState) {
              History.pushState(stateItem, title, href);
            } else if (history.pushState) {
              history.pushState(stateItem, title, href);   
            } else {
              // no push state support
            }
          }
           
        }, 500);
      }
    }
    
    function slideComplete() {
      
      var size = slideView.size();
      var currentItem = getCurrentItem();
      var position = getCurrentIndex();
      var src = $(currentItem).data('src');
            
      // next button
      $nextButton = $(options.nextSelector);
      if ($nextButton.length) {
        var nextPos = position + 1 > size - 1 ? 0 : position + 1;
        var nextItem = slideView.get(nextPos);
        if (nextItem) {
          var nextLink = $(nextItem).data('src');
          $nextButton.each(function() {
            $(this).attr('href', nextLink);
            if (!options.endless && position + 1 > size - 1) {
              $(this).addClass('hidden');
            } else {
              $(this).removeClass('hidden');
            }
          });
        }
      }
      
      // prev button
      $prevButton = $(options.previousSelector);
      if ($prevButton.length) {
        var prevPos = position - 1 < 0 ? size - 1 : position - 1;
        var prevItem = slideView.get(prevPos);
        if (prevItem) {
          prevLink = $(prevItem).data('src');
          $prevButton.each(function() {
            $(this).attr('href', prevLink);
            if (!options.endless && position - 1 < 0) {
              $(this).addClass('hidden');
            } else {
              $(this).removeClass('hidden');
            }
          });
        }
      }

      
       // link selectors
      updateLinks();

      // history
      
      if (src) {
        
        var locationItem = currentItem;
        
        // location control is done by the deepest nested slideview
        var slideViewChildren = getSlideViewChildren(locationItem);
        while (slideViewChildren.length > 0) {
          var slideViewChild = slideViewChildren[0].slideView;
          locationItem = slideViewChild.getCurrentItem();
          slideViewChildren = getSlideViewChildren(locationItem);
        }
        
        pushItem(locationItem);
        
      }

      // callback
 
      if (typeof options.slideComplete == "function") {
        options.slideComplete.call(slideView, currentItem);
      }
      
    }
    
    this.getPageIndex = function() {
      return Math.floor(getScrollPosition().x / element.clientWidth % this.size());
    };
    
    this.getScrollWidth = function() {
      return items.length * element.clientWidth;
    };
    
    this.getScrollHeight = function() {
      return items.length * element.clientHeight;
    };

    this.next = function() {
      this.slideTo(getCurrentIndex() + 1, {
        direction: 1
      });
    };
    
    this.previous = function() {
      this.slideTo(getCurrentIndex() - 1, {
        direction: -1
      });
    };
    
    this.getPosition = function() {
      return getCurrentIndex();
    };
    
    this.getCurrentItem = function() {
      return getCurrentItem();
    };
    
    function getCurrentIndex() {
      return slideView.indexOf(getCurrentItem());
    }

    function getViewportItems() {
      var array = [];
      var s = getScrollPosition();
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var p = getElementPosition(item, options.scrollStyle);
        if (p.x > s.x - element.clientWidth && p.x < s.x + element.clientWidth) {
          array.push({item: item, p: p});
        }
      }
      array.sort(function(obj1, obj2) {
        if (obj1.p.x > obj2.p.x) {
          return 1;
        } else if (obj1.p.x < obj2.p.x) {
          return -1;
        } else {
          return 0;
        }
      });
      return array; 
    }
    
    var _layoutItems = null;
    
    function amod(x, m) {
      var r = x % m;
      r = r < 0 ? r + m : r;
      return r;
    } 
    
    function validateLayoutItems() {
      
      if (!_layoutItems) return;
      
      var s = getScrollPosition();
      var hasValidOrder = true;
      var items = getLayoutItems(); 
      var vItems = [];
      var vIndex = null;
        for (var i = 0; i < items.length; i++) {
          var elem = items[i];
          var p = getElementPosition(elem);
          if ($(elem).is(":visible") && p.x > s.x - element.clientWidth && p.x < s.x + element.clientWidth) {
            var eIndex = amod(slideView.indexOf(elem), items.length);
            if (vIndex == null) {
            vIndex = eIndex;
            } else {
              vIndex = amod(vIndex++, items.length);
              if (vIndex == eIndex) {
                //hasValidOrder = true;
              } else {
                hasValidOrder = false;
                break;
              }
            }
          }
        }
        
        if (hasValidOrder) {
          
          var scrollIndex = Math.floor(s.x / element.clientWidth);
          var offset = s.x / element.clientWidth - scrollIndex;
          var elem = getElementAtScrollPosition(s.x, 0);
          var itemIndex = slideView.indexOf(elem);
          var x = (itemIndex + offset) * element.clientWidth;
          
          invalidateLayoutItems();
          setScrollPosition(x, 0, 0);
          
          // order is valid
          return true;
        } else {
          // order is invalid
          return false;
        }
    }
    
    function invalidateLayoutItems() {
      _layoutItems = null;
    }
    
    function setLayoutItems(items) {
      _layoutItems = items;
    }
    
    function getLayoutItems() {
      if (!_layoutItems) {
        return items;
      }
      return _layoutItems;
    }
    
    function layoutItems() {

      invalidateScrollPosition();
      var s = getScrollPosition();
      
      var scrollIndex = Math.floor(s.x / element.clientWidth);
      var scrollOffset = s.x / element.clientWidth - scrollIndex;
 
      var lItems = getLayoutItems();
      
      var minScrollIndex = scrollIndex - 1;
      var maxScrollIndex = scrollIndex + 1;
      
      if (lItems.length == 2) {
        minScrollIndex = scrollIndex;
        maxScrollIndex = scrollIndex + 1;
        
        var d = 0;
        
        if (scrollTransition.isPlaying()) {
          
          var p = getStylePosition(scrollTransition.properties);
          d = -p.x - s.x;
          if (d < 0) {
            minScrollIndex = scrollIndex - 1;
            maxScrollIndex = scrollIndex;
          }
        } else {
          
          d = s.x % element.clientWidth;
        }
      }

      for (var x = minScrollIndex; x < minScrollIndex + lItems.length; x++) {
        
        var m = x % slideView.size();
        m = m < 0 ? m + slideView.size() : m;
        
        var item = lItems[m];
        var $item = $(item);
        
        
        if (x >= minScrollIndex && x <= maxScrollIndex) {
            
          if (item.parentNode != container) {
            
            container.appendChild(item);
            $item.css({
              position: 'absolute', 
              width: '100%'
            });
            
          }
          
          
          item.style.display = "";
          
          var p = getElementPosition(item, options.scrollStyle);
          
          setElementPosition(item, x * 100 + "%", p.y + "px", options.scrollStyle);
          
          // return bounds.left >= viewport.left && bounds.right <= viewport.right 
          var isVisibleAtScrollPosition = x + element.clientWidth > s.x && x < s.x + element.clientWidth;
          isVisibleAtScrollPosition = x + 1 > s.x / element.clientWidth && x < s.x / element.clientWidth + 1;
          if (!isVisibleAtScrollPosition) {
            // reset scrolling
            item.scrollTop = 0;
            var slideViewChildren = getSlideViewChildren(item);
            for (var i = 0; i < slideViewChildren.length; i++) {
              var childSlideView = slideViewChildren[i].slideView;
              for (var j = 0; j < childSlideView.size(); j++) {
                childSlideView.get(j).scrollTop = 0;
              }
            }
          } else {
          }
          
          if (!isSlideLoaded(item)) {
            loadSlide(item);
          }
            
        } else {
          
          // hide
          $item.css('display', 'none');
          $item.scrollTop(0);
        }
      }
      
    }
    
    
    function layout() {
      
      $element.css({
        'overflow': 'hidden'
      });
      
      for (var i = 0; i < items.length; i++) {
        
        var item = items[i];
        $(item).css({
          width: '100%', 
          height: '100%', 
          overflow: 'auto', 
          WebkitOverflowScrolling: 'touch'
        });
        
      }

    }
    
    
    
    
    
    
    
    
    /* Load Management */
   
    // Initializiation
   
    
    function isSlideReady(item) {
        var $item = $(item);
        var src = $item.data('src');
        return !src
          || src == window.location.href 
          || $.inArray(item, readySlides) >= 0;
    }
    
    function slideReady(item) {
      if ($.inArray(item, readySlides) == -1) {
        readySlides.push(item);
        $(item).removeClass('loading');
        
        if (typeof options.slideReady == "function") {
          options.slideReady.call(slideView, item);
        }
        if (!options.preloadImages || isAllImageComplete(item)) {
           slideLoaded.call(slideView, item);
        } else {
          loadImages(item);
        }
      }
    }
    
    function isSlideLoaded(item) {
      return $(item).data('src') == window.location.href || isSlideReady(item) && (!options.preloadImages || isAllImageComplete(item));
    }
    
    function slideLoaded(item) {
      $(item).removeClass('loading');
      if (options.slideLoaded == "function") options.slideLoaded.call(slideView, item);
    }
   
   
   
        
   function loadSlide(item) {
      if ($(item).hasClass('loading')) return;
      if (!isSlideReady(item)) {
          loadContent(item, function(elem) {
            slideReady.call(slideView, elem);
          });
      } else if (!isSlideLoaded(item)) {
        loadImages(item);
      } else {
          // complete
      }
    }
    
    function loadImages(item) {
      
      $item = $(item);

      if (isAllImageComplete(item)) {
        return;
      }

      $item.addClass('loading');
      
      var children = null;

      $('img', item).bind('load error', function(event) {

          if (event.type == 'error') {
            // image error
          }
       
          var complete = true;
          for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (!isAllImageComplete(child)) {
              complete = false;
            }
          }
          
          if (complete) {
            // images complete
          
            // restore children
            if (children != null) {
              for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (child.nodeType == 1) {
                  child.style.display = "";
                }
                item.appendChild(child);
              }
              slideLoaded.call(slideView, item);
            }
            
          }
          
      });
      
      children = [];
      
      if ($.inArray(item, masterItems) == -1) {
        for (var i = 0; i < item.childNodes.length; i++) {
          var child = item.childNodes[i];
          children.push( child );
          if (child.nodeType == 1) {
            child.style.display = "none";
          } else {
            item.removeChild(child);
            i--;
          }
        }
      }
      
    }
    
    function loadContent(item, callback) {

      var $item = $(item);
      $item.addClass('loading');

      var url = $item.data('src');

      $.ajax({
        url: url, 
        dataType: 'html'
      }).success(function(data, status, xhr) {
      
      
        var elem = null;
        var htmlElements = $.parseHTML(data);
        
        var title = "";
        
        $(htmlElements).each(function() {
          var importNode = null;
          var $this = $(this);
          if ($this.is(options.itemSelector)) {
            importNode = this; 
          } else {
            importNode = $this.find(options.itemSelector)[0];
          }
          if (importNode) {
            elem = document.importNode(importNode, true);
          }
          if ($this.is('title')) {
            title = $this.text();
          }
        });
        
        if (elem) {
  
          var $elem = $(elem);
          
          // replace attributes
          for (var i = 0; i < elem.attributes; i++) {
            $item.attr(elem.attributes[i].nodeName, elem.attributes[i].nodeValue);
          }
          
          // remove unique id
          $item.removeAttr("id");
          
          // replace content
          $item.html($elem.html());
          
          // add css classes
          var cssClasses = elem.className.split(/\s+/);
          for (var i = 0; i < cssClasses.length; i++) {
            $item.addClass(cssClasses[i]);
          }
          
          if (title) {
            $item.data('title', title);
          }
          
          $item.removeClass('loading');
          
          if (callback) {
            // callback
            callback.call(this, item);
          }
  
        } else {
          console.warn('content element not found - selector: ' + options.itemSelector);
        }
  
      });
    }
    
    
  
    /* User Interaction */
   
   
    var hasMouseFocus = false;
    
    // keyboard navigation
    
    function initKeyboardInteraction() {
      
      $(element).bind('mouseenter', function(event) {
        hasMouseFocus = true;
      });
      
      $(element).bind('mouseleave', function(event) {
        hasMouseFocus = false;
      });
      
      $(document).bind('keydown', function(event) {
        
        if (event.target.tabIndex >= 0) {
          return;
        }
        
        if (hasMouseFocus) {
          switch (event.which) {
            case 39: 
              slideView.next();
              event.preventDefault();
              break;
            case 37: 
              slideView.previous();
              event.preventDefault();
              break;
          }
        }
      });
 
    }

    function initMouseWheelInteraction() {

      $element = $(element);
      
      var mouseWheelEndTimeout = null;
      var mouseWheelCount = 0;
      
      
      $element.bind('onmousewheel' in window ? 'mousewheel' : 'DOMMouseScroll', function(event) {

        var preventDefault = false;
    
        // get mouse wheel vector
        var oEvent = event.originalEvent;
        var wheelDeltaX;
        var wheelDeltaY;
        if (!window.opera && 'wheelDeltaX' in oEvent) {
          wheelDeltaX = oEvent.wheelDeltaX;
          wheelDeltaY = oEvent.wheelDeltaY;
            
        } else if (!window.opera && 'detail' in oEvent) {
          if (oEvent.axis === 2) { 
            // Vertical
            wheelDeltaY = -oEvent.detail * 12;
            wheelDeltaX = 0;
          } else { 
            // Horizontal
            wheelDeltaX = -oEvent.detail * 12;
            wheelDeltaY = 0;
          }
        } else if ('wheelDelta' in oEvent) {
          // ie / opera
          wheelDeltaX = 0;
          wheelDeltaY = sh > 0 ? oEvent.wheelDelta : 0;
        }
        
        var dx = wheelDeltaX ? - wheelDeltaX / 12 : 0;
        var dy = - wheelDeltaY / 12;
  
        var o = dy == 0 ? Math.abs(dx) : Math.abs(dx) / Math.abs(dy);
        
        
        if (mouseWheelEndTimeout != null) {
          
          window.clearTimeout(mouseWheelEndTimeout);
          mouseWheelEndTimeout = null;
            
        } else {
          
          if (o > 0 && dx != 0) {
                
            if (dx > 0) {
              slideView.next();
            } else if (dx < 0) {
              slideView.previous();
            }
          }

        }
        
        if (o > 0 && dx != 0) {
          preventDefault = true;
        }
        
        mouseWheelEndTimeout = window.setTimeout(function() {
          mouseWheelEndTimeout = null;
        }, 100);

      
        if (currentTransition) {
            preventDefault = true;
        }
    
        if (preventDefault) {
            
          if (event.preventDefault) {
              event.preventDefault();
              event.stopPropagation();
          }
          event.returnValue = false;
          event.cancelBubbles = true;
          return false;     
        }
      
      });
    }
  
  var isScrolling = false;
  
  function initTouchInteraction() {
    
    var scrollTopStart;

    var mouseDragging = options.mouseDragging;

    var touchStartPos = null, touchStartTime = null, touchCurrentPos = null, touchInitialVector = null, cancelClicks;
    var initialDirection;
    
    var isTouch = 'ontouchstart' in window;
    
    if (!isTouch && !mouseDragging) {
      return;
    }
    
    
    
    var touchStartEvent = isTouch ? 'touchstart' : mouseDragging ? ' mousedown' : null;
    var touchMoveEvent = isTouch ? 'touchmove' : mouseDragging ? ' mousemove' : null;
    var touchEndEvent = isTouch ? 'touchend' : mouseDragging ? ' mouseup' : null;
   
    $element.bind(touchStartEvent, function(event) {
      
      if (scrollTransition.isPlaying()) {
          scrollTransition.stop();
      }

      var touchEvent = event.originalEvent;
      var touch = event.type == 'touchstart' ? touchEvent.changedTouches[0] : touchEvent;
      touchStartPos = touchCurrentPos = {x: touch.clientX, y: touch.clientY};
      touchStartTime = new Date().getTime();
      initialDirection = null;
    
      if (event.type == 'mousedown') {
        event.preventDefault();
      }
      
     

    });
    
    $element.bind(touchMoveEvent, function(event) {

      // touch move

      if (touchCurrentPos != null) {

        var touchEvent = event.originalEvent;
        
        var touch = event.type == 'touchmove' ? touchEvent.changedTouches[0] : touchEvent;
        var touchX = touch.clientX;
        var touchY = touch.clientY;
        
        var dx = (touchX - touchCurrentPos.x) * -1;
        var dy = (touchY - touchCurrentPos.y) * -1;
        
        touchCurrentPos = {x: touchX, y: touchY};
        
        //var o = Math.abs(dx) / Math.abs(dy);
        var o = dy == 0 ? Math.abs(dx) : Math.abs(dx) / Math.abs(dy);
        
        var dragStart = false;
        
        var scrollOffset = null;

        if (initialDirection == null) {
          
          initialDirection = o;
        
        }

        
        if (initialDirection >= 1) {

          if (dx != 0) {

              var s = getScrollPosition();
              setScrollPosition(s.x + dx, 0, 0);
          }

          event.preventDefault();
  
        }
      }

    });
    
    
    
    $element.bind(touchEndEvent, function(event) {
      
      // touch end
    
      if (touchCurrentPos != null) {   

        cancelClicks = true;
    
        var touchEvent = event.originalEvent;
          
        var duration;
        
        var currentIndex = slideView.indexOf(currentItem);
        var newIndex = currentIndex;
          
        var dx = touchCurrentPos.x - touchStartPos.x;
        var dy = touchCurrentPos.y - touchStartPos.y;
        
        var maxTouchTime = 250;
        
        var touchTime = new Date().getTime() - touchStartTime;
    
        var clw = $element.width();
        var clh = $element.height();
        
        var v = touchInitialVector;
        
        var o = Math.abs(dx) / Math.abs(dy);
        
        touchCurrentPos = null;
        
        // currentTransition = null;
        invalidateScrollPosition();

        if (o >= 1 && dx != 0) {
          
          var s = getScrollPosition();
          
          var scrollIndex = Math.floor(s.x / element.clientWidth);
          
          var duration = options.transitionDuration;
          
          if (touchTime < maxTouchTime) {
            
            if (dx < 0) {
              //slideView.next()
              setScrollPosition(Math.ceil(s.x / element.clientWidth) * element.clientWidth, 0, duration);
            } else if (dx > 0) {
              //slideView.previous()
              setScrollPosition(Math.floor(s.x / element.clientWidth) * element.clientWidth, 0, duration);
            } else {
              setScrollPosition(Math.round(s.x / element.clientWidth) * element.clientWidth, 0, duration);
            }

          } else {
            
            var scrollOffset = s.x / element.clientWidth - Math.round(s.x / element.clientWidth);;
            
            if (dx > 0 && scrollOffset > 0.5) {
              //slideView.next()
              setScrollPosition(Math.ceil(s.x / element.clientWidth) * element.clientWidth, 0, duration);
            } else if (dx < 0 && scrollOffset < -0.5) {
              //slideView.previous();
              setScrollPosition(Math.floor(s.x / element.clientWidth) * element.clientWidth, 0, duration);
            } else {
              setScrollPosition(Math.round(s.x / element.clientWidth) * element.clientWidth, 0, duration);
            }

          }
          
        }
        
       }
      
      
    });  

  }


  function getSlideViewChildren(elem) {
    var result = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!elem || elem == item) {
        for (var j = 0; j < slideViews.length; j++) {
          if (item == slideViews[j].element || $(item).has(slideViews[j].element).length > 0) {
            result.push({
              element: item, 
              slideView: slideViews[j].slideView
            });
          }
        }
      }
      return result;
    }
  }

  function initDocumentLinks() {
    
    $(document).bind('click', function(event) {

      var a = event.target.href ? event.target : $(event.target).parents('a[href]')[0];
      
      var item = null;
      var slideOpts = {};
      
      if (a) {
        
        var linkItem = getLinkItem(a.href);
        
        
        if (linkItem) {
          
          var nextButton = $(options.nextSelector).filter(function() {
            return (this == a);
          })[0];
          
          var prevButton = $(options.previousSelector).filter(function() {
            return (this == a);
          })[0];
          
          slideOpts.direction = nextButton ? 1 : prevButton ? -1 : undefined;
          
          item = linkItem;
          
          if (!event.isDefaultPrevented()) {
            slideView.slideTo(item, slideOpts);
            
          }
          event.preventDefault();
          
        } else {
          
          var slideViewChildren = getSlideViewChildren();
          for (var i = 0; i < slideViewChildren.length; i++) {
            var linkItem = getLinkItem(a.href, slideViewChildren[i].slideView);
            if (linkItem) {
              item = slideViewChildren[i].element;
              slideView.slideTo(item, slideOpts);
              break;
            }
          }
          
        }
      }
      
    });
    
  }


  /* INIT */

  var masterItems = [];
  
  function init() {
    

      // register the slideview
      slideViews.push({
        slideView: this, element: element
      });
      // init styles
      
      $element.css('position', 'relative');
      //$element.css('overflow-y', 'scroll');

      // init options
 
      if (options.scrollStyle.indexOf('transform') >= 0 && (!getVendorStyle('transform') || !getVendorStyle('transition') || !options.transitionCSS)) {
        options.scrollStyle = 'position';
      }
      
      if (options.scrollStyle.indexOf('transform') >= 0) {
        element.style.WebkitBackfaceVisibility = 'hidden';
      }
      
      
      
      // init interaction
      if (options.userInteraction) {
        initTouchInteraction();
        initKeyboardInteraction();
        initMouseWheelInteraction();
      }

      initDocumentLinks();

      // init items
      masterItems = [];
      var masterItemIndex = 0;
      
      for (var i = 0; i < element.childNodes.length; i++) {
        var child = element.childNodes[i];
        if (isItem(child)) {
          masterItems.push(child); 
        }
        element.removeChild(child);
        i--;
      }
      
      var masterItem = masterItems[0]; 
      
      var initialItems = [];
      
      if (options.linkSelector) { 
        
        $(options.linkSelector).each(function(index) {
          
          var loc = window.location.href;
          
          if (masterItem && (loc == this.href || options.currentSlideClass && $(this).hasClass(options.currentSlideClass))) {

            masterItemIndex = index;

            $(masterItem).data('src', this.href);
            
            var title = loc == this.href ? document.title : this.title;
            $(masterItem).data('title', title);
            
            // insert all items at master index
            
            for (var i = 0; i < masterItems.length; i++) {
              var child = masterItems[i];
              if (isItem(child)) {
                readySlides.push(child);
                initialItems.push(child);
              }

            }
            
          } else {
            var item = document.createElement('div');
            var $item = $(item);
            $item.addClass(options.slideClass);
            $item.data({
              'src': this.href, 
              'title': this.title
            });
            initialItems.push(item);
          } 
          
        });

      } else {
        initialItems = masterItems;
      }
      
      // init container
      container = element.ownerDocument.createElement('div');
      $container = $(container);
      
      // container styles
      $container.css({
        position: 'relative', 
        left: 0, 
        top: 0, 
        width: '100%', 
        height: '100%'
      });
      element.appendChild(container);
      
      // init transition
      scrollTransition = new Transition(container, {
        css: options.transitionCSS, 
        duration: options.transitionDuration, 
        easing: options.transitionEasing, 
        complete: function() {
          transitionComplete.call(slideView);
        }, 
        stop: function() {
          invalidateScrollPosition();
        }
      });
      
     
      // add items
      items = initialItems;

      // init layout
      setScrollPosition(masterItemIndex * element.clientWidth, 0, 0);
      
      
      layout.call(this);
      layoutItems.call(this);
 
    }

    // init plugin
    init.call(this);

  };
  
  
  // bootstrap plugin
  $.fn[pluginName] = function(options) {
    options = $.extend({}, defaults, options);
    return this.each(function() {
        if (!$(this).data(pluginName)) {
            try {
              $(this).data(pluginName, new pluginClass(this, options));
            } catch (e) {
              console.error(e);
            }
        }
        return $(this);
    });
  };
  
  
})(jQuery, window);