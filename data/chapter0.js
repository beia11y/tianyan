const app = getApp();

module.exports = {
  // ===== 开场：身份交代 =====
  start: { type: 'scene', bg: '/pages/game/images/bg_office.jpg',
    title: '天眼系统', subtitle: '项目上线倒计时 D-3',
    next: 'intro_1' },

  intro_1: { type: 'dialog', speaker: 'narrator',
    text: '你是一个刚毕业不到半年的新人程序员，今天是你入职这家科技公司的第三十五天。',
    next: 'intro_2' },

  intro_2: { type: 'dialog', speaker: 'narrator',
    text: '你被分配到"B组"——一个负责养老院远程AI辅助问诊系统的开发团队。项目代号叫"天眼"。',
    next: 'intro_3' },

  intro_3: { type: 'dialog', speaker: 'narrator',
    text: '系统能自动监测老人的心率、血氧、体温等生命体征，发现异常就告警。听起来很美好，对吧？',
    next: 'intro_4' },

  intro_4: { type: 'dialog', speaker: 'narrator',
    text: '但实际上，这个系统从立项到开发，一直都有人质疑它的可靠性。',
    next: 'intro_5' },

  intro_5: { type: 'dialog', speaker: 'narrator',
    text: '而你，今天就要面对这一切。',
    next: 'intro_6' },

  intro_6: { type: 'dialog', speaker: 'narrator',
    text: '你坐在工位上，看着白板上的"D-3"。还有三天，系统就要正式上线了。',
    next: 'intro_7' },

  intro_7: { type: 'dialog', speaker: 'narrator',
    text: '工区冷气很足。桌上堆着打印的文档和空咖啡杯。清晨的光从落地窗斜照进来。',
    next: 'intro_8' },

  intro_8: { type: 'dialog', speaker: 'narrator',
    text: '你深吸一口气。',
    next: 'intro_9' },

  intro_9: { type: 'dialog', speaker: 'narrator',
    text: '—— 欢迎来到天眼系统。',
    next: 's1' },

  // ===== 0-1 晨会前 =====
  s1: { type: 'dialog', speaker: 'narrator',
    text: '你到的时候，赵则言已经到了。他桌上放着一杯美式，屏幕上是昨天没关的代码审查页面。',
    next: 's2' },

  s2: { type: 'dialog', speaker: 'zhao',
    text: '早。昨天那个接口文档你看了吗？我半夜发了一版修订。',
    next: 's3' },

  s3: { type: 'dialog', speaker: 'narrator',
    text: '林茜从走廊那头走过来，手里端着一个白色马克杯。她把包放在桌上，拉开椅子坐下，全程没有看任何人。',
    next: 's4' },

  s4: { type: 'dialog', speaker: 'zhao', text: '早啊。', next: 's5' },
  s5: { type: 'dialog', speaker: 'lin',  text: '嗯。', next: 's6' },

  s6: { type: 'dialog', speaker: 'zhao',
    text: '说起来，上次那个生产事故的复盘报告你交了吗？',
    next: 's7' },

  s7: { type: 'dialog', speaker: 'lin', text: '那玩意儿还有什么好复盘的。', mood: 'angry',
    next: 's8' },
  s8: { type: 'dialog', speaker: 'zhao', text: '流程上确实有漏洞，补上就行了。又不是追责。', next: 's9' },
  s9: { type: 'dialog', speaker: 'lin', text: '嗯。流程。', mood: 'angry',
    next: 's10' },

  s10:{ type: 'dialog', speaker: 'zhao',
    text: '你应该还不知道那件事。上个月生产环境出了个数据异常，林茜发现得很快——但她没有走报障流程，自己查了一整夜，第二天直接丢了一个补丁出来。',
    next: 's11' },

  s11:{ type: 'dialog', speaker: 'zhao',
    text: '我从工作到现在，没见过这种操作。她连MR都没提，直接push到生产分支了。',
    next: 's12' },

  s12:{ type: 'dialog', speaker: 'lin',
    text: '因为走流程要三天。那个问题两个小时内就在产生坏数据了。我们可等不起。反正最后清算不还是把锅甩到我们头上？',
    mood: 'angry',
    next: 'choice_react' },

  // ★ AI 互动点1
  choice_react: { type: 'choice', prompt: '（你要回应吗？）',
    options: [
      { text: 'A. 选个预设回答',                next: 's13' },
      { text: 'B. 自己打字说点什么（AI对话）',   next: 'ai_lin_morning' }
    ]
  },

  ai_lin_morning: { type: 'ai_input',
    prompt: '林茜的话有点炸。你想对她说什么？',
    placeholder: '比如：我理解你 / 但流程也有道理 / 你不害怕被处分吗',
    speaker: 'lin',
    context: '清晨工区。林茜刚抱怨完流程问题，语气带刺。她对玩家不熟，但也不排斥。她正在防备别人指责她。',
    fallback: '反正你新来的，不用站队。',
    next: 's13' },

  s13:{ type: 'dialog', speaker: 'zhao',
    text: '后来刘哥给她补了一个事后审批，但也说了——流程不能跳。对吧？',
    next: 's14' },

  s14:{ type: 'dialog', speaker: 'lin', text: '他说了。我听到了。', next: 's15' },
  s15:{ type: 'dialog', speaker: 'zhao', text: '还有十分钟又要开这破会了。', next: 's16' },

  s16:{ type: 'dialog', speaker: 'narrator',
    text: '赵则言翻代码审查单时停了下来，眯着眼看了一会儿，然后翻了过去。',
    next: 's17' },

  s17:{ type: 'dialog', speaker: 'zhao', text: '……可能想多了。', next: 's18' },

  s18:{ type: 'dialog', speaker: 'narrator',
    text: '刘朝闻从走廊那头走过来，手里端着保温杯。经过你的工位时停了一下。',
    next: 's19' },

  s19:{ type: 'dialog', speaker: 'liu',
    text: '早。昨晚的日志我看过了，联调数据没什么大问题。今天把接口收一收，文档补一下，别拖到最后一天。',
    next: 's20' },

  s20:{ type: 'dialog', speaker: 'narrator',
    text: '他的桌上压着一张全家福——妻子和一个小女孩。照片边角有点卷了。',
    next: 'scene2' },

  // ===== 0-2 晨会 =====
  scene2: { type: 'scene', bg: '/pages/game/images/bg_office.jpg', 
    title: '0-2 晨会', subtitle: '上午 9:00 · 白板前',
    mood: 'tense',
    next: 's21' },

  s21:{ type: 'dialog', speaker: 'liu',
    text: '最后三天了。接口联调收尾，文档补全。别出岔子，按部就班走完就行。',
    next: 's22' },

  s22:{ type: 'dialog', speaker: 'zhao', text: '三天，还有三天……', next: 's23' },
  s23:{ type: 'dialog', speaker: 'lin',
    text: '唉……你前天也在倒计时，昨天又在倒计时，今天还在倒计时——你都倒计时一周了，烦不烦啊？',
    mood: 'angry',
    next: 'scene3' },

  // ===== 0-3 午休前 =====
  scene3:{ type: 'scene', bg: '/pages/game/images/bg_office.jpg', 
    title: '0-3 午休前', subtitle: '上午 11:30 · 工位上',
    next: 's24' },

  s24:{ type: 'dialog', speaker: 'zhao',
    text: '昨天那个预提交方案，你看过诊断模型的核心逻辑没有？',
    next: 's25' },

  s25:{ type: 'dialog', speaker: 'zhao',
    text: '我翻了一下，总觉得有一块计算路径写得……太紧了。不是明显的错误，但就是说不上来。可能是我多虑了。',
    next: 's26' },

  s26:{ type: 'dialog', speaker: 'narrator',
    text: '（你瞥到他屏幕上有一条 git log：hotfix 分支，commit 时间 03:47，作者：lin.q）',
    flag: { clue_push_record: true },
    next: 'scene4' },

  // ===== 0-4 傍晚 =====
  scene4:{ type: 'scene', bg: '/pages/game/images/bg_office.jpg', 
    title: '0-4 傍晚', subtitle: '傍晚 18:10',
    mood: 'tense',
    next: 's27' },

  s27:{ type: 'dialog', speaker: 'liu', text: '别太晚。', next: 's28' },
  s28:{ type: 'dialog', speaker: 'zhao', text: '刘哥，预提交方案那个标注集的事，我上周发过一份邮件……', next: 's29' },
  s29:{ type: 'dialog', speaker: 'liu', text: '我知道。但你也知道那个现在换不了。上线再说。', next: 's30' },

  s30:{ type: 'dialog', speaker: 'narrator',
    text: '林茜的目光从屏幕上移开，看了一眼刘朝闻离开的方向，然后收回视线。她继续敲代码，手指比刚才快了一点。',
    next: 'scene5' },

  // ===== 0-5 夜晚 =====
  scene5:{ type: 'scene', bg: '/pages/game/images/bg_office.jpg', 
    title: '0-5 夜晚', subtitle: '晚上 20:30 · 工区几乎空了',
    mood: 'tense',
    next: 's31' },

  s31:{ type: 'dialog', speaker: 'narrator',
    text: '你看着屏幕上的时间从 20:31 慢慢变成 20:47。林茜还在全神贯注地加班。',
    next: 'choice2' },

  choice2: { type: 'choice', prompt: '（你要怎么做？）',
    options: [
      { text: 'A. 走过去问一句。', next: 'branchA', flag: { ch0_talked_to_lin: true } },
      { text: 'B. 直接下班。',     next: 'branchB' }
    ]
  },

  branchA: { type: 'dialog', speaker: 'lin', 
    text: '……还没走？', 
    mood: 'tense',
    next: 'ai_lin_night' },

  ai_lin_night: { type: 'ai_input',
    prompt: '林茜抬头看了你一眼。你想说什么？',
    placeholder: '比如：你在改什么？/ 你还好吗？/ 需要我帮忙吗',
    speaker: 'lin',
    context: '深夜20:47，工区几乎空了，只剩林茜还在加班。她屏幕上是诊断模型代码的某个评估函数——变量命名和原版不一样，看起来是她重写过的。她对玩家保持距离，但没有排斥。她不想轻易告诉任何人她在做什么。',
    fallback: '你先走吧。我把这个弄完。',
    next: 'branchA4' },

  branchA4: { type: 'dialog', speaker: 'narrator', 
    text: '她回到屏幕上，又敲了几行代码。她没有保存电脑上的代码就锁屏了。', 
    next: 'end' },

  branchB: { type: 'dialog', speaker: 'narrator',
    text: '你走出工区时，回头看了一眼。整层楼只剩她那一盏灯了。', 
    mood: 'sad',
    next: 'end' },

  end: { type: 'end', title: '第零章 完', nextChapter: 1 }
}
