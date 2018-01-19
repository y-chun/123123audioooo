var cxt_arc = wx.createCanvasContext('canvasArc');
// var interval;
var varName;
var mediaAnimate;//转盘动画对象
const backgroundAudioManager = wx.getBackgroundAudioManager();//
var animateNum = 1;//转盘圈数
// var waiting;
Page({
  data: {
    list: {},//数据列表
    choose:'',//当前选择tab id
    animation: '',
    animateNum: 1,//旋转圈数
    size: 1,
    play: false,//播放状态
    tabs: [],//tab列表
    nowSong: {},
    tabPlayNum: {},//记录每个列表播放到哪个歌曲
    model: 'list',//当前模式
    audioLoad: false,//歌曲加载标志
    time: 0,
    firstPlay: false,//判断歌曲是否第一次播放
    errorNum: 0,//歌曲加载失败次数
    playFlag: false,//歌曲第一次播放标志
    onePlay: false,//用来限制onPlay事件触发内容次数
    isShowToast:false,
    toastText:'111',
  },

  onLoad() {
    let that = this;
    let model = wx.getStorageSync('model');

    if (model === 'one') {
      this.setData({
        model: 'one'
      })
    } else if (model === 'list') {
      this.setData({
        model: 'list'
      })
    }//

    wx.getSystemInfo({
      success(res) {
        that.setData({
          size: res.windowWidth / 750
        })
      }
    })
    this.getList('https://easy-mock.com/mock/59f8115cffe61f7a1d987d2b/newapp/list');
    wx.onNetworkStatusChange(this.listenNetworkStatusChange);
    backgroundAudioManager.onEnded(this.endNext);
    backgroundAudioManager.onPause(this.listenPause);
    backgroundAudioManager.onWaiting(this.listenWaiting);
    backgroundAudioManager.onError(this.listenError);
    backgroundAudioManager.onTimeUpdate(this.listenTimeUpdate);
    backgroundAudioManager.onPlay(this.listenPlay);
    this.startAnimate();
    wx.reportAnalytics('start_num', {
    });//上报启动次数
  },

  /**
   * 监听播放进度执行函数
   */
  listenTimeUpdate() {
    this.setData({
      time: Math.floor(backgroundAudioManager.duration),
      audioLoad: false
    })
    this.drawCircle();
    // clearTimeout(waiting);
  },

  /**
   * 监听播放执行函数
   */
  listenPlay() {
    const { playFlag, onePlay, choose, nowSong } = this.data;

    if (playFlag) {
      this.setData({
        playFlag: false
      })

      wx.getNetworkType({
        success(res) {
          var networkType = res.networkType;
          wx.reportAnalytics('play_origin', {
            origin: networkType,
          });//上报播放来源数据
        }
      })//待修改

      wx.reportAnalytics('play_success', {
        id: choose,
        song_name: nowSong.cn_name,
      });
    }
    if (onePlay) {
      this.loopRotate();
      this.setData({
        play: true,
        onePlay: false
      })
    }
  },

  /**
   * 判断网络错误
   */
  listenError(info) {
    let { errorNum } = this.data;
    let that = this;
    if (errorNum) {
      wx.showModal({
        title: '提示',
        content: `播放失败，原因：${info.errCode}`,
        confirmText: '刷新',
        success(res) {
          if (res.confirm) {
            that.play()
          }
        }
      });

      this.setData({
        errorNum: 0,
        audioLoad:false
      });

      wx.reportAnalytics('play_error_two', {
      });//上报第二次播放失败数据

    } else {
      this.setData({
        errorNum: 1,
        audioLoad: false
      })

      wx.reportAnalytics('play_error_one', {
      });//上报第一次播放失败数据

      backgroundAudioManager.src = info.src// 设置了 src 之后会自动播放 
    }

    wx.reportAnalytics('play_error_code', {
      errcode: info.errCode,
    });//上报播放失败原因
  },

  /**
   * 监听网络状态执行函数
   */
  listenNetworkStatusChange(params) {
    const { isConnected, networkType } = params;
    if (!isConnected) {
      wx.showToast({
        image:'../../images/warn.png',
        title: '当前网络已断开',
      })
    }
    this.netWorkTypeFun(networkType);

    setTimeout(() => {
       wx.hideLoading();
       wx.hideToast();
     }, 3000)
  },

  /**
   * 判断网络慢并提示
   */
  netWorkTypeFun(networkType) {
    if (networkType === '2g') {
      wx.showLoading({
        title: '当前网络慢',
      })
    }
  },

  /**
   * 获取歌曲列表
   */
  getList(url) {
    wx.showLoading({
      title: '加载中',
    })
    let that = this;
    wx.request({
      url: url,
      method: "GET",
      success(res) {
        console.log(res)
        let { tabs, album, defaultTabId } = res.data.body;
        let { list, choose, tabPlayNum } = that.data;
        let chooseID = '';
        if (choose=='') {
          chooseID = choose;
        } else {
          that.setData({
            choose: defaultTabId
          });
          chooseID = defaultTabId;
        }
        list[chooseID] = album.list;

        if (!Reflect.has(tabPlayNum, chooseID)) {
          tabPlayNum[chooseID] = 0;
        }
        // if (album.list.length){
          
        // }
        let NowSong = album.list[0];
        that.setData({
          tabs: tabs,
          list: list,
          tabPlayNum: tabPlayNum,
          nowSong: NowSong,
          firstPlay: true
        });
        wx.hideLoading();
        that.drawCircle(true);
        // that.play();
        // console.log(that.data.nowSong)
      },
      fail() {
        wx.hideLoading();
        wx.showLoading({
          title: '网络错误',
        });
        setTimeout(() => { wx.hideLoading() }, 3000);
      }
    })
  },

  /**
   * 绘制进度条
   */
  drawCircle(defualt = false) {
    const { size } = this.data
    var drawArc = (s, e,eb) => {
      cxt_arc.setLineWidth(Math.floor(size * 10));
      cxt_arc.setStrokeStyle('#f1f1f1');
      cxt_arc.setLineCap('round')
      cxt_arc.beginPath();
      cxt_arc.arc(Math.floor(size * 200) / 2, Math.floor(size * 200) / 2, Math.floor(size * 182) / 2, 0, 2 * Math.PI, false);
      cxt_arc.stroke();

      cxt_arc.setLineWidth(Math.floor(size * 10));
      cxt_arc.setStrokeStyle('#e3e3e3');
      cxt_arc.setLineCap('round')
      cxt_arc.beginPath();
      cxt_arc.arc(Math.floor(size * 200) / 2, Math.floor(size * 200) / 2, Math.floor(size * 182) / 2, s, eb, false);
      cxt_arc.stroke();

      cxt_arc.setLineWidth(Math.floor(size * 10));
      cxt_arc.setStrokeStyle('#9fe3f4');
      cxt_arc.setLineCap('round')
      cxt_arc.beginPath();
      cxt_arc.arc(Math.floor(size * 200) / 2, Math.floor(size * 200) / 2, Math.floor(size * 182) / 2, s, e, false);
      cxt_arc.stroke();

      cxt_arc.draw();
    }
    var startAngle = 1.5 * Math.PI, endAngle = 0;
    var animation = () => {
      console.log(backgroundAudioManager.buffered)
      let drawStep = backgroundAudioManager.currentTime || 0.1;
      let drawBuffer = backgroundAudioManager.buffered||0.1;
      var n = this.data.time;
      if (drawStep <= n) {
        endAngle = drawStep * 2 * Math.PI / n + 1.5 * Math.PI;
        var ebAngle = drawBuffer * 2 * Math.PI / n + 1.5 * Math.PI;
        drawArc(startAngle, endAngle, ebAngle);
      }
    };
    if (defualt) {
      drawArc(startAngle, startAngle, startAngle);
    } else {
      animation();
    }

  },

  onUnload() {
    backgroundAudioManager.pause()
  },

  /**
   * 界面显示调用
   */
  onShow(e) {
    this.stopAnimate();
    const { play } = this.data;
    if (play) {
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
  listenWaiting() {
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

  /**
   * 初始化转盘动画
   */
  startAnimate() {
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
    clearInterval(mediaAnimate);
    // clearTimeout(waiting);
    this.stopAnimate();
  },

  onReady() {
  },

  /**
   * 音频结束回调函数 
   */
  endNext() {
    let { model, tabPlayNum, choose, list, nowSong } = this.data;
    let getPlayNum = tabPlayNum[choose];
    let nextListLength = list[choose].length - 1;

    if (model === 'list') {
      if (getPlayNum == nextListLength) {
        tabPlayNum[choose] = 0;
      } else {
        tabPlayNum[choose] = getPlayNum + 1;
      }
      this.setData({
        tabPlayNum: tabPlayNum
      });
    }

    this.stopAnimate();
    setTimeout(() => { this.play(); }, 100);

    wx.reportAnalytics('play_end', {
      id: choose,
      song_name: nowSong.cn_name,
    });
  },

  /**
   * 光盘旋转动画函数
   */
  loopRotate() {
    clearInterval(mediaAnimate)

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
    animateNum = animateNum + 1
  },

  /**
   * 播放音频
   */
  play() {
    // console.log(2)
    clearInterval(mediaAnimate);
    let { list, tabPlayNum, choose } = this.data;
    let playNum = tabPlayNum[choose];
    let NowSong = list[choose][playNum];
    this.setData({
      nowSong: NowSong,
      playFlag: true,
      onePlay: true
    })
    this.setBackgroundInfo(NowSong.cn_name, NowSong.cover);

    backgroundAudioManager.src = NowSong.source// 设置了 src 之后会自动播放 
  },


  setBackgroundInfo(name, cover) {
    backgroundAudioManager.title = name;
    backgroundAudioManager.epname = name;
    backgroundAudioManager.coverImgUrl = cover;
  },

  playAction() {
    this.setData({
      play: true,
      audioLoad: true
    });
    const { firstPlay } = this.data;
    if (firstPlay) {
      this.play();

      wx.reportAnalytics('start_play', {
      });//上报开始播放数据
    } else {
      this.setData({
        onePlay: true
      })
      backgroundAudioManager.play();

      wx.reportAnalytics('continue_play', {
      });//上报继续播放数据
    }
  },

  pauseAction() {
    this.pause();
  },

  /**
   * 暂停音频
   */
  pause(firstPlay = false) {
    backgroundAudioManager.pause()
    // clearInterval(varName);
    clearInterval(mediaAnimate);
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

  tabsAlbum(e) {
    let tabID = e.target.dataset.id;
    let tabIndex = e.target.dataset.index
    let { list, choose, tabs } = this.data;
    let hasID = Reflect.has(list, tabID);
    this.setData({
      choose: tabID,
      audioLoad:false
    })
    clearInterval(mediaAnimate);
    this.stopAnimate();
    if (!hasID) {
      this.getList(tabs[tabIndex].url);
    } else {
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
  next() {
    let { tabPlayNum, list, choose } = this.data;
    let playNum = tabPlayNum[choose]
    if (playNum === list[choose].length - 1) {
      tabPlayNum[choose] = 0;
    } else {
      tabPlayNum[choose] = playNum + 1;
    }
    this.setData({
      tabPlayNum: tabPlayNum
    });

    this.pause();
    setTimeout(() => { this.play(); }, 100);
    this.drawCircle(true);
    wx.reportAnalytics('next', {
    });//上报下一首数据
  },

  /**
   * 清空转盘动画
   */
  stopAnimate() {
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
    animateNum = 1
  },

  /**
   * 切换到单曲循环
   */
  switchOne() {
    wx.setStorageSync('model', 'one');
    this.setData({
      model: 'one',
      toastText:'开启单曲循环',
      isShowToast:true
    });
    setTimeout(()=>{
      this.setData({
        isShowToast:false
      })
    },1000);
    wx.reportAnalytics('loop_one', {
    });//上报切换到单曲循环次数
  },

  /**
   * 切换到列表循环
   */
  switchList() {
    wx.setStorageSync('model', 'list');
    this.setData({
      model: 'list',
      toastText: '关闭单曲循环',
      isShowToast: true
    });
    setTimeout(() => {
      this.setData({
        isShowToast: false
      })
    }, 1000);
    wx.reportAnalytics('loop_list', {
    });//上报切换到列表循环次数
  }
})