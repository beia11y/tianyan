const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cors());

const DEEPSEEK_URL = process.env.DEEPSEEK_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;

if (!DEEPSEEK_KEY) {
  console.error('❌ 错误：请设置环境变量 DEEPSEEK_KEY');
  process.exit(1);
}

// 健康检查
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'tianyan-proxy' });
});

// 角色对话代理
app.post('/api/chat', async (req, res) => {
  try {
    const { speakerKey, speakerName, personality, context, userInput } = req.body;
    if (!userInput) return res.status(400).json({ error: '缺少 userInput' });

    const systemPrompt = `你是视觉小说《天眼系统》的对话生成器。
你需要扮演角色【${speakerName}】回应玩家，并分析玩家的语气倾向。

【${speakerName}的设定】${personality || ''}
【当前场景】${context || '无'}

【任务】严格返回 JSON 格式（不要任何markdown标记），结构：
{"reply": "角色说的话", "tone": "倾向标签"}

【reply 要求】
- 用${speakerName}的口吻回应玩家
- 20-60字
- 只输出对话本身，不要旁白动作
- 保持角色性格，不要OOC
- 不要剧透未发生的剧情

【tone 标签】从 empathy / rational / hostile / decisive 中选一个最贴切的。

只能返回 JSON，不要任何其他内容。`;

    const result = await axios.post(
      DEEPSEEK_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.8,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + DEEPSEEK_KEY
        },
        timeout: 30000
      }
    );

    const raw = result.data.choices[0].message.content.trim();
    let reply = raw;
    let tone = 'rational';
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      reply = (parsed.reply || raw).trim()
        .replace(/^["「『]|["」』]$/g, '')
        .replace(/\n+/g, ' ');
      tone = ['empathy', 'rational', 'hostile', 'decisive'].includes(parsed.tone)
        ? parsed.tone : 'rational';
    } catch (e) {
      console.log('JSON解析失败，使用原始输出');
    }

    res.json({ reply, tone });
  } catch (err) {
    console.error('/api/chat 失败:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 结局生成代理
app.post('/api/ending', async (req, res) => {
  try {
    const { code, theme, profile } = req.body;
    if (!code || !profile) return res.status(400).json({ error: '缺少参数' });

    const systemPrompt = `你是视觉小说《天眼系统》的专属结局作家。根据玩家数据生成一段独一无二、有情感冲击力的结局后记。

【结局主题】${theme || '你的故事'}（代号：${code}）

【故事背景】天眼系统是一款养老院远程AI辅助问诊项目。林茜（发现问题的人）、赵则言（流程派）、刘朝闻（主管）立场不同。玩家的选择决定故事走向与三人的命运，也可能影响一位老人是否存活。

【玩家画像】
- 游玩时长：${profile.playTime || '未知'}
- 主导性格：${profile.tone || '未知'}
- 倾向分数：共情 ${profile.scores?.empathy || 0} · 理性 ${profile.scores?.rational || 0} · 决断 ${profile.scores?.decisive || 0} · 冷漠 ${profile.scores?.hostile || 0}
- AI对话次数：${profile.aiInteractions || 0}
- 关键行为：${profile.events || '无'}
- 最近选择：${profile.choiceSummary || '无'}

【生成要求】
1. 用第二人称"你"叙述，直接和玩家对话
2. 呼应玩家具体选择，提及林茜/赵则言/刘朝闻中至少一人的命运变化
3. 文字有文学性、诗意和余韵，不能流水账
4. 结尾要有一句让玩家回味的话
5. 不要输出标题、系统数据、markdown
6. 只返回结局正文，200-350字`;

    const result = await axios.post(
      DEEPSEEK_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: '请为我生成这段独特的结局后记。' }
        ],
        temperature: 0.92,
        max_tokens: 600
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + DEEPSEEK_KEY
        },
        timeout: 45000
      }
    );

    const content = result.data.choices[0].message.content.trim();
    res.json({ content });
  } catch (err) {
    console.error('/api/ending 失败:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('天眼后端代理已启动：http://localhost:' + PORT);
  console.log('请确保小程序后台已配置 request 合法域名');
});
