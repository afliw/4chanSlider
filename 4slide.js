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

    this.init = function () {
        checkForUpdates();
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
        return $j(infoContainer);
    }

    function updateInfo() {
        var mediaInfo = self.mediaObjects[self.current];
        var infoCounter = $j("<div>", {
            class: "slide",
            id: "info-counter",
            text: (self.current + 1) + "/" + self.mediaObjects.length
        });
        var infoFilename = $j("<div>", {
            class: "slide info-file",
            text: mediaInfo.fileName
        });
        var infoFileProperties = $j("<div>", {
            class: "slide info-file",
            text: mediaInfo.fileInfo
        });
        var infoLink = $j("<div>", {
            class: "slide",
            id: "info-link",
            text: "Copy URL",
            "data-url": mediaInfo.src
        }).click(copyLink);
        var infoCopyImage = $j("<div>", {
            class: "slide",
            id: "info-copyImage",
            "data-url": mediaInfo.src,
            text: "Copy Image"
        }).click(copyImage);
        var sarchLink = $j("<div>", {
            class: "slide",
            id: "search-link",
            text: "Reverse Search",
            "data-url": mediaInfo.src
        }).click(reverseSearch);
        $j(self.infoBar).empty().append(infoCounter, infoFilename, infoFileProperties, infoLink, infoCopyImage, sarchLink);
    }

    function reverseSearch(e) {
        e.stopPropagation();
        var searchUrl = "https://www.google.com/searchbyimage?image_url=" + $j(this).data("url");
        window.open(searchUrl, "_blank");
    }

    function copyLink(e) {
        e.stopPropagation();
        var hi = $j("<input>", {
            type: "text",
            value: $j(this).data("url"),
            style: "display:block;position:abosulute;top:0;left:0"
        });
        $j(self.container).append(hi);
        hi.get(0).select();
        showToastMessage(document.execCommand("copy") ? "URL copied to clipboard" : "Copy failed");
        hi.remove();
    }

    function copyImage(e) {
        e.stopPropagation();
        //showToastMessage("Not implemented.");
        var imageElement = $j(".slide#media-holder>img").get(0);
        $j(imageElement).attr("contenteditable", true);
        selectText(imageElement);
        showToastMessage(document.execCommand("copy") ? "Image copied to clipboard" : "Copy failed");
        window.getSelection().removeAllRanges();
        $j(imageElement).removeAttr("contenteditable");
    }

    function showToastMessage(msg) {
        $j(".slide#toast-message").stop().remove();
        var tmsg = $j("<div>", {
            class: "slide",
            id: "toast-message",
            text: msg,
            style: "display:none"
        });
        $j(self.container).append(tmsg);
        tmsg.fadeIn(function () {
            var el = this;
            setTimeout(function () {
                $j(el).fadeOut(function () {
                    $j(this).remove();
                })
            }, 2000)
        });
    }

    this.start = function (i) {
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

    this.stop = function () {
        this.dimPost(this.current);
        $j(this.container).fadeOut(function () {
            $j(this.mediaHolder).empty();
            $j(this.container).remove();
        });
        $j(document).unbind("keydown", keyBinding);
        $j(window).unbind("resize", windowResizeEvent);
    };

    this.next = function () {
        if (this.current >= this.mediaObjects.length - 1) return;
        this.last = this.current;
        if (this.mediaObjects[this.current + 1] === undefined) this.current++;
        this.current++;
        this.scrollToPost(this.current);
        this.setMedia(this.current);
        updateInfo();
        $j(".navLinks.navLinksBot.desktop a[data-cmd='update']").get(0).click();
        if (this.current < this.mediaObjects.length - 1 && this.mediaObjects[this.current].img && this.mediaObjects[this.current].img.completed) {
            this.preloadMedia(this.current + 1);
        }
    };

    this.prev = function () {
        if (this.current <= 0) return;
        if (this.mediaObjects[this.current - 1] === undefined) this.current--;
        this.last = this.current;
        this.current--;
        this.scrollToPost(this.current);
        this.setMedia(this.current);
        updateInfo();
    };

    function getAllMedia() {
        $j(".fileThumb").each(function (i, e) {
            if ($j(e).prop("href") === "" || $j(e).prop("href") === undefined) return;
            self.mediaObjects[i] = {
                src: $j(e).prop("href"),
                type: $j(e).prop("href").indexOf("webm") != -1 ? "video" : "img",
                top: $j(e).offset().top,
                parentHeight: $j(e).parents(".post.reply").height() || $j(e).height(),
                parent: $j(e).parents(".post.reply"),
                fileName: $j(e).siblings(".fileText").children("a").text(),
                message: $j(e).parents(".file").siblings(".postMessage").text(),
                fileInfo: $j(e).siblings(".fileText").children("a").get(0).nextSibling.nodeValue.trim()
            };
            $j(e).removeAttr("href").click(function () {
                self.start(i);
            });
        });
        updateInfo();
    }

    function buildMessage() {

    }

    this.setMedia = function (i) {
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

        $j(mo.img).addClass("vertical-align");

        if (mo.img.completed && !this.mediaObjects[this.current + 1].img) {
            this.preloadMedia(this.current + 1);
        } else {
            $j(mo.img).on("load", function () {
                self.preloadMedia(self.current + 1);
            });
        }
        $j(this.mediaHolder).empty()
            .append(mo.img);

        setImageDimension(mo.img);

        $j(mo.img).click(imgClickHandler).contextmenu(function () {
            self.prev();
            return false;
        }).on("mousewheel", function (e) {
            var dimension = this.style.height !== "" ? "height" : "width";
            var currenDimension = parseInt(this.style[dimension]) || 100;
            if (e.originalEvent.wheelDelta > 0) {
                this.style[dimension] = (currenDimension + self.zoomFactor) + "%";
            } else {
                this.style[dimension] = (currenDimension - self.zoomFactor >= 100 ? currenDimension - self.zoomFactor : 100) + "%";
                this.style.top = 0;
                this.style.left = 0;
            }
            $j(this).unbind("click").removeClass("vertical-align");
            if (this.style[dimension] === "100%") {
                $j(this).bind("click", imgClickHandler).css({
                    top: "",
                    left: ""
                }).addClass("vertical-align");
            }
            $j(".slide#message-container").remove();
            setPostMessage(this);
            e.stopPropagation();
            e.preventDefault();
            return false;
        }).mousedown(function (e) {
            if (this.style.height === "100%" || this.style.width === "100%") return;
            $j(document).mouseup(this, imgMouseUpHandler);
            var eventData = {
                imgTop: parseInt($j(this).get(0).style.top || 0),
                imgLeft: parseInt($j(this).get(0).style.left || 0),
                maxTop: window.innerHeight - parseInt($j(this).get(0).height),
                maxLeft: window.innerWidth - parseInt($j(this).get(0).width),
                moX: e.clientX,
                moY: e.clientY
            };
            $j(this).css("cursor", "-webkit-grabbing")
                .mousemove(eventData, imgMouseMoveHandler);
        });
    };

    function setImageDimension(img) {
        if (img.width === 0) {
            $j(img).css("height", "100%");
            img.onload = setImageDimension;
            return;
        }
        img = img.target || img;
        var objWidth = img.tagName === "VIDEO" ? img.videoWidth : img.width;
        var objHeight = img.tagName === "VIDEO" ? img.videoHeight : img.height;
        var compareWidth = (objWidth * window.innerHeight) / objHeight;
        var compareHeight = (objHeight * window.innerWidth) / objWidth;
        $j(img).css({
            "height": "",
            "width": ""
        });
        $j(img).css(compareWidth > window.innerWidth || compareWidth > compareHeight * 2 ? "width" : "height", "100%");
        $j(img).toggleClass("vertical-align", compareWidth > img.height * 2);
        setPostMessage(img);
    }

    var imgClickHandler = function () {
        self.next();
    };

    function checkForUpdates() {
        var interval = setInterval(function () {
            if ($j(".fileThumb").length !== self.mediaObjects.length) {
                getAllMedia();
            }
        }, 1000);
    }

    var imgMouseUpHandler = function (e) {
        $j(e.data).unbind("mousemove").css("cursor", "");
        $j(this).unbind("mouseup", imgMouseUpHandler);
    };

    var imgMouseMoveHandler = function (e, eventData) {
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
            setTimeout(function () {
                setPostMessage(img);
            }, 200);
            return;
        }
        var messageContainer = $j("<div>", {
            id: "message-container",
            class: "slide"
        }).css({
            width: img.offsetWidth > window.innerWidth ? window.innerWidth : img.offsetWidth,
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

    this.preloadMedia = function (i) {
        var mo = this.mediaObjects[i];
        if (!mo) return;
        if (mo.img) return;
        if (mo.type === "img") {
            mo.img = new Image();
            $j(mo.img).attr("onload", "ThreadUpdater.forceUpdate()");
            mo.img.src = mo.src;
        } else {
            mo.img = $j("<video>").append($j("<source>").attr("src", mo.src)).get(0);
            mo.img.setAttribute("autoplay", "");
            mo.img.setAttribute("controls", "");
            mo.img.setAttribute("name", "media");
        }
    };

    this.scrollToPost = function (i) {
        this.dimPost(this.last);
        var sm = screen.availHeight / 2;
        var pm = this.mediaObjects[i].parentHeight / 2;
        $j("html, body").animate({
            scrollTop: this.mediaObjects[i].top - sm + pm
        }, this.scrollDelay, function () {
            self.highlightPost(i);
        });
    };

    this.dimPost = function (i) {
        $j(".slide.highlighted-post").removeClass("slide highlighted-post");
    };

    this.highlightPost = function (i) {
        $j(this.mediaObjects[i].parent).addClass("slide highlighted-post");
    };

    function createContainerDiv() {
        var cont = $j("<div>", {
            id: "main-container",
            class: "slide"
        });
        $j(cont).click(function (e) {
            if (e.target.tagName === "IMG" || e.target.tagName == "VIDEO") return;
            self.stop();
        });
        return cont;
    }

    function selectText(element) {
        var doc = document;
        if (doc.body.createTextRange) {
            var range = document.body.createTextRange();
            range.moveToElementText(element);
            range.select();
        } else if (window.getSelection) {
            var selection = window.getSelection();
            var range = document.createRange();
            range.selectNodeContents(element);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
}