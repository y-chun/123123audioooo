var cxt_arc = wx.createCanvasContext('canvasArc');
var interval;
var varName;
var mediaAnimate;
const backgroundAudioManager = wx.getBackgroundAudioManager();
var waiting;
Page({
  data: {
    list: {},
    choose:'',
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
    audioLoad:false,
    time:0,
    firstPlay:false
  },

  onLoad() {
    wx.onNetworkStatusChange(this.listenNetworkStatusChange);
    let that = this;
    wx.getNetworkType({
      success: function (res) {
        let networkType = res.networkType;
        that.netWorkTypeFun(networkType);
      }
    })
    this.getList();

    backgroundAudioManager.onEnded(this.endNext);
    backgroundAudioManager.onPause(this.listenPause);
    backgroundAudioManager.onWaiting(this.listenWaiting);
    backgroundAudioManager.onError(this.listenError)
    backgroundAudioManager.onTimeUpdate(() => {
      this.setData({
        time: Math.floor(backgroundAudioManager.duration),
        audioLoad: false
      })
      this.drawCircle();
      // console.log(waiting)
      clearTimeout(waiting)
    })


    backgroundAudioManager.onPlay(() => {
      // this.drawCircle()
      console.log(123);
      this.stopAnimate();
      this.loopRotate();
    })
    // backgroundAudioManager.onCanplay(() => {
    //   console.log(backgroundAudioManager.duration)
    // })
    this.startAnimate()
  },
  listenError(errCode){
    console.log(errCode)
    // let
  },
  listenNetworkStatusChange(params){
    const { isConnected, networkType} = params;
    if (!isConnected){
      wx.showLoading({
        title: '当前无网络，请退出重进',
      })
    }
    this.netWorkTypeFun(networkType);  
    
    setTimeout(() => { wx.hideLoading()},3000)
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
        let { tabs, album } = res.data.body;
        let { list, choose, tabPlayNum } = that.data;
        let chooseID = '';
        if(choose){
          chooseID = choose;
        }else{
          that.setData({
            choose: tabs[0].id
          })
          chooseID = tabs[0].id
        }
        list[chooseID] = album.list;
        
        if (!Reflect.has(tabPlayNum, chooseID)){
          tabPlayNum[chooseID] = 0;
        }

        let NowSong = album.list[0]
        that.setData({
          tabs: tabs,
          list: list,
          tabPlayNum: tabPlayNum,
          playImg: NowSong.cove,
          playCnName: NowSong.cn_name,
          playEnName: NowSong.en_name,
          firstPlay:true
        });
        wx.hideLoading();
        that.drawCircle(true)
        // that.play();
      },
      fail(){
        wx.hideLoading();
        wx.showLoading({
          title: '网络错误',
        });
        setTimeout(() => { wx.hideLoading() }, 3000)
      }
    })
  },
  drawCircle(defualt=false){
    
    // clearInterval(varName);
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
    var animation =  ()=> {
      let drawStep  = backgroundAudioManager.currentTime;
      var n = this.data.time;
      if (drawStep <= n) {
        console.log(drawStep)
          endAngle = drawStep * 2 * Math.PI / n + 1.5 * Math.PI;
          drawArc(startAngle, endAngle);  
        // this.setData({
        //   drawStep: drawStep+1
        // });
      } else {
        clearInterval(varName);
      }
    };
    if (defualt){
      // console.log(1)
      drawArc(startAngle, startAngle);
    }else{
      // console.log(2)
      animation();
    }
    
  },
  onUnload(){
    backgroundAudioManager.pause()
  },
  onShow(e) {
    const {play} = this.data;
    if(play){
      this.loopRotate();
    }
  },

  listenWaiting(){
    this.setData({
      audioLoad: true
    })
    clearTimeout(waiting)
    waiting = setTimeout(function(){
      wx.showLoading({
        title: '网络连接超时',
      })
    },5000);
  
  },
  startAnimate(){
    this.animation = wx.createAnimation({
      duration: 1400,
      timingFunction: 'linear',
      delay: 0,
      transformOrigin: '50% 50% 0',
      success: function (res) {

      }
    })
  },
  onHide() {
    // clearInterval(mediaAnimate)
    this.stopAnimate();
  },

  onReady() {
  },

  /**
   * 音频结束回调函数 
   */
  endNext(){
    let { model, tabPlayNum,choose,list} = this.data;
    let nextPlayNum = tabPlayNum[choose];
    let nextListLength = list[choose].length-1;
    if(model==='list'){
      if (nextPlayNum == nextListLength){
        tabPlayNum[choose] = 0;
      }else{
        tabPlayNum[choose] = nextPlayNum + 1;
      }
      this.setData({
        tabPlayNum: tabPlayNum
      })
      
    }
    clearInterval(varName);
    clearInterval(mediaAnimate);
    this.stopAnimate();
    setTimeout(()=>{this.play();},100)
  },

  /**
   * 光盘旋转动画函数
   */
  loopRotate(){
    clearInterval(mediaAnimate)
   
    this.setRouteAnimate()
    mediaAnimate = setInterval(() => {
      this.setRouteAnimate()
    }, 1400)
  },

  /**
   * 光盘旋转动画设置函数
   */
  rotateAni(n) {
    // console.log(n)
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
    clearInterval(mediaAnimate);
    let { list, tabPlayNum,choose} = this.data;
    let playNum = tabPlayNum[choose]
    let NowSong = list[choose][playNum]
    this.setData({
      play:true,
      playImg: NowSong.cove,
      playCnName: NowSong.cn_name,
      playEnName: NowSong.en_name,
    })
    this.setBackgroundInfo(NowSong.cn_name, NowSong.cove)
    backgroundAudioManager.src = NowSong.source// 设置了 src 之后会自动播放 
  },
  setBackgroundInfo(name,cove){
    backgroundAudioManager.title = name;
    backgroundAudioManager.epname = name;
    backgroundAudioManager.coverImgUrl = cove;
  },
  playAction(){
    this.setData({
      play: true,
      audioLoad: true
    })
    const {firstPlay} = this.data;
    if(firstPlay){
      this.play();
    }else{
      let { list, tabPlayNum, choose } = this.data;
      let Num = tabPlayNum[choose];
      let continuePlaySong = list[choose][Num];
      this.setBackgroundInfo(continuePlaySong.cn_name, continuePlaySong.cover);
      backgroundAudioManager.play();
    }
  },
  pauseAction(){
    this.pause();
  },

  /**
   * 暂停音频
   */
  pause(firstPlay=false) {
    backgroundAudioManager.pause()
    // clearInterval(varName);
    // clearInterval(mediaAnimate);
    this.setData({
      animation: this.animation.export()
    })
    this.setData({
      play: false,
      firstPlay: firstPlay
    })
    this.stopAnimate();
  },
  tabsAlbum(e){
    let tabID = e.target.dataset.id;
    let {list,choose} = this.data;
    let hasID = Reflect.has(list, tabID);

    this.setData({
      choose: tabID
    })
    clearInterval(mediaAnimate);
    this.stopAnimate();
    if(!hasID){ 
      this.getList();
    }else{
      let { list, tabPlayNum, choose } = this.data;
      console.log(choose)
      let playNum = tabPlayNum[choose]
      let NowSong = list[choose][playNum];
      this.setData({
        playImg: NowSong.cove,
        playCnName: NowSong.cn_name,
        playEnName: NowSong.en_name,
      })
    }
    this.pause(true);
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

    this.pause();
    setTimeout(() => { this.play();},100)
    
  },

  stopAnimate(){
    clearInterval(mediaAnimate)
    var animation = wx.createAnimation({
      duration: 0,
      timingFunction: 'step-end',
      delay: 0,
      transformOrigin: '50% 50% 0',
      success: function (res) {
      }
    })

    animation.rotate(0).step();
    this.setData({
      animation: animation.export()
    })
    this.setData({
      animateNum: 1
    })
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