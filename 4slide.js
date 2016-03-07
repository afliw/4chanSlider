$j = $.noConflict();
afl = new aflSlide();
afl.init();

function aflSlide() {
  this.container = "";
  this.mediaHolder = "";
  this.infoBar = "";
  this.mediaObjects = [];
  this.current = 0;
  this.last = 0
  this.scrollDelay = 200;
  this.zoomFactor = 25;
  var self = this

  this.init = function() {
    getAllMedia();
    this.container = createContainerDiv();
    this.mediaHolder = createMediaHolder();
    this.infoBar = createInfoBar();
    this.current = 0;
  };

  function createInfoBar() {
    var infoContainer = $j("<div>", {
      id: "info-container",
      class: "slide"
    });
    var infoCounter = $j("<span>", {
      id: "info-counter",
      class: "slide"
    });
    var infoFile = $j("<span>", {
      id: "info-file",
      class: "slide"
    });
    return $j(infoContainer).append(infoCounter).append(infoFile);
  }

  function updateInfo() {
    var infoCounter = $j(self.infoBar).children().first();
    var infoLabel = $j(self.infoBar).children().eq(1);
    $j(infoCounter).text((self.current + 1) + "/" + self.mediaObjects.length);
    $j(infoLabel).html(self.mediaObjects[self.current].fileName + "<br>" + self.mediaObjects[self.current].fileInfo);
  }

  this.start = function(i) {
    if ($j(".fileThumb").length !== this.mediaObjects.length)
      getAllMedia();
    $j("body").append($j(this.container).append(this.infoBar).append(this.mediaHolder));
    this.current = i || 0;
    this.setMedia(this.current);
    this.scrollToPost(this.current);
    $j(this.container).fadeIn();
    updateInfo();
    $j(document).bind("keydown", keyBinding);
    $j(window).bind("resize", windowResizeEvent);
  };

  function windowResizeEvent() {
    $j("body").toggleClass("slide fullscreen-body", screen.height == window.innerHeight && screen.width == window.innerWidth);
  }

  function keyBinding(e) {
    switch (e.keyCode) {
      case 32:
      case 40:
      case 39:
        self.next();
        e.stopPropagation();
        e.preventDefault();
        return false;
      case 37:
      case 38:
      case 8:
        self.prev();
        e.stopPropagation();
        e.preventDefault();
        return false;
      case 27:
        self.stop();
        e.stopPropagation();
        e.preventDefault();
        return false;
    }
  }

  this.stop = function() {
    this.dimPost(this.current);
    $j(this.container).fadeOut(function() {
      $j(this.mediaHolder).empty();
      $j(this.container).remove();
    });
    $j(document).unbind("keydown", keyBinding);
    $j(window).unbind("resize", windowResizeEvent);
  };

  this.next = function() {
    if (this.current >= this.mediaObjects.length - 1) return;
    this.last = this.current;
    if (this.mediaObjects[this.current + 1] === undefined) this.current++;
    this.current++;
    this.scrollToPost(this.current);
    this.setMedia(this.current);
    updateInfo();
    if (this.current < this.mediaObjects.length - 1 && this.mediaObjects[this.current].img && this.mediaObjects[this.current].img.completed) {
      this.preloadMedia(this.current + 1);
    }
  };

  this.prev = function() {
    if (this.current <= 0) return;
    if (this.mediaObjects[this.current - 1] === undefined) this.current--;
    this.last = this.current;
    this.current--;
    this.scrollToPost(this.current);
    this.setMedia(this.current);
    updateInfo();
  };

  function getAllMedia() {
    $j(".fileThumb").each(function(i, e) {
      if ($j(e).prop("href") === "" || $j(e).prop("href") === undefined) return;
      self.mediaObjects[i] = {
        src: $j(e).prop("href"),
        type: $j(e).prop("href").indexOf("webm") != -1 ? "video" : "img",
        top: $j(e).offset().top,
        parentHeight: $j(e).parents(".post.reply").height(),
        parent: $j(e).parents(".post.reply"),
        fileName: $j(e).siblings(".fileText").children("a").text(),
        message: $j(e).parents(".file").siblings(".postMessage").text(),
        fileInfo: $j(e).siblings(".fileText").children("a").get(0).nextSibling.nodeValue.trim()
      };
      $j(e).removeAttr("href").click(function() {
        self.start(i);
      });
    });
  }

  this.setMedia = function(i) {
    var mo = this.mediaObjects[i];
    if (!mo.img) {
      var img = $j("<" + mo.type + ">").get(0);
      mo.img = img;
      if (mo.img.tagName == "VIDEO") {
        $j(mo.img).append($j("<source>", {
          src: mo.src,
          type: "video/webm"
        }));
        mo.img.setAttribute("autoplay", "");
        mo.img.setAttribute("controls", "");
        mo.img.setAttribute("name", "media");
      } else {
        mo.img.src = mo.src;
      }
    }

    if (mo.img.completed && !this.mediaObjects[this.current + 1].img) {
      this.preloadMedia(this.current + 1);
    } else {
      $j(mo.img).load(function() {
        self.preloadMedia(self.current + 1);
      });
    }
    $j(this.mediaHolder).empty()
                        .append(mo.img);

    $j(mo.img).click(imgClickHandler).contextmenu(function() {
      self.prev();
      return false;
    }).on("mousewheel",function(e){
      var currentHeight = parseInt(this.style.height) || 100;
      if(e.originalEvent.wheelDelta > 0){
        this.style.height = (currentHeight + self.zoomFactor)+"%";
      }else{
        this.style.height = (currentHeight - self.zoomFactor >= 100 ? currentHeight - self.zoomFactor : 100)+"%";
        this.style.top = 0;
        this.style.left = 0;
      }
      $j(this).unbind("click");
      if(this.style.height === "100%"){
        $j(this).bind("click",imgClickHandler);
      }
      e.stopPropagation();
      e.preventDefault();
      return false;
    }).mousedown(function(e){
      $j(document).mouseup(this,imgMouseUpHandler);
      var eventData = {
        imgTop: parseInt($j(this).get(0).style.top || 0),
        imgLeft: parseInt($j(this).get(0).style.left || 0),
        maxTop: window.innerHeight - parseInt($j(this).get(0).height),
        maxLeft: window.innerWidth - parseInt($j(this).get(0).width),
        moX: e.clientX,
        moY: e.clientY
      };
      $j(this).css("cursor","-webkit-grabbing")
              .mousemove(eventData,imgMouseMoveHandler);
    });

    setPostMessage(mo.img);
  };

  var imgClickHandler = function(){
    self.next();
  };

  var imgMouseUpHandler = function(e){
    $j(e.data).unbind("mousemove").css("cursor","");
    $j(this).unbind("mouseup",imgMouseUpHandler);
  };

  var imgMouseMoveHandler = function(e,eventData){
    var mX = e.clientX;
    var mY = e.clientY;

    var newImgTop = e.data.imgTop + ((e.data.moY - mY) * -1) * 1.2;
    var newImgLeft = e.data.imgLeft + ((e.data.moX - mX) * -1) * 1.2;

    newImgTop = e.data.maxTop > 0 ? 0 : newImgTop > 0 ? 0 : newImgTop > e.data.maxTop ? newImgTop : e.data.maxTop;
    newImgLeft = e.data.maxLeft > 0 ? 0 : newImgLeft > 0 ? 0 : newImgLeft > e.data.maxLeft ? newImgLeft : e.data.maxLeft;

    $j(this).css({
      top: newImgTop + "px",
      left: newImgLeft + "px"
    });

  };

  function setPostMessage(img) {
    if (!img.offsetWidth) {
      setTimeout(function() {
        setPostMessage(img);
      }, 200);
      return;
    }
    var messageContainer = $j("<div>", {
      id: "message-container",
      class: "slide"
    }).css({
      width: img.offsetWidth,
      left: img.offsetLeft
    }).text(self.mediaObjects[self.current].message);
    $j(self.mediaHolder).append(messageContainer);
  }

  function createMediaHolder() {
    var mediaHolder = $j("<div>", {
      id: "media-holder",
      class: "slide"
    });
    return mediaHolder;
  }

  this.preloadMedia = function(i) {
    var mo = this.mediaObjects[i];
    if (!mo) return;
    if (mo.img) return;
    if (mo.type === "img") {
      mo.img = new Image();
      mo.img.src = mo.src;
    } else {
      mo.img = $j("<video>").append($j("<source>").attr("src", mo.src)).get(0);
      mo.img.setAttribute("autoplay", "");
      mo.img.setAttribute("controls", "");
      mo.img.setAttribute("name", "media");
    }
  };

  this.scrollToPost = function(i) {
    this.dimPost(this.last);
    var sm = screen.availHeight / 2;
    var pm = this.mediaObjects[i].parentHeight / 2;
    $j("body").animate({
      scrollTop: this.mediaObjects[i].top - sm + pm
    }, this.scrollDelay, function() {
      self.highlightPost(i);
    });
  };

  this.dimPost = function(i) {
    $j(this.mediaObjects[i].parent).removeClass("slide highlighted-post");
  };

  this.highlightPost = function(i) {
    $j(this.mediaObjects[i].parent).addClass("slide highlighted-post");
  };

  function createContainerDiv() {
    var cont = $j("<div>", {
      id: "main-container",
      class: "slide"
    });
    $j(cont).click(function(e) {
      if (e.target.tagName === "IMG" || e.target.tagName == "VIDEO") return;
      self.stop();
    });
    return cont;
  }
}
