// var s = document.createElement("script");
// s.src = "https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js";
// s.type = "text/javascript";
// document.getElementsByTagName("head")[0].appendChild(s);
// var checkInterval = setInterval(function() {
//   if ($ == "function (a,b){return new n.fn.init(a,b)}") {
//     $j = $.noConflict();
//     clearInterval(checkInterval);
//     afl = new aflSlide();
//     afl.init();
//   }
// }, 500);

$j = $.noConflict();
afl = new aflSlide();
afl.init();

function aflSlide(){
  this.container = "";
  this.mediaHolder = "";
  this.infoBar = "";
  this.mediaObjects = [];
  this.current = 0;
  this.last = 0;
  this.scrollDelay = 200;
  this.initialized = false;
  var self = this;


  this.init = function(){
    if($j(".fileThumb").length !== this.mediaObjects.length)
      getAllMedia();
    if(this.initialized)
      return;
    this.container = createContainerDiv();
    this.mediaHolder = createMediaHolder();
    this.infoBar = createInfoBar();
    this.current = 0;
    this.initialized = true;
  };

  function createInfoBar(){
    var infoContainer = $j("<div>").css({
      position: "absolute",
      backgroundColor: "black",
      opacity: 0.7,
      right: 0,
      top: 0,
      "text-align": "right",
      "padding-right": "15px",
    });
    var infoCounter = $j("<span>").css({
      "font-size": "26px",
      position: "relative",
      margin: "5px",
      "font-weight": "bold"
    });
    var infoFile = $j("<span>").css({
      display: "block",
      margin: "5px",
      "font-weight": "bold"
    });

    return $j(infoContainer).append(infoCounter).append(infoFile);
  }

  function updateInfo(){
    var infoCounter = $j(self.infoBar).children().first();
    var infoLabel = $j(self.infoBar).children().eq(1);
    $j(infoCounter).text((self.current + 1) + "/" + self.mediaObjects.length);
    $j(infoLabel).text(self.mediaObjects[self.current].fileName);
  }

  this.start = function(i){
    this.init();
    $j("body").append($j(this.container).append(this.infoBar).append(this.mediaHolder));
    this.current = i || 0;
    this.setMedia(this.current);
    this.scrollToPost(this.current);
    $j(this.container).fadeIn();
    updateInfo();
    $j(document).bind("keyup",keyBinding);
    $j(window).bind("resize",windowResizeEvent);
  };

  function windowResizeEvent(){
    if(screen.height == window.innerHeight && screen.width == window.innerWidth){
      $j("body").css("overflow","hidden");
    }else{
      $j("body").css("overflow","");
    }
  }

  function keyBinding(e){
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

  this.stop = function(){
    this.dimPost(this.current);
    $j(this.container).fadeOut(function(){
      $j(this.mediaHolder).empty();
      $j(this.container).remove();
    });
    $j(document).unbind("keyup",keyBinding);
    $j(window).unbind("resize",windowResizeEvent);
  };

  this.next = function(){
    if(this.current >= this.mediaObjects.length - 1) return;
    this.last = this.current;
    if(this.mediaObjects[this.current+1] === undefined) this.current++;
    this.current++;
    this.scrollToPost(this.current);
    this.setMedia(this.current);
    updateInfo();
    if(this.current < this.mediaObjects.length - 1 && this.mediaObjects[this.current].img && this.mediaObjects[this.current].img.completed){
      this.preloadMedia(this.current+1);
    }
  };

  this.prev = function(){
    if(this.current <= 0) return;
    if(this.mediaObjects[this.current-1] === undefined) this.current--;
    this.last = this.current;
    this.current--;
    this.scrollToPost(this.current);
    this.setMedia(this.current);
    updateInfo();
  };

  function getAllMedia(){
    $j(".fileThumb").each(function(i,e){
      if($j(e).prop("href") === "" || $j(e).prop("href") === undefined) return;
      self.mediaObjects[i] = {
        src: $j(e).prop("href"),
        type: $j(e).prop("href").indexOf("webm") != -1 ? "video" : "img",
        top: $j(e).offset().top,
        parentHeight: $j(e).parents(".post.reply").height(),
        parent: $j(e).parents(".post.reply"),
        fileName: $j(e).siblings(".fileText").children("a").text(),
        message: $j(e).parents(".file").siblings(".postMessage").text()
      };
      $j(e).removeAttr("href").click(function(){
        self.start(i);
      });
    });
  }

  this.setMedia = function(i){
    var mo = this.mediaObjects[i];
    if(!mo.img){
      var img =$j("<"+mo.type+">").get(0);
      mo.img = img;
      if(mo.img.tagName == "VIDEO"){
        $j(mo.img).append($j("<source>",{src:mo.src,type:"video/webm"}));
        mo.img.setAttribute("autoplay","");
        mo.img.setAttribute("controls","");
        mo.img.setAttribute("name","media");
      }else{
        mo.img.src = mo.src;
      }
    }

    $j(mo.img).css("height","100%").click(function(){
      self.next();
    }).contextmenu(function(){
      self.prev();
      return false;
    });

    if(mo.img.completed && !this.mediaObjects[this.current+1].img){
      this.preloadMedia(this.current+1);
    }else{
      $j(mo.img).load(function(){
        self.preloadMedia(self.current+1);
      });
    }
    $j(this.mediaHolder).empty()
                        .append(mo.img);
    setPostMessage(mo.img);
  };

  function setPostMessage(img){
    if(!img.offsetWidth){
      setTimeout(function(){
        setPostMessage(img);
      },200);
      return;
    }
    var messageContainer = $j("<div>").css({
      position: "absolute",
      bottom: 0,
      width: img.offsetWidth,
      textAlign: "center",
      left: img.offsetLeft,
      backgroundColor: "black",
      "opacity": 0.6,
      fontSize: "16px"
    }).text(self.mediaObjects[self.current].message);
    $j(self.mediaHolder).append(messageContainer);
  }

  function createMediaHolder(){
    var mediaHolder = $j("<div>");
    $j(mediaHolder).css({
      margin:"auto",
      textAlign:"center",
      width: "100%",
      height: "100%"
    });
    return mediaHolder;
  }

  this.preloadMedia = function(i){
    var mo = this.mediaObjects[i]
    if(mo.img) return;
    if(mo.type === "img"){
      mo.img = new Image();
      mo.img.src = mo.src;
    }else{
      mo.img = $j("<video>").append($j("<source>").attr("src",mo.src)).get(0);
      mo.img.setAttribute("autoplay","");
      mo.img.setAttribute("controls","");
      mo.img.setAttribute("name","media");
    }
  };

  this.scrollToPost = function(i){
    this.dimPost(this.last);
    var sm = screen.availHeight / 2;
    var pm = this.mediaObjects[i].parentHeight / 2;
    $j("body").animate({
      scrollTop: this.mediaObjects[i].top - sm + pm
    },this.scrollDelay,function(){
      self.highlightPost(i);
    });
  };

  this.dimPost = function(i){
    $j(this.mediaObjects[i].parent).css({
      backgroundColor: ""
    });
  };

  this.highlightPost = function(i){
    $j(this.mediaObjects[i].parent).css({
      backgroundColor: "cyan"
    });
  };

  function createContainerDiv(){
    var cont = $j("<div>");
    $j(cont).css({
      position: "fixed",
      height: "100%",
      width: "100%",
      top: "0",
      left: "0",
      backgroundColor: "rgba(0,0,0,0.9)",
      zIndex: "99",
      display: "none",
      color:"white"
    });

    $j(cont).click(function(e){
      if(e.target.tagName === "IMG" || e.target.tagName == "VIDEO") return;
      self.stop();
    });
    return cont;
  }
}
