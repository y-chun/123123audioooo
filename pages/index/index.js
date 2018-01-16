var cxt_arc = wx.createCanvasContext('canvasArc');
var interval;
var varName;
var mediaAnimate;
const backgroundAudioManager = wx.getBackgroundAudioManager();
var animateNum = 1
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
    firstPlay:false,
    errorNum:0,
    playFlag:false,
  },

  onLoad() {
    wx.reportAnalytics('start_num', {
    });//上报启动次数
    // wx.onNetworkStatusChange(this.listenNetworkStatusChange);
    // let that = this;
    // wx.getNetworkType({
    //   success: function (res) {
    //     let networkType = res.networkType;
    //     that.netWorkTypeFun(networkType);
    //   }
    // })
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
      console.log(11);
      const { playFlag} = this.data;

      if(playFlag){
        this.setData({
          playFlag:false
        })
        wx.getNetworkType({
          success(res) {
            var networkType = res.networkType;
            wx.reportAnalytics('play_origin', {
              origin: networkType,
            });//上报播放来源数据
          }
        })//待修改
       
      }
      this.stopAnimate();
      this.loopRotate();
      this.setData({
        play:true
      })

     
    })
    // backgroundAudioManager.onCanplay(() => {
    //   console.log(backgroundAudioManager.duration)
    // })
    this.startAnimate()
  },
  listenError(info){
    let {errorNum} = this.data;
    let that = this;
    if(errorNum){
      wx.showModal({
        title:'提示',
        content: `播放失败，原因：${info.errCode}`,
        confirmText:'刷新',
        success(res) {
          if (res.confirm) {
            that.play()
          }
        }
      })
      this.setData({
        errorNum:0
      })
    }else{
      this.setData({
        errorNum: 1
      })
      console.log(info)
      // backgroundAudioManager.src = info.src// 设置了 src 之后会自动播放 
     
    }
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
          endAngle = drawStep * 2 * Math.PI / n + 1.5 * Math.PI;
          drawArc(startAngle, endAngle);  
      } 
    };
    if (defualt){
      drawArc(startAngle, startAngle);
    }else{
      animation();
    }
    
  },

  onUnload(){
    backgroundAudioManager.pause()
  },

  onShow(e) {
    this.stopAnimate();
    const {play} = this.data;
    if(play){
      this.loopRotate();
    }
  },

  listenWaiting(){
    this.setData({
      audioLoad: true
    })
    // clearTimeout(waiting)
    // waiting = setTimeout(function(){
    //   wx.showLoading({
    //     title: '网络连接超时',
    //   })
    // },5000);
  
  },

  startAnimate(){
    this.animation = wx.createAnimation({
      duration: 3000,
      timingFunction: 'linear',
      delay: 0,
      transformOrigin: '50% 50%',
    })
  },

  onHide() {
    clearInterval(mediaAnimate)
    clearTimeout(waiting)
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
    // clearInterval(varName);
    // clearInterval(mediaAnimate);
    wx.reportAnalytics('next', {
    });//上报下一首数据
    this.stopAnimate();
    setTimeout(()=>{this.play();},100)
  },

  /**
   * 光盘旋转动画函数
   */
  loopRotate(){
    // clearInterval(mediaAnimate)
   
    this.setRouteAnimate()
    mediaAnimate = setInterval(() => {
      this.setRouteAnimate()
    }, 3000)
  },

  /**
   * 光盘旋转动画设置函数
   */
  rotateAni(n) {
    // console.log(n)
    this.animation.rotate(180 * (n)).step();
    this.setData({
      animation: this.animation.export()
    })
  },

  /**
   * 连续光盘动画函数
   */
  setRouteAnimate() {
    this.rotateAni(animateNum);
    // this.setData({
    //   animateNum: this.data.animateNum + 1
    // })
    animateNum = animateNum+1
  },

  /**
   * 播放音频
   */
  play() {
    // console.log(2)
    // clearInterval(mediaAnimate);
    let { list, tabPlayNum,choose} = this.data;
    let playNum = tabPlayNum[choose]
    let NowSong = list[choose][playNum]
    this.setData({
      playImg: NowSong.cove,
      playCnName: NowSong.cn_name,
      playEnName: NowSong.en_name,
      playFlag:true
    })
    this.setBackgroundInfo(NowSong.cn_name, NowSong.cove);

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
      wx.reportAnalytics('start_play', {
      });//上报开始播放数据
    }else{
      wx.reportAnalytics('continue_play', {
      });//上报继续播放数据
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
    wx.reportAnalytics('pause', {
    });//上报暂停数据
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
    wx.reportAnalytics('column_num', {
      id: tabID,
    });//上报栏目点击次数数据
    this.drawCircle(true);
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
    wx.reportAnalytics('next', {
    });//上报下一首数据
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
    // this.setData({
    //   animateNum: 1
    // })
    animateNum=1
  },
  
  switchOne(){
    wx.reportAnalytics('loop_one', {
    });//上报切换到单曲循环次数
    this.setData({
      model: 'one'
    });  
  },

  switchList(){
    wx.reportAnalytics('loop_list', {
      model: '',
    });//上报切换到列表循环次数
    this.setData({
      model: 'list'
    });
  }
})