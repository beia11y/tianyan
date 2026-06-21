const app = getApp();

Page({
  data: {
    hasSave: false
  },

  onShow() {
    this.setData({
      hasSave: !!wx.getStorageSync('save')
    });
  },

  newGame() {
    wx.removeStorageSync('save');
    app.globalData.currentChapter = 0;
    app.globalData.currentNode = 'start';
    app.globalData.flags = {
      ch0_talked_to_lin: false,
      clue_push_record: false,
      ch1_helped_zhao: false,
      ch1_helped_lin: false,
      ch1_reported: false,
      ch2_kept_evidence: false,
      ch2_side: 'neutral',
      ch2_promise_lin: false,
      ch2_talked_to_zhao: false,
      sabotage_count: 0,
      ch3_stood_up: false,
      ch3_mediated: false,
      empathy_score: 0,
      rational_score: 0,
      hostile_score: 0,
      decisive_score: 0,
      ai_interactions: 0,
      choice_log: []
    };
    wx.navigateTo({ url: '/pages/game/game' });
  },

  continueGame() {
    wx.navigateTo({ url: '/pages/game/game' });
  },

  showEndings() {
    const endings = wx.getStorageSync('endings') || {};
    const list = ['E1','E2','E3','E4','E5','E6','E7','E8','E9','E10','E11','E12']
      .map(code => endings[code] ? `✅ ${code}` : `🔒 ${code}`)
      .join('\n');
    wx.showModal({ title: '结局收集', content: list, showCancel: false });
  }
})