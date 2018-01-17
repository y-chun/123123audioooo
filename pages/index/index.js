var cxt_arc = wx.createCanvasContext('canvasArc');
var interval;
var varName;
var mediaAnimate;
const backgroundAudioManager = wx.getBackgroundAudioManager();
var animateNum = 1
var waiting;
Page({
  data: {
    list: {},//数据列表
    choose:'',//当前选择tab id
    animation: '',
    animateNum: 1,//旋转圈数
    // size: 1,
    play:false,//播放状态
    tabs:[],//tab列表
    nowSong:{
    },
    tabPlayNum:{},//记录每个列表播放到哪个歌曲
    model:'list',//当前模式
    audioLoad:false,//歌曲加载标志
    time:0,
    firstPlay:false,//判断歌曲是否第一次播放
    errorNum: 0,//歌曲加载失败次数
    playFlag: false,//歌曲第一次播放标志
    onePlay:false,//用来限制onPlay事件触发内容次数
  },

  onLoad() {
    wx.reportAnalytics('start_num', {
    });//上报启动次数

    this.getList();
    wx.onNetworkStatusChange(this.listenNetworkStatusChange);
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
      clearTimeout(waiting)
    })

    backgroundAudioManager.onPlay(() => {
      // this.drawCircle()
     
      const { playFlag, onePlay, choose, nowSong} = this.data;
      
      if(playFlag){
        this.setData({
          playFlag:false
        })
        wx.reportAnalytics('play_success', {
          id: choose,
          song_name: nowSong.cn_name,
        });

        wx.getNetworkType({
          success(res) {
            var networkType = res.networkType;
            wx.reportAnalytics('play_origin', {
              origin: networkType,
            });//上报播放来源数据
          }
        })//待修改
       
      }
      // this.stopAnimate();
      // clearInterval(mediaAnimate);
      if (onePlay){
        this.loopRotate();
        this.setData({
          play: true,
          onePlay:false
        })
      }
    })
    this.startAnimate()
  },

  /**
   * 判断网络错误
   */
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
      });
      
      this.setData({
        errorNum:0
      });

      wx.reportAnalytics('play_error_two', {
      });//上报第二次播放失败数据

    }else{
      this.setData({
        errorNum: 1
      })
      console.log(info)

      wx.reportAnalytics('play_error_one', {
      });//上报第一次播放失败数据
      
      // backgroundAudioManager.src = info.src// 设置了 src 之后会自动播放 
    }

    wx.reportAnalytics('play_error_code', {
      errcode: info.errCode,
    });//上报播放失败原因
  },

  /**
   * 监听网络状态
   */
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
  
  /**
   * 判断网络慢并提示
   */
  netWorkTypeFun(networkType){
    if (networkType === '2g') {
      wx.showLoading({
        title: '当前网络慢',
      })
    }
  },

  /**
   * 获取歌曲列表
   */
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
          nowSong:NowSong,
          firstPlay:true
        });
        wx.hideLoading();
        that.drawCircle(true)
        // that.play();
        console.log(that.data.nowSong)
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

  /**
   * 绘制进度条
   */
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

  /**
   * 界面显示调用
   */
  onShow(e) {
    this.stopAnimate();
    const {play} = this.data;
    if(play){
      this.loopRotate();
    }
    
    
    // this.stopAnimate();
    // let isPlay = backgroundAudioManager.paused;
    // if (!isPlay && isPlay != null) {
    //   this.loopRotate();
    //   this.setData({
    //     play: !isPlay
    //   })
    // }
    // if (isPlay) {
    //   this.setData({
    //     play: !isPlay
    //   })
    // }
    // setTimeout(() => { console.log(backgroundAudioManager.paused)},100);
    
  },

  /**
   * 播放等待
   */
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
  console.log('wait')
  },

  /**
   * 初始化转盘动画
   */
  startAnimate(){
    this.animation = wx.createAnimation({
      duration: 3000,
      timingFunction: 'linear',
      delay: 0,
      transformOrigin: '50% 50%',
    })
  },

  /**
   * 界面隐藏调用函数 
   */
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
    let { model, tabPlayNum, choose, list, nowSong} = this.data;
    let getPlayNum = tabPlayNum[choose];
    let nextListLength = list[choose].length-1;

    if(model==='list'){
      if (getPlayNum == nextListLength){
        tabPlayNum[choose] = 0;
      }else{
        tabPlayNum[choose] = getPlayNum + 1;
      }
      this.setData({
        tabPlayNum: tabPlayNum
      });
    }

    this.stopAnimate();
    setTimeout(()=>{this.play();},100);

    wx.reportAnalytics('play_end', {
      id: choose,
      song_name: nowSong.cn_name,
    });
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
    let playNum = tabPlayNum[choose];
    let NowSong = list[choose][playNum];
    this.setData({
      nowSong: NowSong,
      playFlag:true,
      onePlay:true
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
      this.setData({
        onePlay: true
      })
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

      let playNum = tabPlayNum[choose]
      let NowSong = list[choose][playNum];
      this.setData({
        nowSong: NowSong
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

  /**
   * 清空转盘动画
   */
  stopAnimate(){
    clearInterval(mediaAnimate);
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
  
  /**
   * 切换到单曲循环
   */
  switchOne(){
    wx.reportAnalytics('loop_one', {
    });//上报切换到单曲循环次数
    this.setData({
      model: 'one'
    });  
  },

  /**
   * 切换到列表循环
   */
  switchList(){
    wx.reportAnalytics('loop_list', {
    });//上报切换到列表循环次数
    this.setData({
      model: 'list'
    });
  }
})