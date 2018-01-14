var cxt_arc = wx.createCanvasContext('canvasArc');
var interval;
var varName;
var mediaAnimate;
const backgroundAudioManager = wx.getBackgroundAudioManager()
Page({
  data: {
    list: {},
    choose:'1',
    animation: '',
    animateNum: 1,
    size: 1,
    play:false,
    tabs:[],
    nowSong:{},
    tabPlayNum:{},
    playImg:"",
    playCnName:"",
    playEnName:"",
    model:"list",
    drawStep:0,
    pauseStep:0,
    currentTime:0,
    audioLoad:false
  },
  onLoad() {
    wx.onNetworkStatusChange(this.listenNetworkStatusChange);
    let that = this;
    wx.getNetworkType({
      success: function (res) {
        // 返回网络类型, 有效值：
        // wifi/2g/3g/4g/unknown(Android下不常见的网络类型)/none(无网络)
        let networkType = res.networkType;
        that.netWorkTypeFun(networkType);
      }
    })
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
    this.getList();
   
    // this.drawCircle(10)
  },
  listenNetworkStatusChange(params){
    const { isConnected, networkType} = params;
    
    console.log(isConnected)
    if (!isConnected){
      wx.showLoading({
        title: '当前无网络，请退出重进',
      })
    }
    this.netWorkTypeFun(networkType);  
    
  },
  netWorkTypeFun(networkType){
    if (networkType === '2g' || networkType === '3g') {
      wx.showLoading({
        title: '当前网络慢',
      })
    }
  },
  getList(){
    wx.showLoading({
      title:'加载中',
    })
    let that = this;
    wx.request({
      url: "https://www.easy-mock.com/mock/59f8115cffe61f7a1d987d2b/newapp/list",
      method: "GET",
      success(res) {
        console.log(res)
        let { tabs, album } = res.data.body;
        let { list, choose, tabPlayNum } = that.data;
        let chooseID=choose;
        console.log(chooseID)
        list[chooseID] = album.list;
        if (!Reflect.has(tabPlayNum, chooseID)){
          tabPlayNum[chooseID] = 0;
        }
        that.setData({
          tabs: tabs,
          list: list,
          tabPlayNum: tabPlayNum
          // newSong:album.list[0]
        })
        wx.hideLoading()
        that.play()
      }
    })
  },
  drawCircle(num){
    
    clearInterval(varName);
    var drawArc = (s, e) => {
      cxt_arc.setLineWidth(4);
      cxt_arc.setStrokeStyle('#d2d2d2');
      cxt_arc.setLineCap('round')
      cxt_arc.beginPath();
      cxt_arc.arc(50, 50, 46, 0, 2 * Math.PI, false);
      cxt_arc.stroke();

      cxt_arc.setLineWidth(4);
      cxt_arc.setStrokeStyle('#9fe3f4');
      cxt_arc.setLineCap('round')
      cxt_arc.beginPath();
      cxt_arc.arc(50, 50, 46, s, e, false);
      cxt_arc.stroke();

      cxt_arc.draw();
    }
   var startAngle = 1.5 * Math.PI, endAngle = 0;
    var animation_interval = 1000, n = num;
    var animation =  ()=> {
      let { drawStep } = this.data;
      if (drawStep <= n) {
        // if(clear){
        //   endAngle = startAngle
        // }else{
          endAngle = drawStep * 2 * Math.PI / n + 1.5 * Math.PI;
        // }
        drawArc(startAngle, endAngle);
        this.setData({
          drawStep: drawStep+1
        });
      } else {
        clearInterval(varName);
      }
    };
    varName = setInterval(animation, animation_interval);
  },
  onShow(e) {

    backgroundAudioManager.onEnded(this.endNext);
    backgroundAudioManager.onPause(this.listenPause); 
    backgroundAudioManager.onWaiting(this.listenWaiting)
    this.animation = wx.createAnimation({
      duration: 1400,
      timingFunction: 'linear',
      delay: 0,
      transformOrigin: '50% 50% 0',
      success: function (res) {

      }
    })
 
  },
  listenPause(){
    let currentTime = backgroundAudioManager.currentTime;
    this.setData({
      currentTime: currentTime
    })
    console.log(backgroundAudioManager.currentTime);
  },
  listenWaiting(){
    this.setData({
      audioLoad: true
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
  endNext(){
    let { model, tabPlayNum,choose} = this.data;
    let nextPlayNum = tabPlayNum[choose]
    if(model==='list'){
      tabPlayNum[choose] = nextPlayNum+1
      this.setData({
        tabPlayNum: tabPlayNum
      })
    }
    this.setData({
      drawStep:0,
      currentTime:0
    })
    this.play();

  },

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
    let { list, tabPlayNum, currentTime, drawStep,choose} = this.data;
    let playNum = tabPlayNum[choose]
    let NowSong = list[choose][playNum]
    // console.log(drawStep)
    this.loopRotate();

    this.setData({
      play:true,
      playImg: NowSong.cove,
      playCnName: NowSong.cn_name,
      playEnName: NowSong.en_name,
      drawStep: currentTime,
      audioLoad:true
    })
    console.log(NowSong.source)
    backgroundAudioManager.src = NowSong.source // 设置了 src 之后会自动播放

    backgroundAudioManager.onPlay(()=>{
      setTimeout(()=> { 
        console.log(backgroundAudioManager.duration);
        let time = Math.ceil(backgroundAudioManager.duration);
        this.setData({
          audioLoad:false
        })
        this.drawCircle(time)
        },100)
    })
   
  },

  /**
   * 暂停音频
   */
  pause() {
    backgroundAudioManager.pause()
    clearInterval(varName);
    clearInterval(mediaAnimate);
    this.setData({
      animation: this.animation.export()
    })
    this.setData({
      drawStep:0,
      currentTime:0,
      play: false
    })
    console.log()
    this.drawCircle()//重绘播放进度条
  },
  tabsAlbum(e){
    // console.log(e)
    let tabID = e.target.dataset.id
    let {list,choose} = this.data;
    let hasID = Reflect.has(list, tabID)
    // console.log(hasID)
    this.setData({
      choose: tabID,
      drawStep:0,
      currentTime:0
    })
    clearInterval(mediaAnimate)
    if(!hasID){ 
      this.getList();
    }else{
      this.play();
    }
  },
  /**
   * 切换音频
   */
  next(){
    let { tabPlayNum, list,choose} = this.data;
    let playNum = tabPlayNum[choose]
    if (playNum === list[choose].length-1){
      tabPlayNum[choose] = 0;
    }else{
      tabPlayNum[choose] = playNum+1;  
    }
    this.setData({
      tabPlayNum: tabPlayNum
    }); 
    this.pause()
    this.play()
  },
  switchOne(){
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