App({
  globalData: {
    flags: {
      ch0_talked_to_lin: false,
      clue_push_record: false,
      ch1_helped_zhao: false,
      ch1_helped_lin: false,
      ch1_reported: false,
      ch2_kept_evidence: false,
      ch2_side: 'neutral',
      sabotage_count: 0,
      ch3_stood_up: false,
      ch3_mediated: false,
      empathy_score: 0,
      rational_score: 0,
      hostile_score: 0,
      decisive_score: 0,
      ai_interactions: 0,
      ch2_promise_lin: false,
      ch2_talked_to_zhao: false,
      choice_log: []
    },
    currentChapter: 0,
    currentNode: 'start',
    muted: false,
    bgmMuted: false,
    bgmVolume: 0.5,
    currentBgm: '',
    bgmAudio: null,
    // 后端代理地址：由后端调用 DeepSeek，前端不暴露 Key
    // 本地测试：http://localhost:3000（需开启开发者工具"不校验合法域名"）
    apiBaseUrl: 'http://localhost:3000',
    playStartTime: 0,
    totalPlayTime: 0,
    chapterStartTime: 0
  },

  onLaunch() {
    const save = wx.getStorageSync('save');
    if (save) {
      if (save.flags) this.globalData.flags = Object.assign(this.globalData.flags, save.flags);
      if (save.currentChapter != null) this.globalData.currentChapter = save.currentChapter;
      if (save.currentNode) this.globalData.currentNode = save.currentNode;
      if (save.muted != null) this.globalData.muted = save.muted;
      if (save.bgmMuted != null) this.globalData.bgmMuted = save.bgmMuted;
      if (save.totalPlayTime != null) this.globalData.totalPlayTime = save.totalPlayTime;
    }
    this.globalData.playStartTime = Date.now();
    this.globalData.chapterStartTime = Date.now();
  },

  logChoice(choiceText, tone) {
    if (!this.globalData.flags.choice_log) {
      this.globalData.flags.choice_log = [];
    }
    this.globalData.flags.choice_log.push({
      text: choiceText,
      tone: tone,
      chapter: this.globalData.currentChapter,
      time: Date.now()
    });
  },

  getPlaySeconds() {
    const elapsed = Math.floor((Date.now() - this.globalData.playStartTime) / 1000);
    return this.globalData.totalPlayTime + elapsed;
  },

  accumulatePlayTime() {
    if (this.globalData.playStartTime) {
      const elapsed = Math.floor((Date.now() - this.globalData.playStartTime) / 1000);
      this.globalData.totalPlayTime += elapsed;
      this.globalData.playStartTime = Date.now();
    }
  },

  saveGame() {
    this.accumulatePlayTime();
    wx.setStorageSync('save', {
      flags: this.globalData.flags,
      currentChapter: this.globalData.currentChapter,
      currentNode: this.globalData.currentNode,
      muted: this.globalData.muted,
      bgmMuted: this.globalData.bgmMuted,
      totalPlayTime: this.globalData.totalPlayTime
    });
  },

  playBgm(filename) {
    if (this.globalData.bgmMuted) return;
    if (this.globalData.currentBgm === filename && this.globalData.bgmAudio) {
      return;
    }
    this.stopBgm();
    const ctx = wx.createInnerAudioContext();
    ctx.src = '/pages/game/audio/' + filename;
    ctx.loop = true;
    ctx.volume = this.globalData.bgmVolume;
    ctx.onError((err) => {
      console.error('BGM播放失败:', filename, err);
    });
    ctx.onCanplay(() => {
      console.log('BGM播放:', filename);
    });
    ctx.play();
    this.globalData.bgmAudio = ctx;
    this.globalData.currentBgm = filename;
  },

  stopBgm() {
    if (this.globalData.bgmAudio) {
      try {
        this.globalData.bgmAudio.stop();
        this.globalData.bgmAudio.destroy();
      } catch (e) {}
      this.globalData.bgmAudio = null;
      this.globalData.currentBgm = '';
    }
  },

  toggleBgmMute() {
    this.globalData.bgmMuted = !this.globalData.bgmMuted;
    if (this.globalData.bgmMuted) {
      this.stopBgm();
    }
    this.saveGame();
  }
})
