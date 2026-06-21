const app = getApp();

// ===== 结局判定辅助函数 =====
function getTopTendency() {
  const f = app.globalData.flags;
  const scores = {
    empathy: f.empathy_score || 0,
    rational: f.rational_score || 0,
    hostile: f.hostile_score || 0,
    decisive: f.decisive_score || 0
  };
  let topKey = 'rational';
  let topVal = -1;
  for (const k in scores) {
    if (scores[k] > topVal) {
      topVal = scores[k];
      topKey = k;
    }
  }
  return { key: topKey, value: topVal, all: scores };
}

function getPlayerProfile() {
  const t = getTopTendency();
  const f = app.globalData.flags;

  const profiles = {
    empathy: '【共情型玩家】你总是先去理解他人，温柔而柔软。在这个世界里，这是稀缺的品质。',
    rational: '【理性型玩家】你信奉规则与边界，冷静而克制。你不轻易站队，但你的判断有分量。',
    hostile: '【冷漠/挑拨型玩家】你保持距离，偶尔煽风点火。你看清了职场的本质，但代价是失去了温度。',
    decisive: '【决断型玩家】你不爱多想，但说到就做到。你的行动力，是这个故事真正的变量。'
  };

  let profile = profiles[t.key] || profiles.rational;
  profile += `\n\n你的倾向分布：\n共情 ${t.all.empathy} · 理性 ${t.all.rational} · 决断 ${t.all.decisive} · 冷漠 ${t.all.hostile}`;
  profile += `\nAI对话次数：${f.ai_interactions || 0}`;
  return profile;
}

module.exports = {
  // ===== 入口：先判断挑拨结局 =====
  start: { type: 'branch',
    condition: () => app.globalData.flags.sabotage_count >= 2 || app.globalData.flags.hostile_score >= 5,
    ifTrue: 'ending5_intro',
    ifFalse: 'normal_start' },

  normal_start: { type: 'scene', bg: '/pages/game/images/bg_office.jpg',
    title: '第三章 · 终局', subtitle: '上线日 D-Day · 上午 9:30',
    mood: 'tense',
    next: 's1' },

  s1: { type: 'dialog', speaker: 'narrator',
    text: '高层主管今天亲临现场观摩。会议室里坐了七八个人，刘朝闻站在投影前，西装比平时整齐了一倍。',
    mood: 'tense',
    next: 's2' },
  s2: { type: 'dialog', speaker: 'liu',
    text: '……天眼系统经过严格的内部测试，模型准确率达到行业领先水平。我们对今天的上线非常有信心。',
    mood: 'tense',
    next: 's3' },
  s3: { type: 'dialog', speaker: 'narrator',
    text: '高层主管点点头，问了几个不痛不痒的问题。刘朝闻回答得滴水不漏。',
    next: 's4' },
  s4: { type: 'dialog', speaker: 'narrator',
    text: '林茜坐在角落，手在桌下握成了拳。赵则言坐在另一边，眼神和林茜对了一下，又移开了。',
    mood: 'tense',
    next: 's5' },
  s5: { type: 'dialog', speaker: 'narrator',
    text: '他们都想说什么，但都没有站起来。',
    next: 's6' },

  // ★ 选择1：高层观摩中的心态
  choice_observe: { type: 'choice', prompt: '（你坐在会议室。你的内心在想什么？）',
    options: [
      { text: 'A. "如果林茜或则言站出来，我一定附和。"',
        next: 's6_continue', flag: { empathy_score_add: 1 } },
      { text: 'B. "现在站出来，就是和整个项目组作对。"',
        next: 's6_continue', flag: { rational_score_add: 1 } },
      { text: 'C. "这关我什么事？我只是个新人。"',
        next: 's6_continue', flag: { hostile_score_add: 1 } },
      { text: 'D. "我自己也准备好了。"',
        next: 's6_continue', flag: { decisive_score_add: 2 } }
    ]
  },

  s6: { type: 'dialog', speaker: 'narrator',
    text: '会议进行了二十分钟。高层主管点头点得越多，林茜的指甲就掐得越深。',
    mood: 'tense',
    next: 'choice_observe' },

  s6_continue: { type: 'dialog', speaker: 'narrator',
    text: '高层主管合上文件夹："还有什么补充吗？"',
    next: 's7' },
  s7: { type: 'dialog', speaker: 'narrator',
    text: '空气安静了三秒。所有人都没动。',
    mood: 'tense',
    next: 'choice_final' },

  // ★ 终极选择
  choice_final: { type: 'choice', prompt: '（这是你最后的机会。你要怎么做？）',
    options: [
      { text: 'A. 站起来。"我有事要补充。"',
        next: 'check_standup',
        flag: { ch3_stood_up: true, decisive_score_add: 3 } },
      { text: 'B. 举手提议："能不能再延期一周做最后验证？"',
        next: 'check_mediate',
        flag: { ch3_mediated: true, rational_score_add: 1, empathy_score_add: 1 } },
      { text: 'C. 什么都不说，看着会议结束。',
        next: 'silent_path',
        flag: { rational_score_add: 1 } },
      { text: 'D. 自己打字决定（AI对话）',
        next: 'ai_final' }
    ]
  },

  ai_final: { type: 'ai_input',
    prompt: '高层主管已经在合文件夹了。你的决定是？',
    placeholder: '说出你的选择和理由',
    speaker: 'liu',
    context: '上线日终场会议。高层主管即将离开。林茜和赵则言都没有站出来。玩家此刻可以选择站出来揭露真相、提议延期、或者保持沉默。刘朝闻表面镇定，但他怕极了——他知道一旦有人开口，他经营三年的位置就完了。',
    fallback: '我……没什么补充的。',
    next: 'check_silent_ai' },

  // ===== AI 对话路线：根据语气推断最终行动 =====
  check_silent_ai: { type: 'branch',
    condition: () => app.globalData.flags.ch3_stood_up,
    ifTrue: 'check_standup',
    ifFalse: app.globalData.flags.ch3_mediated ? 'check_mediate' : 'silent_path' },

  // ===== 站出来路线：E1 / E10 / E6 / E11 / E7 / E3 / E5 =====
  check_standup: { type: 'branch',
    condition: () => app.globalData.flags.sabotage_count >= 2 || app.globalData.flags.hostile_score >= 5,
    ifTrue: 'ending5_intro',
    ifFalse: 'check_standup_1' },

  check_standup_1: { type: 'branch',
    condition: () => app.globalData.flags.ch1_helped_lin
                  && app.globalData.flags.ch2_kept_evidence
                  && app.globalData.flags.decisive_score >= 5,
    ifTrue: 'ending1_intro',
    ifFalse: 'check_standup_2' },

  check_standup_2: { type: 'branch',
    condition: () => app.globalData.flags.ch1_helped_lin
                  && app.globalData.flags.ch2_kept_evidence
                  && app.globalData.flags.empathy_score >= 3,
    ifTrue: 'ending10_intro',
    ifFalse: 'check_standup_3' },

  check_standup_3: { type: 'branch',
    condition: () => app.globalData.flags.ch2_kept_evidence,
    ifTrue: 'ending6_intro',
    ifFalse: 'check_standup_4' },

  check_standup_4: { type: 'branch',
    condition: () => app.globalData.flags.ch1_helped_zhao
                  && app.globalData.flags.ch2_talked_to_zhao
                  && app.globalData.flags.rational_score >= 4,
    ifTrue: 'ending11_intro',
    ifFalse: 'check_standup_5' },

  check_standup_5: { type: 'branch',
    condition: () => app.globalData.flags.ch1_helped_zhao && app.globalData.flags.rational_score >= 4,
    ifTrue: 'ending7_intro',
    ifFalse: 'ending3_intro' },

  // ===== 调解路线：E11 / E4 / E12 / E7 / E9 / E3 / E5 =====
  check_mediate: { type: 'branch',
    condition: () => app.globalData.flags.sabotage_count >= 2 || app.globalData.flags.hostile_score >= 5,
    ifTrue: 'ending5_intro',
    ifFalse: 'check_mediate_1' },

  check_mediate_1: { type: 'branch',
    condition: () => app.globalData.flags.ch1_helped_lin
                  && app.globalData.flags.ch1_helped_zhao
                  && app.globalData.flags.ch2_kept_evidence
                  && app.globalData.flags.ch2_talked_to_zhao,
    ifTrue: 'ending11_intro',
    ifFalse: 'check_mediate_2' },

  check_mediate_2: { type: 'branch',
    condition: () => app.globalData.flags.ch1_helped_lin
                  && app.globalData.flags.ch2_kept_evidence,
    ifTrue: 'ending4_intro',
    ifFalse: 'check_mediate_3' },

  check_mediate_3: { type: 'branch',
    condition: () => app.globalData.flags.ch2_kept_evidence
                  && app.globalData.flags.rational_score >= 3,
    ifTrue: 'ending12_intro',
    ifFalse: 'check_mediate_4' },

  check_mediate_4: { type: 'branch',
    condition: () => app.globalData.flags.ch1_helped_zhao && app.globalData.flags.rational_score >= 4,
    ifTrue: 'ending7_intro',
    ifFalse: 'check_mediate_5' },

  check_mediate_5: { type: 'branch',
    condition: () => app.globalData.flags.ch2_flattered_liu,
    ifTrue: 'ending9_intro',
    ifFalse: 'ending3_intro' },

  // ===== 沉默路线：E2 / E8 / E9 / E3 / E5 =====
  silent_path: { type: 'branch',
    condition: () => app.globalData.flags.sabotage_count >= 2 || app.globalData.flags.hostile_score >= 5,
    ifTrue: 'ending5_intro',
    ifFalse: 'silent_path_1' },

  silent_path_1: { type: 'branch',
    condition: () => app.globalData.flags.ch1_helped_lin,
    ifTrue: 'ending2_intro',
    ifFalse: 'check_silent_2' },

  check_silent_2: { type: 'branch',
    condition: () => app.globalData.flags.ch2_kept_evidence,
    ifTrue: 'ending8_intro',
    ifFalse: 'check_silent_3' },

  check_silent_3: { type: 'branch',
    condition: () => app.globalData.flags.ch2_flattered_liu,
    ifTrue: 'ending9_intro',
    ifFalse: 'ending3_intro' },


// ============================================
  // ★ 结局1 · 完美结局
  // ============================================
  ending1_intro: { type: 'dialog', speaker: 'player',
    text: '主管，我有事要补充。',
    mood: 'tense',
    next: 'e1_1' },
  e1_1: { type: 'dialog', speaker: 'narrator',
    text: '所有人转头看你。刘朝闻的脸瞬间白了一层。你深吸一口气，决定用一个高层能听懂的比喻。',
    mood: 'shock',
    next: 'e1_2' },
  e1_2: { type: 'dialog', speaker: 'player',
    text: '我打个比方。这个系统就像一个新来的体检医生——他诊断1000个人，能正确判断 920 个。',
    next: 'e1_3' },
  e1_3: { type: 'dialog', speaker: 'player',
    text: '但剩下 80 个里，有 70 个他会说"没事，回去吧"——其中真的有 8 个，是有问题的。',
    next: 'e1_4' },
  e1_4: { type: 'dialog', speaker: 'player',
    text: '在年轻人身上这 8 个可能就是亚健康。但我们的客户是养老院——这 8 个，可能是 8 条命。',
    next: 'e1_5' },
  e1_5: { type: 'dialog', speaker: 'narrator',
    text: '会议室里没人说话。高层主管缓缓放下钢笔。',
    mood: 'tense',
    next: 'e1_6' },
  e1_6: { type: 'dialog', speaker: 'player',
    text: '我手里有完整的测试数据，也有同事独立开发的修正补丁——漏诊率从 8.7% 降到了 0.9%。',
    next: 'e1_7' },
  e1_7: { type: 'dialog', speaker: 'narrator',
    text: '高层主管沉默了五秒，然后看向刘朝闻："这事，你知道吗？"',
    next: 'e1_8' },
  e1_8: { type: 'dialog', speaker: 'narrator',
    text: '刘朝闻嘴唇动了动，最后什么也没说出来。',
    next: 'e1_9' },

  e1_9: { type: 'scene', bg: '/pages/game/images/bg_office.jpg',
    title: '—— 三周后 ——', subtitle: '',
    mood: 'warm',
    next: 'e1_10' },
  e1_10: { type: 'dialog', speaker: 'narrator',
    text: '修正补丁紧急走完审批，项目延期三天上线，市场反响很好。医院方在第二周就追加了两期合同。',
    mood: 'warm',
    next: 'e1_11' },
  e1_11: { type: 'dialog', speaker: 'narrator',
    text: '刘朝闻被调离了管理岗，重新做回了技术。林茜升任组长。赵则言被任命为代码评审负责人。',
    mood: 'warm',
    next: 'e1_12' },
  e1_12: { type: 'dialog', speaker: 'narrator',
    text: '你拿到了项目奖金，也拿到了一个新的工卡——上面没有"实习"两个字了。',
    mood: 'warm',
    next: 'ending1_title' },

  ending1_title: { type: 'ending', code: 'E1',
    title: '【完美结局】合轨',
    desc: '正确的事，用正确的方式，被正确的人听到了。\n这是最难的一条路，你走通了。\n\n' +
          '— 你的画像 —\n' + getPlayerProfile(),
    next: 'credits' },

  // ============================================
  // ★ 结局2 · 沉默的正确
  // ============================================
  ending2_intro: { type: 'dialog', speaker: 'narrator',
    text: '你没有站起来。会议在掌声中结束。',
    mood: 'sad',
    next: 'e2_1' },
  e2_1: { type: 'dialog', speaker: 'narrator',
    text: '当晚林茜独自留下加班，把补丁悄悄合进了 release 分支。赵则言第二天发现了，但他选择默默给那条 commit 补了一个事后审批。',
    next: 'e2_2' },
  e2_2: { type: 'dialog', speaker: 'narrator',
    text: '项目按时上线。一切正常。',
    next: 'e2_3' },

  e2_3: { type: 'scene', bg: '/pages/game/images/bg_office.jpg',
    title: '—— 两个月后 ——', subtitle: '',
    next: 'e2_4' },
  e2_4: { type: 'dialog', speaker: 'narrator',
    text: '天眼系统因"模型准确率行业领先"获得集团创新奖。颁奖台上，刘朝闻发表感言："这个成绩离不开团队每个人的努力，特别是我个人对模型边界的反复打磨……"',
    mood: 'angry',
    next: 'e2_5' },
  e2_5: { type: 'dialog', speaker: 'narrator',
    text: '林茜在台下听着，脸上没什么表情。赵则言也没说话。',
    next: 'e2_6' },
  e2_6: { type: 'dialog', speaker: 'narrator',
    text: '散会后，林茜路过你工位，丢下一句："至少老人们没出事。"',
    mood: 'sad',
    next: 'e2_7' },
  e2_7: { type: 'dialog', speaker: 'narrator',
    text: '是啊。至少。',
    mood: 'sad',
    next: 'ending2_title' },

  ending2_title: { type: 'ending', code: 'E2',
    title: '【沉默的正确结局】无名之火',
    desc: '正确的事被做了，但没人会知道是谁做的。\n功劳归了不该归的人，但你睡得着。\n\n' +
          '— 你的画像 —\n' + getPlayerProfile(),
    next: 'credits' },

  // ============================================
  // ★ 结局3 · 程序正义
  // ============================================
  ending3_intro: { type: 'dialog', speaker: 'narrator',
    text: '你没有足够的证据。即使你站起来，也只能说"我听说有问题"——而刘朝闻一个反问就能让你坐下。',
    mood: 'tense',
    next: 'e3_1' },
  e3_1: { type: 'dialog', speaker: 'narrator',
    text: '会议在掌声中结束。原版系统按时上线。',
    next: 'e3_2' },

  e3_2: { type: 'scene', bg: '/pages/game/images/bg_office.jpg',
    title: '—— 上线第18天 ——', subtitle: '',
    next: 'e3_3' },
  e3_3: { type: 'dialog', speaker: 'narrator',
    text: '某养老院凌晨2点，一位老人出现心率异常。天眼系统判定"正常波动，无需告警"。',
    mood: 'shock',
    next: 'e3_4' },
  e3_4: { type: 'dialog', speaker: 'narrator',
    text: '老人在凌晨4点被发现时，已经走了。',
    mood: 'sad',
    next: 'e3_5' },
  e3_5: { type: 'dialog', speaker: 'narrator',
    text: '医院方追责，调取了系统日志。事故曝光后，集团启动内部调查。',
    mood: 'tense',
    next: 'e3_6' },
  e3_6: { type: 'dialog', speaker: 'narrator',
    text: '林茜因"擅自修改生产代码、隐瞒模型缺陷"被处分。刘朝闻因"知情不报"被追责降职。赵则言全身而退——他的每一封汇报邮件都还在。',
    next: 'e3_7' },
  e3_7: { type: 'dialog', speaker: 'narrator',
    text: '林茜走的那天，没跟任何人告别。',
    mood: 'sad',
    next: 'ending3_title' },

  ending3_title: { type: 'ending', code: 'E3',
    title: '【程序正义结局】没有人是赢家',
    desc: '流程是对的，结果是错的。\n所有人都"按规矩办事"，所有人都输了。\n\n' +
          '— 你的画像 —\n' + getPlayerProfile(),
    next: 'credits' },

  // ============================================
  // ★ 结局4 · 全员妥协
  // ============================================
  ending4_intro: { type: 'dialog', speaker: 'player',
    text: '主管，能不能把上线推一周？我们想做最后一轮压力测试。',
    mood: 'tense',
    next: 'e4_1' },
  e4_1: { type: 'dialog', speaker: 'narrator',
    text: '高层主管挑了挑眉。刘朝闻急着插话："不需要，我们已经——"',
    mood: 'tense',
    next: 'e4_2' },
  e4_2: { type: 'dialog', speaker: 'narrator',
    text: '"你的下属说需要。" 高层主管打断了他。"一周。给他们一周。"',
    mood: 'tense',
    next: 'e4_3' },
  e4_3: { type: 'dialog', speaker: 'narrator',
    text: '会议室里，林茜偷偷看了你一眼，眼神里有种"原来还有这条路"的意外。赵则言点了点头。',
    next: 'e4_4' },

  e4_4: { type: 'scene', bg: '/pages/game/images/bg_office.jpg',
    title: '—— 一周后 ——', subtitle: '',
    mood: 'warm',
    next: 'e4_5' },
  e4_5: { type: 'dialog', speaker: 'narrator',
    text: '林茜的补丁走完了正规审批。赵则言主导了完整的代码评审。项目延期一周上线，没出事。',
    mood: 'warm',
    next: 'e4_6' },
  e4_6: { type: 'dialog', speaker: 'narrator',
    text: '刘朝闻因"项目延期"被调到了非核心部门——不是降职，但也不再被重用。林茜和赵则言都没升职，但也没受影响。',
    mood: 'warm',
    next: 'e4_7' },
  e4_7: { type: 'dialog', speaker: 'narrator',
    text: '林茜后来跟你说："那天我以为你要么沉默要么爆发，没想到你选了第三个。"',
    mood: 'warm',
    next: 'ending4_title' },

  ending4_title: { type: 'ending', code: 'E4',
    title: '【全员妥协结局】中道',
    desc: '没有英雄，也没有罪人。\n大家各退一步，但东西做对了。\n\n' +
          '— 你的画像 —\n' + getPlayerProfile(),
    next: 'credits' },

  // ============================================
  // ★ 结局5 · 最差结局
  // ============================================
  ending5_intro: { type: 'dialog', speaker: 'narrator',
    text: '你不知道是什么时候开始的——林茜开始怀疑赵则言在背后告她的状，赵则言开始觉得林茜瞧不起他。',
    mood: 'tense',
    next: 'e5_1' },
  e5_1: { type: 'dialog', speaker: 'narrator',
    text: '高层观摩那天，林茜突然站起来举报赵则言"私下批准过未审批的代码"。赵则言反咬一口，把林茜所有违规操作的截图甩了出来。',
    mood: 'angry',
    next: 'e5_2' },
  e5_2: { type: 'dialog', speaker: 'narrator',
    text: '会议变成了菜市场。高层主管脸色铁青地走了。',
    mood: 'tense',
    next: 'e5_3' },
  e5_3: { type: 'dialog', speaker: 'narrator',
    text: '一周后，集团叫停了天眼项目。林茜和赵则言双双被开。刘朝闻保住了职位——他成功证明了自己"早就发现下属之间存在严重矛盾"。',
    next: 'e5_4' },
  e5_4: { type: 'dialog', speaker: 'narrator',
    text: '你在被通知"试用期不通过"那天，路过他们曾经的工位。两台电脑都已经关机。桌上空了。',
    mood: 'sad',
    next: 'ending5_title' },

  ending5_title: { type: 'ending', code: 'E5',
    title: '【最差结局】两败俱伤',
    desc: '你以为自己在玩弄局势，其实你毁了所有人。\n包括你自己。\n\n' +
          '— 你的画像 —\n' + getPlayerProfile(),
    next: 'credits' },


  // ============================================
  // ★ 结局6 · 孤勇者
  // ============================================
  ending6_intro: { type: 'dialog', speaker: 'narrator',
    text: '你站了起来，把加密文件夹里的测试报告、补丁记录、还有那份未签字的审批申请，全部投影到了屏幕上。刘朝闻想打断你，但高层主管示意你继续。',
    mood: 'tense',
    next: 'e6_1' },
  e6_1: { type: 'dialog', speaker: 'narrator',
    text: '林茜低着头，没有附和。赵则言也低着头。会议室里只有你的声音。',
    mood: 'tense',
    next: 'e6_2' },
  e6_2: { type: 'dialog', speaker: 'narrator',
    text: '三天后，集团派来了合规调查组。补丁被重新评估，项目延期两周。系统最终没有按原版上线。',
    next: 'e6_3' },
  e6_3: { type: 'scene', bg: '/pages/game/images/bg_office.jpg',
    title: '—— 一个月后 ——', subtitle: '',
    next: 'e6_4' },
  e6_4: { type: 'dialog', speaker: 'narrator',
    text: '你收到了调岗通知——"更适合独立工作的岗位"。没人说你做错了，但所有人都知道你做了一个让人不舒服的人。',
    mood: 'sad',
    next: 'e6_5' },
  e6_5: { type: 'dialog', speaker: 'narrator',
    text: '林茜在调查结束后离职了。她说她不怪你，只是没办法再留在那里。赵则言留了下来，但再也不和你一起吃饭。',
    mood: 'sad',
    next: 'ending6_title' },

  ending6_title: { type: 'ending', code: 'E6',
    title: '【孤勇者结局】数据会说话',
    desc: '正确的事，不一定有好报。\n你保住了老人的命，但失去了同事和位置。\n\n' +
          '— 你的画像 —\n' + getPlayerProfile(),
    next: 'credits' },

  // ============================================
  // ★ 结局7 · 流程的胜利
  // ============================================
  ending7_intro: { type: 'dialog', speaker: 'narrator',
    text: '你没有靠情绪，也没有靠个人英雄主义。你只是把每一次未审批的提交、每一条被跳过的流程、每一份测试报告，整理成了一份14页的内部审计材料。',
    mood: 'tense',
    next: 'e7_1' },
  e7_1: { type: 'dialog', speaker: 'narrator',
    text: '赵则言接过材料，看了一遍，又看了一遍。然后他站起来说："我补充一点。这些材料我已经交叉核对过，全部属实。"',
    next: 'e7_2' },
  e7_2: { type: 'dialog', speaker: 'narrator',
    text: '高层主管把材料交给了合规部。三周后，一份正式通报发了下来：刘朝闻调离管理岗，原版模型下线，项目延期两周。',
    next: 'e7_3' },
  e7_3: { type: 'dialog', speaker: 'narrator',
    text: '林茜的补丁按正规流程重新提交。赵则言主导了外部合作团队的安全审计。你成了合规培训的"正面案例"。',
    mood: 'warm',
    next: 'e7_4' },
  e7_4: { type: 'dialog', speaker: 'narrator',
    text: '林茜没对你说谢谢，但她在评审系统里给你的账号点了一个赞。',
    mood: 'warm',
    next: 'ending7_title' },

  ending7_title: { type: 'ending', code: 'E7',
    title: '【流程派结局】合规的回响',
    desc: '流程很慢。但流程赢了。\n没有戏剧性的对峙，只有一寸一寸的合规。\n\n' +
          '— 你的画像 —\n' + getPlayerProfile(),
    next: 'credits' },

  // ============================================
  // ★ 结局8 · 匿名者
  // ============================================
  ending8_intro: { type: 'dialog', speaker: 'narrator',
    text: '你没有在会议室里站起来。你看着刘朝闻把文件夹合上，看着高层主管离开。但你心里清楚，那份证据还在你的加密文件夹里。',
    mood: 'sad',
    next: 'e8_1' },
  e8_1: { type: 'dialog', speaker: 'narrator',
    text: '第十八天，那个凌晨还是来了。你看着新闻标题，手指有点发抖。你早就知道会发生什么，但你选择了沉默。',
    mood: 'shock',
    next: 'e8_2' },
  e8_2: { type: 'dialog', speaker: 'narrator',
    text: '一周后，你把加密文件夹里的数据发给了几家行业媒体。署名是"一位不愿透露姓名的工程师"。',
    next: 'e8_3' },
  e8_3: { type: 'dialog', speaker: 'narrator',
    text: '报道引爆了舆论。刘朝闻被开除，集团公开道歉，天眼项目全面回炉。林茜和赵则言也接受了调查，但最终没有追责。',
    next: 'e8_4' },
  e8_4: { type: 'dialog', speaker: 'narrator',
    text: '你安全地保住了工作。但你再也没有办法在凌晨两点睡个好觉。',
    mood: 'sad',
    next: 'ending8_title' },

  ending8_title: { type: 'ending', code: 'E8',
    title: '【匿名者结局】迟到的正义',
    desc: '正义来过，但来得太晚了。\n你活着，但心里永远有一个老人。\n\n' +
          '— 你的画像 —\n' + getPlayerProfile(),
    next: 'credits' },

  // ============================================
  // ★ 结局9 · 幸存者
  // ============================================
  ending9_intro: { type: 'dialog', speaker: 'narrator',
    text: '你始终站在流程和权力这边。会议结束后，刘朝闻拍了拍你的肩膀。他没有说谢谢，但你知道他记住了你。',
    mood: 'tense',
    next: 'e9_1' },
  e9_1: { type: 'dialog', speaker: 'narrator',
    text: '系统按时上线。前三个月，没有任何异常。集团表彰会上，刘朝闻作为项目负责人发言，台下掌声雷动。',
    next: 'e9_2' },
  e9_2: { type: 'dialog', speaker: 'narrator',
    text: '你被介绍为"项目核心成员"，虽然你入职还不到三个月。林茜离开了公司。赵则言还在，但他看你的眼神变了。',
    next: 'e9_3' },
  e9_3: { type: 'dialog', speaker: 'narrator',
    text: '半年后，你搬进了一个独立的办公室。窗外是城市夜景。你偶尔会想起那个D-3的清晨，想起林茜说"会死人的"。',
    mood: 'sad',
    next: 'e9_4' },
  e9_4: { type: 'dialog', speaker: 'narrator',
    text: '但你告诉自己：我活下来，就够了。',
    next: 'ending9_title' },

  ending9_title: { type: 'ending', code: 'E9',
    title: '【幸存者结局】站在赢家旁边',
    desc: '你选择了最安全的位置。\n代价是，你失去了一些再也找不回来的东西。\n\n' +
          '— 你的画像 —\n' + getPlayerProfile(),
    next: 'credits' },

  // ============================================
  // ★ 结局10 · 星火救援
  // ============================================
  ending10_intro: { type: 'dialog', speaker: 'player',
    text: '主管，我建议引入外部合作团队，做48小时独立安全审计。林茜的修正补丁已经 ready，缺的只是一个被听见的机会。',
    mood: 'tense',
    next: 'e10_1' },
  e10_1: { type: 'dialog', speaker: 'narrator',
    text: '高层主管挑了挑眉。"48小时？" 你点头："48小时足以验证核心漏诊场景，不会耽误太久。"',
    mood: 'tense',
    next: 'e10_2' },
  e10_2: { type: 'dialog', speaker: 'narrator',
    text: '林茜站了起来，第一次不是以对抗者的姿态："我负责提供测试数据。" 赵则言也站了起来："我负责流程文档。"',
    mood: 'shock',
    next: 'e10_3' },
  e10_3: { type: 'dialog', speaker: 'narrator',
    text: '高层主管看了刘朝闻一眼。刘朝闻没有再说话。',
    next: 'e10_4' },
  e10_4: { type: 'scene', bg: '/pages/game/images/bg_office.jpg',
    title: '—— 三天后 ——', subtitle: '',
    mood: 'warm',
    next: 'e10_5' },
  e10_5: { type: 'dialog', speaker: 'narrator',
    text: '合作团队完成了48小时审计。结论：林茜补丁有效，漏诊率从 8.7% 降至 0.9%。项目延期三天上线。',
    mood: 'warm',
    next: 'e10_6' },
  e10_6: { type: 'dialog', speaker: 'narrator',
    text: '刘朝闻被调离管理岗。林茜和赵则言在评审会上第一次握手。你成了那个"把合作团队带进来的人"。',
    mood: 'warm',
    next: 'ending10_title' },

  ending10_title: { type: 'ending', code: 'E10',
    title: '【星火救援结局】合作团队',
    desc: '一个人的声音不够大，但三个人的声音可以。\n你找到了第三条路：让更多人进来。\n\n' +
          '— 你的画像 —\n' + getPlayerProfile(),
    next: 'credits' },

  // ============================================
  // ★ 结局11 · 上级通融
  // ============================================
  ending11_intro: { type: 'dialog', speaker: 'player',
    text: '主管，林茜和赵则言已经联合准备了一套完整的修正方案。我请求特批一个72小时验证窗口，让合规流程和系统安全都能兼顾。',
    mood: 'tense',
    next: 'e11_1' },
  e11_1: { type: 'dialog', speaker: 'narrator',
    text: '林茜和赵则言对视了一眼。赵则言从包里拿出一份装订好的材料："流程、测试数据、回滚方案，全在这里。"',
    next: 'e11_2' },
  e11_2: { type: 'dialog', speaker: 'narrator',
    text: '高层主管翻了翻材料，又看了看刘朝闻。"刘经理，你的意见？" 刘朝闻沉默了很久，最后说："……按他们说的办。"',
    mood: 'shock',
    next: 'e11_3' },
  e11_3: { type: 'scene', bg: '/pages/game/images/bg_office.jpg',
    title: '—— 72小时后 ——', subtitle: '',
    mood: 'warm',
    next: 'e11_4' },
  e11_4: { type: 'dialog', speaker: 'narrator',
    text: '72小时验证通过。高层破例批准了一次"紧急合规变更"，项目延期四天上线。',
    mood: 'warm',
    next: 'e11_5' },
  e11_5: { type: 'dialog', speaker: 'narrator',
    text: '刘朝闻被记大过，但保留了职位。林茜和赵则言共同提交了这次变更的完整审计文档。你则在转正评审里被写下了"关键协调能力"六个字。',
    mood: 'warm',
    next: 'ending11_title' },

  ending11_title: { type: 'ending', code: 'E11',
    title: '【上级通融结局】72小时窗口',
    desc: '规则不是死的，只是很少有人敢为它争取一次例外。\n你争取到了。\n\n' +
          '— 你的画像 —\n' + getPlayerProfile(),
    next: 'credits' },

  // ============================================
  // ★ 结局12 · 推倒重来
  // ============================================
  ending12_intro: { type: 'dialog', speaker: 'player',
    text: '主管，这个项目的养老模块需要推倒重来。不是修修补补，是重新设计。我建议延期一个月，引入外部合作团队。',
    mood: 'tense',
    next: 'e12_1' },
  e12_1: { type: 'dialog', speaker: 'narrator',
    text: '会议室里一片安静。刘朝闻想反对，但高层主管先开口了："一个月？如果出纰漏，谁来负责？"',
    next: 'e12_2' },
  e12_2: { type: 'dialog', speaker: 'player',
    text: '我来负责。我有证据，也有方案。',
    next: 'e12_3' },
  e12_3: { type: 'dialog', speaker: 'narrator',
    text: '你拿出加密文件夹里的全部材料。高层主管一页一页翻完，点了点头。',
    mood: 'shock',
    next: 'e12_4' },
  e12_4: { type: 'scene', bg: '/pages/game/images/bg_office.jpg',
    title: '—— 一个月后 ——', subtitle: '',
    mood: 'warm',
    next: 'e12_5' },
  e12_5: { type: 'dialog', speaker: 'narrator',
    text: '养老模块被合作团队彻底重构。林茜负责模型修正，赵则言负责流程兜底。项目安全上线，没有任何老人出事。',
    mood: 'warm',
    next: 'e12_6' },
  e12_6: { type: 'dialog', speaker: 'narrator',
    text: '刘朝闻被降级为普通工程师。林茜和赵则言成了重构项目的联合负责人。你则在转正答辩时，只说了四个字："值得。"',
    mood: 'warm',
    next: 'ending12_title' },

  ending12_title: { type: 'ending', code: 'E12',
    title: '【推倒重来结局】延期一个月',
    desc: '有时候，最勇敢的决定不是往前冲，而是喊停。\n你把一个月，换回了不会被噩梦惊醒的每一天。\n\n' +
          '— 你的画像 —\n' + getPlayerProfile(),
    next: 'credits' },

    // ============================================
  // 通用片尾
  // ============================================
  credits: { type: 'end', title: '—— 完 ——\n感谢游玩《天眼系统》', nextChapter: null }
}
