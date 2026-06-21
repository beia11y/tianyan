const app = getApp();
const characters = require('../../data/characters.js');

const chapters = {
  0: require('../../data/chapter0.js'),
  1: require('../../data/chapter1.js'),
  2: require('../../data/chapter2.js'),
  3: require('../../data/chapter3.js')
};

// 格式化时间：秒 → "X分钟Y秒"
function formatPlayTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return s + '秒';
  return m + '分' + s + '秒';
}

// 构建玩家画像（供AI结局生成使用）
function buildPlayerProfile() {
  const f = app.globalData.flags;
  const scores = {
    empathy: f.empathy_score || 0,
    rational: f.rational_score || 0,
    hostile: f.hostile_score || 0,
    decisive: f.decisive_score || 0
  };

  // 找出主导倾向
  let topKey = 'rational';
  let topVal = -1;
  for (const k in scores) {
    if (scores[k] > topVal) {
      topVal = scores[k];
      topKey = k;
    }
  }

  const toneMap = {
    empathy: '共情型——你总是先理解他人，温柔而柔软',
    rational: '理性型——你信奉规则与边界，冷静而克制',
    hostile: '冷漠型——你保持距离，习惯煽风点火，看清了职场的本质',
    decisive: '决断型——你不爱多想，行动果断，说到做到'
  };

  const playTime = formatPlayTime(app.getPlaySeconds());

  // 构建选择摘要
  const choiceSummary = (f.choice_log || []).slice(-5).map(c => `- ${c.text}`).join('\n');

  // 构建关键事件摘要
  let events = [];
  if (f.ch0_talked_to_lin) events.push('你在夜晚主动找林茜交谈');
  if (f.clue_push_record) events.push('你注意到了那段深夜的提交记录');
  if (f.ch1_helped_lin) events.push('你选择帮助林茜');
  if (f.ch1_helped_zhao) events.push('你选择支持赵则言');
  if (f.ch2_kept_evidence) events.push('你保留了关键证据');
  if (f.ch3_stood_up) events.push('最终你站出来揭露真相');
  if (f.ch3_mediated) events.push('最终你选择调解，推动延期');
  if (f.sabotage_count && f.sabotage_count > 0) events.push('你有多次挑拨行为');

  return {
    tone: toneMap[topKey] || toneMap.rational,
    scores: scores,
    playTime: playTime,
    aiInteractions: f.ai_interactions || 0,
    choiceSummary: choiceSummary || '(无记录)',
    events: events.length > 0 ? events.join('；') : '你保持着沉默和旁观',
    topKey: topKey
  };
}

// ★ 按章节返回固定 BGM
function pickBgmForChapter(chapter) {
  switch (chapter) {
    case 0: return 'bgm_office.mp3';   // 第零章：日常办公氛围
    case 1: return 'bgm_tense.mp3';    // 第一章：对峙紧张
    case 2: return 'bgm_tense.mp3';    // 第二章：对峙升级
    case 3: return 'bgm_tense.mp3';    // 第三章：终局对峙
    default: return 'bgm_office.mp3';
  }
}

Page({
  data: {
    bg: '', speaker: {}, displayText: '',
    typingDone: false, showDialog: false,
    showChoice: false, showEnd: false,
    sceneTitle: '', sceneSubtitle: '',
    choices: [], choicePrompt: '',
    endTitle: '', muted: false, bgmMuted: false,
    showAIInput: false, aiPrompt: '',
    aiPlaceholder: '', aiInputText: '',
    aiSpeakerName: '',
    showAILoading: false, aiLoadingText: '正在思考中...',
    history: [], showHistory: false,
    sceneMood: '', charMood: '',
    autoPlay: false, speedMode: false,
    lastSpeakerKey: '',
    showPoster: false, posterUrl: ''
  },

  onLoad() {
    this.script = chapters[app.globalData.currentChapter];
    this.currentId = app.globalData.currentNode || 'start';
    this.typingTimer = null;
    this.currentAINode = null;
    this.lastChapter = -1;
    this.setData({
      muted: app.globalData.muted,
      bgmMuted: app.globalData.bgmMuted
    });
    this.runNode(this.currentId);
  },

  onShow() {
    app.globalData.playStartTime = Date.now();
    if (this.currentId && !app.globalData.bgmMuted) {
      const bgm = pickBgmForChapter(app.globalData.currentChapter);
      app.playBgm(bgm);
    }
  },

  onHide() {
    app.accumulatePlayTime();
    app.stopBgm();
  },

  onUnload() {
    if (this.typingTimer) clearInterval(this.typingTimer);
    clearTimeout(this.autoPlayTimer);
    app.accumulatePlayTime();
    app.saveGame();
    app.stopBgm();
  },

  runNode(id) {
    console.log('▶ 节点:', id);
    const node = this.script[id];
    if (!node) { console.error('❌ 节点不存在：' + id); return; }

    this.currentId = id;
    app.globalData.currentNode = id;

    // ★ 先判断是否是结局节点 → 如果是，播放 ending 音乐
    if (node.type === 'ending') {
      if (!app.globalData.bgmMuted) {
        app.playBgm('bgm_ending.mp3');
      }
    }
    // ★ 否则，只在进入新章节时播放 BGM
    else if (this.lastChapter !== app.globalData.currentChapter) {
      this.lastChapter = app.globalData.currentChapter;
      const targetBgm = pickBgmForChapter(this.lastChapter);
      app.playBgm(targetBgm);
    }

    if (node.flag) this.applyFlags(node.flag);

    if (node.type === 'branch') {
      let nextId;
      try {
        nextId = node.condition() ? node.ifTrue : node.ifFalse;
      } catch (e) {
        console.error('branch失败:', id, e);
        nextId = node.ifFalse;
      }
      this.runNode(nextId);
      return;
    }

    if (node.type === 'ending') {
      this.handleEnding(node);
      return;
    }

    if (node.type === 'scene') {
      this.setData({
        bg: node.bg, sceneTitle: node.title, sceneSubtitle: node.subtitle,
        showDialog: false, showChoice: false, showEnd: false,
        showAIInput: false, showAILoading: false, speaker: {},
        charMood: ''
      });
      if (node.mood) this.setData({ sceneMood: node.mood });
      setTimeout(() => {
        this.setData({ sceneTitle: '', sceneSubtitle: '' });
        this.runNode(node.next);
      }, 2200);
    }
    else if (node.type === 'dialog') {
      const speaker = characters[node.speaker] || {};
      const charMood = node.mood || '';
      this.setData({
        showDialog: true, showChoice: false, showEnd: false,
        showAIInput: false, showAILoading: false,
        speaker, charMood, displayText: '', typingDone: false
      });
      if (node.mood) this.setData({ sceneMood: node.mood });
      if (speaker.avatar && speaker.name && this.data.lastSpeakerKey !== node.speaker) {
        this.setData({ lastSpeakerKey: node.speaker });
        this.playCharEffect();
      }
      this.typeText(node.text);
    }
    else if (node.type === 'choice') {
      this.setData({
        showChoice: true, showDialog: false,
        showAIInput: false, showAILoading: false,
        choices: node.options, choicePrompt: node.prompt || ''
      });
    }
    else if (node.type === 'ai_input') {
      const speaker = characters[node.speaker] || {};
      this.currentAINode = node;
      this.setData({
        showAIInput: true, showDialog: false, showChoice: false,
        showEnd: false, showAILoading: false,
        aiPrompt: node.prompt || '你想说什么？',
        aiPlaceholder: node.placeholder || '在这里输入...',
        aiInputText: '', aiSpeakerName: speaker.name || ''
      });
    }
    else if (node.type === 'end') {
      this.setData({
        showEnd: true, showDialog: false, showChoice: false,
        showAIInput: false, showAILoading: false,
        endTitle: node.title
      });
      this.pendingNextChapter = node.nextChapter;
    }
  },

  applyFlags(flagObj) {
    for (const k in flagObj) {
      if (k.endsWith('_add')) {
        const baseKey = k.replace('_add', '');
        app.globalData.flags[baseKey] = (app.globalData.flags[baseKey] || 0) + flagObj[k];
      } else {
        app.globalData.flags[k] = flagObj[k];
      }
    }
    app.saveGame();
  },

  toggleMute() {
    const newMuted = !app.globalData.muted;
    app.globalData.muted = newMuted;
    this.setData({ muted: newMuted });
    app.saveGame();
  },

  toggleBgmMute() {
    app.toggleBgmMute();
    this.setData({ bgmMuted: app.globalData.bgmMuted });
    if (!app.globalData.bgmMuted) {
      // 根据当前节点类型决定播放什么
      const node = this.script[this.currentId];
      if (node && node.type === 'ending') {
        app.playBgm('bgm_ending.mp3');
      } else {
        const bgm = pickBgmForChapter(app.globalData.currentChapter);
        app.playBgm(bgm);
      }
    }
  },

  typeText(text) {
    clearInterval(this.typingTimer);
    clearTimeout(this.autoPlayTimer);
    let i = 0;
    this.fullText = text;
    const speed = this.data.speedMode ? 14 : 40;
    this.typingTimer = setInterval(() => {
      i++;
      this.setData({ displayText: text.slice(0, i) });
      if (i >= text.length) {
        clearInterval(this.typingTimer);
        this.setData({ typingDone: true });
        if (this.data.autoPlay && this.script[this.currentId] && this.script[this.currentId].next) {
          this.autoPlayTimer = setTimeout(() => this.onNext(), 1400);
        }
      }
    }, speed);
  },

  onNext() {
    clearTimeout(this.autoPlayTimer);
    if (!this.data.typingDone) {
      clearInterval(this.typingTimer);
      this.setData({ displayText: this.fullText, typingDone: true });
      return;
    }
    const node = this.script[this.currentId];
    if (node && node.next) {
      if (node.type === 'dialog' && this.data.speaker.name && this.fullText) {
        this.addHistory(this.data.speaker.name, this.fullText);
      }
      this.runNode(node.next);
    }
  },

  onChoose(e) {
    const idx = e.currentTarget.dataset.index;
    const opt = this.data.choices[idx];
    if (opt.flag) this.applyFlags(opt.flag);
    // 关键选择震动反馈
    if (opt.flag && (opt.flag.empathy_score_add || opt.flag.rational_score_add || opt.flag.hostile_score_add || opt.flag.decisive_score_add)) {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'medium' });
    }
    // 记录玩家的选择文本（供AI结局参考）
    if (opt.text && opt.text.length > 2) {
      // 简单推断倾向（匹配flag里的分数键）
      let tone = 'neutral';
      if (opt.flag) {
        if (opt.flag.empathy_score_add) tone = 'empathy';
        else if (opt.flag.rational_score_add) tone = 'rational';
        else if (opt.flag.hostile_score_add) tone = 'hostile';
        else if (opt.flag.decisive_score_add) tone = 'decisive';
      }
      app.logChoice(opt.text, tone);
    }
    this.runNode(opt.next);
  },

  onAIInputChange(e) {
    this.setData({ aiInputText: e.detail.value });
  },

  onAISkip() {
    const node = this.currentAINode;
    if (!node) return;
    const fallback = node.fallback || '...';
    const replyId = 'ai_reply_' + Date.now();
    this.script[replyId] = {
      type: 'dialog', speaker: node.speaker,
      text: fallback, next: node.next
    };
    this.runNode(replyId);
  },

  async onAISubmit() {
    const userInput = (this.data.aiInputText || '').trim();
    if (!userInput) {
      wx.showToast({ title: '请先输入内容', icon: 'none' });
      return;
    }
    const node = this.currentAINode;
    if (!node) return;

    this.setData({ showAIInput: false, showAILoading: true });

    try {
      const result = await this.callProxy(node, userInput);
      this.setData({ showAILoading: false });

      if (result.tone) {
        const toneKey = result.tone + '_score_add';
        this.applyFlags({ [toneKey]: 1, ai_interactions_add: 1 });

        // ★ 第三章 AI 终局：根据语气推断最终行动
        if (node.next === 'check_silent_ai') {
          if (result.tone === 'decisive') {
            this.applyFlags({ ch3_stood_up: true });
          } else if (result.tone === 'rational' || result.tone === 'empathy') {
            this.applyFlags({ ch3_mediated: true });
          }
        }
      }

      // 记录玩家的AI对话选择
      app.logChoice('（AI对话）我说："' + userInput.slice(0, 30) + '…"', result.tone);

      const playerId = 'ai_player_' + Date.now();
      const replyId = 'ai_reply_' + Date.now();
      this.script[playerId] = {
        type: 'dialog', speaker: 'player',
        text: userInput, next: replyId
      };
      this.script[replyId] = {
        type: 'dialog', speaker: node.speaker,
        text: result.reply, next: node.next
      };
      this.runNode(playerId);
    } catch (err) {
      console.error('AI代理失败:', err);
      this.setData({ showAILoading: false });
      wx.showModal({
        title: 'AI 调用失败',
        content: '将使用预设回答。错误：' + (err.errMsg || err.message || '未知'),
        showCancel: false,
        success: () => { this.onAISkip(); }
      });
    }
  },

  // ★ 后端代理：对话生成
  callProxy(node, userInput) {
    const speaker = characters[node.speaker] || {};

    return new Promise((resolve, reject) => {
      wx.request({
        url: app.globalData.apiBaseUrl + '/api/chat',
        method: 'POST',
        data: {
          speakerKey: node.speaker,
          speakerName: speaker.name || node.speaker,
          personality: speaker.personality || '',
          context: node.context || '',
          userInput: userInput
        },
        header: {
          'Content-Type': 'application/json'
        },
        timeout: 30000,
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.reply) {
            const tone = ['empathy','rational','hostile','decisive'].includes(res.data.tone)
              ? res.data.tone : 'rational';
            resolve({ reply: res.data.reply, tone });
          } else {
            reject(new Error('HTTP ' + res.statusCode));
          }
        },
        fail: reject
      });
    });
  },

  // 旧方法保留别名，避免脚本数据中有旧引用（已弃用）
  callDeepSeek(node, userInput, key) {
    return this.callProxy(node, userInput);
  },

  // ★★★ 新功能：AI生成个性化结局
  async handleEnding(node) {
    // 结局震动反馈
    if (wx.vibrateLong) wx.vibrateLong();
    // 先显示基础UI，告诉用户正在生成
    this.setData({
      showEnd: true, showDialog: false, showChoice: false,
      showAIInput: false, showAILoading: false,
      speaker: {}, charMood: '', sceneMood: 'ending',
      endTitle: '— 命运的回响正在凝聚 —\n\n正在为你定制专属结局...'
    });

    // 标记结局（用于收集）
    const endings = wx.getStorageSync('endings') || {};
    endings[node.code] = true;
    wx.setStorageSync('endings', endings);

    // 尝试AI生成个性化结局
    let generatedEnding = null;

    this.setData({
      showAILoading: true,
      aiLoadingText: 'AI 正在生成你的专属结局...'
    });

    try {
      generatedEnding = await this.generateAIEnding(node);
      this.setData({ showAILoading: false });
    } catch (err) {
      console.error('AI结局生成失败:', err);
      this.setData({ showAILoading: false });
    }

    // 构建最终结局文本
    const profile = buildPlayerProfile();

    let finalEndingText;
    if (generatedEnding) {
      finalEndingText =
        '【' + node.title + '】\n\n' +
        generatedEnding + '\n\n' +
        '— 你的画像 —\n' +
        '· 人格类型：' + profile.tone + '\n' +
        '· 倾向分布：共情 ' + profile.scores.empathy + ' · 理性 ' + profile.scores.rational + ' · 决断 ' + profile.scores.decisive + ' · 冷漠 ' + profile.scores.hostile + '\n' +
        '· 游玩时长：' + profile.playTime + '\n' +
        '· AI对话次数：' + profile.aiInteractions + '\n' +
        '· 关键行为：' + profile.events;
    } else {
      // 回退到手动结局文本（如果有desc则用它）
      const baseDesc = node.desc || node.title;
      finalEndingText =
        '【' + node.title + '】\n\n' +
        baseDesc + '\n\n' +
        '— 你的画像 —\n' +
        '· 人格类型：' + profile.tone + '\n' +
        '· 倾向分布：共情 ' + profile.scores.empathy + ' · 理性 ' + profile.scores.rational + ' · 决断 ' + profile.scores.decisive + ' · 冷漠 ' + profile.scores.hostile + '\n' +
        '· 游玩时长：' + profile.playTime + '\n' +
        '· AI对话次数：' + profile.aiInteractions + '\n' +
        '· 关键行为：' + profile.events;
    }

    // 打字机效果展示结局
    this.setData({ endTitle: '', showEnd: true });
    this.typeEndingText(finalEndingText);
  },

  // 结局文本的打字机展示
  typeEndingText(text) {
    if (this.typingTimer) clearInterval(this.typingTimer);
    let i = 0;
    let displaySoFar = '';
    this.typingTimer = setInterval(() => {
      i++;
      displaySoFar = text.slice(0, i);
      this.setData({ endTitle: displaySoFar, typingDone: false });
      if (i >= text.length) {
        clearInterval(this.typingTimer);
        this.setData({ typingDone: true });
      }
    }, 25);
  },

  // ★★★ AI结局生成核心：通过后端代理生成独一无二的结局
  generateAIEnding(node) {
    const profile = buildPlayerProfile();
    const code = node.code || 'E1';

    const endingThemes = {
      'E1': '合轨——正确的事被正确的人听到',
      'E2': '无名之火——正确的事被做了，但没人知道是谁做的',
      'E3': '无人赢家——流程正确但结果错误',
      'E4': '中道——没有英雄也没有罪人，大家各退一步',
      'E5': '两败俱伤——你以为在操纵局势，其实你毁了所有人',
      'E6': '孤勇者——你独自拿出了证据',
      'E7': '合规的胜利——流程最终赢了',
      'E8': '匿名者——迟到的正义来自你保留的证据',
      'E9': '幸存者——你站在了权力赢家旁边',
      'E10': '星火救援——合作团队让事情有了转机',
      'E11': '上级通融——72小时特批窗口',
      'E12': '推倒重来——延期是为了不再重来'
    };
    const theme = endingThemes[code] || '你的故事';

    return new Promise((resolve, reject) => {
      wx.request({
        url: app.globalData.apiBaseUrl + '/api/ending',
        method: 'POST',
        data: {
          code: code,
          theme: theme,
          profile: profile
        },
        header: {
          'Content-Type': 'application/json'
        },
        timeout: 45000,
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.content) {
            const cleaned = res.data.content
              .replace(/^["『「]|["』」]$/g, '')
              .replace(/```[\s\S]*?```/g, '')
              .replace(/^结局[:：]\s*/, '')
              .replace(/^[^。\u4e00-\u9fa5]*?([\u4e00-\u9fa5][\s\S]*)$/, '$1')
              .trim();
            if (cleaned.length > 30) {
              resolve(cleaned);
            } else {
              reject(new Error('AI输出过短'));
            }
          } else {
            reject(new Error('HTTP ' + res.statusCode));
          }
        },
        fail: reject
      });
    });
  },

  // 记录对话历史
  addHistory(name, text) {
    const history = this.data.history;
    if (history.length > 0) {
      const last = history[history.length - 1];
      if (last.name === name && last.text === text) return;
    }
    history.push({ name, text });
    if (history.length > 80) history.shift();
    this.setData({ history });
  },

  // 打开/关闭历史记录
  toggleHistory() {
    this.setData({ showHistory: !this.data.showHistory });
  },

  // 阻止历史面板点击穿透
  preventHistoryClose() {
    return;
  },

  // 自动播放开关
  toggleAutoPlay() {
    const autoPlay = !this.data.autoPlay;
    this.setData({ autoPlay });
    if (autoPlay && this.data.typingDone && this.data.showDialog) {
      const node = this.script[this.currentId];
      if (node && node.next) {
        this.autoPlayTimer = setTimeout(() => this.onNext(), 1400);
      }
    }
  },

  // 加速模式开关
  toggleSpeedMode() {
    this.setData({ speedMode: !this.data.speedMode });
  },

  // 人物登场效果（当前为震动，可替换为音效）
  playCharEffect() {
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
  },

  // 绘制结局分享海报
  drawPoster() {
    this.setData({ showPoster: true });
    const query = wx.createSelectorQuery().in(this);
    query.select('#posterCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const dpr = wx.getSystemInfoSync().pixelRatio || 1;
        canvas.width = 600 * dpr;
        canvas.height = 900 * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const w = 600, h = 900;
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#0a1020');
        gradient.addColorStop(1, '#1a2744');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#6bb5ff';
        ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('天眼系统', w / 2, 100);

        const titleLine = (this.data.endTitle.split('\n')[0] || '').replace(/[【】]/g, '');
        ctx.fillStyle = '#ffffff';
        ctx.font = '28px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(titleLine, w / 2, 170);

        ctx.strokeStyle = 'rgba(107,181,255,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(60, 210);
        ctx.lineTo(w - 60, 210);
        ctx.stroke();

        ctx.fillStyle = '#e8f0ff';
        ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        const lines = this.wrapPosterText(ctx, this.data.endTitle, w - 120);
        lines.slice(0, 22).forEach((line, idx) => {
          ctx.fillText(line, 60, 260 + idx * 24);
        });

        ctx.fillStyle = '#888';
        ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('—— 我的《天眼系统》专属结局 ——', w / 2, h - 80);

        wx.canvasToTempFilePath({
          canvas,
          success: (r) => this.setData({ posterUrl: r.tempFilePath }),
          fail: (err) => console.error('海报生成失败', err)
        });
      });
  },

  wrapPosterText(ctx, text, maxWidth) {
    const paragraphs = text.split('\n');
    const lines = [];
    paragraphs.forEach(p => {
      let line = '';
      for (let i = 0; i < p.length; i++) {
        const testLine = line + p[i];
        if (ctx.measureText(testLine).width > maxWidth && line !== '') {
          lines.push(line);
          line = p[i];
        } else {
          line = testLine;
        }
      }
      lines.push(line);
    });
    return lines;
  },

  savePoster() {
    if (!this.data.posterUrl) return;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterUrl,
      success: () => wx.showToast({ title: '已保存', icon: 'success' }),
      fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
    });
  },

  closePoster() {
    this.setData({ showPoster: false, posterUrl: '' });
  },

  onChapterEnd() {
    if (this.pendingNextChapter != null && chapters[this.pendingNextChapter]) {
      app.globalData.currentChapter = this.pendingNextChapter;
      app.globalData.currentNode = 'start';
      app.saveGame();
      wx.redirectTo({ url: '/pages/game/game' });
    } else {
      wx.redirectTo({ url: '/pages/index/index' });
    }
  }
})
