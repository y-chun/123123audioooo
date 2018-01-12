var cxt_arc = wx.createCanvasContext('canvasArc');
var interval;
var varName;
var mediaAnimate;
const backgroundAudioManager = wx.getBackgroundAudioManager()
Page({
  data: {
    list: [],
    animation: '',
    animateNum: 1,
    size: 1,
    play:false,
    tabs:[],
    nowSong:{},
    playNum:0,
    playImg:"",
    playCnName:"",
    playEnName:"",
    model:"list"
  },
  onLoad() {
    let that = this;  
    // wx.getSystemInfo({
    //   success: function (res) {
    //     console.log(res.pixelRatio)
    //     console.log(res.windowWidth)
    //     that.setData({
    //       size: res.windowWidth / 750
    //     })
    //     console.log(that.data.size)
    //   }
    // })
    wx.request({
      url: "http://rap2api.taobao.org/app/mock/3670/GET/api/player",
      method: "GET",
      success(res) {
        // console.log(data)
        let { tabs, album } = res.data.body
        that.setData({
          tabs:tabs,
          list:album.list,
          // newSong:album.list[0]
        })
        // that.play()
      }
    })
   
    clearInterval(varName);
    var drawArc = (s, e) => {  
      cxt_arc.setLineWidth(4);
      cxt_arc.setStrokeStyle('#d2d2d2');
      cxt_arc.setLineCap('round')
      cxt_arc.beginPath();  
      cxt_arc.arc(50,50,46, 0, 2 * Math.PI, false);
      cxt_arc.stroke();

      cxt_arc.setLineWidth(4);
      cxt_arc.setStrokeStyle('#9fe3f4');
      cxt_arc.setLineCap('round')
      cxt_arc.beginPath(); 
      cxt_arc.arc(50, 50, 46, s, e, false);
      cxt_arc.stroke();

      cxt_arc.draw();
    }
    var step = 1, startAngle = 1.5 * Math.PI, endAngle = 0;
    console.log(startAngle)
    var animation_interval = 1000, n = 1;
    var animation = function () {
      if (step <= n) {
        endAngle = step * 2 * Math.PI / n + 1.5 * Math.PI;
        drawArc(startAngle, endAngle);
        step++;
      } else {
        clearInterval(varName);
      }
    };
    varName = setInterval(animation, animation_interval);

  },

  onShow(e) {
    // console.log(e)
    // this.loopRotate()
    backgroundAudioManager.onEnded(this.endNext)
    this.animation = wx.createAnimation({
      duration: 1400,
      timingFunction: 'linear',
      delay: 0,
      transformOrigin: '50% 50% 0',
      success: function (res) {
        console.log("res")
      }
    })
  },

  onHide() {
    clearInterval(mediaAnimate)
  },

  onReady() {
  },

  /**
   * 音频结束回调函数 
   */
  endNext(){},

  /**
   * 光盘旋转动画函数
   */
  loopRotate(){
    // clearInterval(mediaAnimate)
   
    this.setRouteAnimate()
    mediaAnimate = setInterval(() => {
      this.setRouteAnimate()
    }, 1400)
  },

  /**
   * 光盘旋转动画设置函数
   */
  rotateAni(n) {
    this.animation.rotate(180 * (n)).step()
    this.setData({
      animation: this.animation.export()
    })
  },

  /**
   * 连续光盘动画函数
   */
  setRouteAnimate() {
    this.rotateAni(this.data.animateNum);
    this.setData({
      animateNum: this.data.animateNum + 1
    })
  },

  /**
   * 播放音频
   */
  play() {
    let { list, playNum} = this.data;

    this.loopRotate();
    this.setData({
      play:true,
      playImg: list[playNum].cove,
      playCnName: list[playNum].cn_name,
      playEnName: list[playNum].en_name
    })
    backgroundAudioManager.src = "http://ws.stream.qqmusic.qq.com/M500001VfvsJ21xFqb.mp3?guid=ffffffff82def4af4b12b3cd9337d5e7&uin=346897220&vkey=6292F51E1E384E061FF02C31F716658E5C81F5594D561F2E88B854E81CAAB7806D5E4F103E55D33C16F3FAC506D1AB172DE8600B37E43FAD&fromtag=46" // 设置了 src 之后会自动播放
    backgroundAudioManager.onPlay(()=>{
      setTimeout(function () { console.log(backgroundAudioManager.duration)},100)
  
    })
   
  },

  /**
   * 暂停音频
   */
  pause() {
    backgroundAudioManager.pause()
    clearInterval(mediaAnimate);
    // this.setData({
    //   animateNum:1
    // })
    this.setData({
      play: false
    })
  },
  
  /**
   * 切换音频
   */
  next(){
    let { playNum, list} = this.data;
    if (playNum===list.length-1){
      this.setData({
        playNum: 0
      });  
    }else{
      this.setData({
        playNum: playNum + 1
      });  
    }
    this.pause()
    this.play()
  },
  switchOne(){
    console.log(1)
    this.setData({
      model: 'one'
    });  
  },
  switchList(){
    this.setData({
      model: 'list'
    });
  }
})