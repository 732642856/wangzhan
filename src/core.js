import { createScreenplayDocFromFountain, exportScreenplayDocToFountain } from "./opendraft/format.js";

const DEFAULT_FOUNTAIN = `Title: 星轨试写
Author: Personal Screenwriter

INT. 作家房间 - NIGHT

编剧
我们不再从空白页开始。

EXT. 天台 - DAWN

导演
让剧本自己长出场景、人物和镜头。`;

const DEFAULT_TAG_FIELD_MAPPINGS = {
  writing: "turnType",
  character: "adaptationFunction",
  structure: "conflictGoal",
  emotion: "exitChange",
  relationship: "sourceReference",
  world: "conflictGoal",
};

export function getWritingTypeConfig(writingType = "screenplay") {
  if (writingType === "literary-screenplay") {
    return {
      writingType: "literary-screenplay",
      editorTitle: "文学剧本写作台",
      navigationLabel: "章节/场次",
      primaryTools: ["场次", "段落", "人物", "旁白"],
      aiFocus: ["文学表达", "人物弧线", "场景推进", "改编母本"],
    };
  }

  return {
    writingType: "screenplay",
    editorTitle: "剧本写作台",
    navigationLabel: "Scene",
    primaryTools: ["Scene", "Action", "Character", "Dialogue", "Paren"],
    aiFocus: ["场景功能", "节拍", "对白行动", "分镜下游"],
  };
}

export function getWritingWorkbenchDefaults(writingType = "screenplay") {
  if (writingType === "literary-screenplay") {
    return {
      aiTask:
        "用文学剧本视角做一次会诊：主题概念、情境建构、人物关系压力、关键场面功能、对白行动和下一步改写顺序。",
      selectedTemplateIds: ["structuralist-screenwriting", "film-perusal-method", "verbal-action-dialogue"],
      selectedWorkflowId: "novel-adaptation-film",
    };
  }
  return {
    aiTask: "做一次剧本医生诊断：结构、人物动机、场景功能、对白问题和下一步改写清单。",
    selectedTemplateIds: ["scene-function", "dialogue-action", "character-arc"],
    selectedWorkflowId: "short-drama-mystery",
  };
}

const KNOWLEDGE_TEMPLATES = [
  {
    id: "scene-function",
    title: "单场戏功能",
    source: "WorkBuddy 北电编剧笔记 / 单场戏设计",
    rules: [
      "每场戏必须改变人物关系、信息状态或行动方向。",
      "入场前明确人物目标，离场后明确局势变化。",
      "删掉只解释背景、不产生行动后果的场次。",
    ],
  },
  {
    id: "character-arc",
    title: "人物弧光",
    source: "星轨人生 / 人物小传 / 角色 20 问",
    rules: [
      "人物的欲望、恐惧、误信念和代价要能驱动选择。",
      "小传不是履历，要服务于当前故事中的行动压力。",
      "每个重要人物都应有可观察的关系变化。",
    ],
  },
  {
    id: "dialogue-action",
    title: "对白行动",
    source: "对白写作书目 / WorkBuddy 对白与场景笔记",
    rules: [
      "对白不是信息搬运，而是人物用语言争取、躲避、试探或攻击。",
      "同一段对白里，角色表面说的和真正想要的应有张力。",
      "删掉能用动作、选择或沉默表达的说明性台词。",
    ],
  },
  {
    id: "story-engine",
    title: "故事引擎",
    source: "星轨故事 / 故事引擎 skills",
    rules: [
      "先确认核心冲突能否持续生产场景，而不是只确认设定有趣。",
      "每个段落都要推进问题升级、选择变窄或代价增大。",
      "类型承诺要在关键节点兑现：悬疑给线索，爱情给关系选择，犯罪给道德压力。",
    ],
  },
  {
    id: "collaboration-review",
    title: "协作审稿",
    source: "Laper 对标 / WorkBuddy 协作碎片",
    rules: [
      "反馈必须指向具体场次、人物或对白，不写泛泛评价。",
      "区分问题、证据、修改建议，避免把偏好伪装成规则。",
      "版本快照需要能说明本次改动的目的。",
    ],
  },
  {
    id: "beat-loop",
    title: "节拍循环",
    source: "WorkBuddy 北电编剧笔记 / 单场戏设计原理",
    rules: [
      "把场戏拆成动作-反应-再行动的连续节拍，检查每次反应是否制造新的小偏差。",
      "每场戏至少要有明确目标、阻碍、价值变化和一个小转折。",
      "若结尾只是兑现预期且不引发新走向，可以考虑提前切出，把想象留给观众。",
    ],
  },
  {
    id: "multi-line",
    title: "多线叙事",
    source: "WorkBuddy 北电编剧笔记 / 多主角与多线叙事",
    rules: [
      "先让每条单线都成立，再追求复杂交叉；薄弱单线不会因为结构复杂而变强。",
      "判断主角不是看戏份，而是看观众是否关心他能不能达成目标。",
      "多线交汇要产生因果影响，而不是只做剪辑上的轮换。",
    ],
  },
  {
    id: "five-step-pipeline",
    title: "五步创作流水线",
    source: "星轨故事 / AI 剧本写作系统方案",
    rules: [
      "从创意到视觉输出按大纲、人物、剧本、分镜、画面提示词分步确认。",
      "每一步都要允许创作者确认或修改，再进入下一步。",
      "剧本输出要能继续转成分镜和画面提示词，避免只停在文字稿。",
    ],
  },
  {
    id: "worldview-pressure",
    title: "世界观压力",
    source: "WorkBuddy worldview-integrator / 25 维世界观",
    rules: [
      "世界观不是背景介绍，而是政治、经济、家庭、法律、媒体、犯罪等维度对人物选择施压。",
      "每个核心设定都要能改变角色可选行动、风险代价或关系边界。",
      "优先挑 3 到 5 个和类型最相关的世界维度，不要堆满百科式设定。",
    ],
  },
  {
    id: "character-20-questions",
    title: "角色 20 问",
    source: "WorkBuddy character-20-questions.js / 星轨人生",
    rules: [
      "人物小传要覆盖家庭、童年、职业、信念、恐惧、关系、目标和死亡观。",
      "只保留会影响当前故事选择的问题，避免写成无用档案。",
      "每个答案都要能转译成行为、对白、关系压力或场景反应。",
    ],
  },
  {
    id: "storyboard-continuity",
    title: "分镜连续性",
    source: "WorkBuddy StarCanvas 分镜代码 / 星轨分镜撰写技法",
    rules: [
      "每个镜头 brief 要同时包含画面、景别/运动、对白/声音、字幕意图和交接备注。",
      "重复出现的人物必须保留稳定的脸、服装、道具、色彩和身份线索。",
      "分镜提示词要写清镜头目的和戏剧节拍，不只描述画面好看。",
    ],
  },
  {
    id: "mystery-info-control",
    title: "悬疑信息控制",
    source: "六壬探案-wyn / 悬疑场景模板库 / 反侦察技法库",
    rules: [
      "悬念来自信息控制：观众、主角、嫌疑人三方知道的信息必须有差异。",
      "推理要通过可拍到的发现、动作和证据展示，不靠心理独白或解释性台词。",
      "反侦察手段要留下可回收的破绽，过度完美会削弱可信度。",
    ],
  },
  {
    id: "folk-visual-redlines",
    title: "民俗视听红线",
    source: "民俗-wyn / 专业剧本创作模块",
    rules: [
      "民俗元素要转成可拍的仪式、物件、空间和行为，不停留在设定说明。",
      "剧本中不写摄影机拍不到的心理判断，用动作和选择替代解释。",
      "民间叙事要保持清晰的伦理回响：善恶、因果、报应或情义必须有落点。",
    ],
  },
  {
    id: "romance-subtext",
    title: "情感潜文本",
    source: "情感戏-wyn / 高级创作",
    rules: [
      "最强的情感常常不被直接说出，要借动作、习惯、物件和未说完的话表达。",
      "甜场景靠专属习惯和私人笑点，虐场景靠误会、克制和真相揭开，不靠喊口号。",
      "情感线要有相遇、吸引、危机、真相、选择的阶段变化。",
    ],
  },
  {
    id: "director-model-review",
    title: "导演模型审查",
    source: "顶级编剧导演思维蒸馏-wyn / script-doctor / extraction-framework",
    rules: [
      "用多个创作者模型并行审查，但每条意见必须落到具体问题、建议和操作。",
      "优先问：谁在乎、这是真的吗、观众什么时候知道什么、冲突是否可拍。",
      "参考案例只提供学习点，不把案例当模板硬套。",
    ],
  },
  {
    id: "dark-humor",
    title: "黑色幽默",
    source: "六壬探案-wyn / dark-humor-dialogue.md",
    rules: [
      "黑色幽默不是讲笑话，而是用平静日常的语气处理残酷处境。",
      "笑点来自身份反差、场合错位、预期反转或沉默动作。",
      "灾难越大，语气越轻，但人物不能变成段子机器。",
    ],
  },
  {
    id: "structuralist-screenwriting",
    title: "结构主义编剧法",
    source: "《拉片子 2：结构主义编剧法讲义》",
    rules: [
      "先把主题概念说清，再把主题转成情境建构，最后再进入情节布局，不要直接跳到事件堆砌。",
      "情境要拆成人物关系、事件和环境三个面，检查它们是否共同对人物行动形成压力。",
      "场面写作要用情境逻辑模式推演动作：人物为什么此刻行动、行动如何遭遇阻力、阻力怎样逼出下一步选择。",
      "情节布局不是流水账，要检查迭代、递归和层级嵌套是否真的在放大同一核心问题。",
      "每场戏都要回到主题分形和情境分形，避免局部精彩却偏离总情境。",
    ],
  },
  {
    id: "film-perusal-method",
    title: "拉片方法",
    source: "《拉片子 1：电影电视编剧讲义》",
    rules: [
      "拉片不是复述剧情，而是逐镜头、逐动作、逐句台词检查结构、情境和技法如何发生作用。",
      "先按开场、开端部、发展部、高潮部、结尾部拆开全片，再判断每一段承担什么结构任务。",
      "戏剧体重点检查从高潮看统一性，叙事体重点检查从开场看统一性，别把两套原则混用。",
      "开场必须同时交代情境起点、人物关系、风格体裁或悬念机制，不能只是好看。",
      "看片笔录优先记录动作、台词和转折，不先写主观感想，先尊重作品怎样运转。",
    ],
  },
  {
    id: "verbal-action-dialogue",
    title: "对白行动进攻",
    source: "《对白：文字、舞台、银幕的言语行为艺术》",
    rules: [
      "对白是一种行动，角色说每句话都在争取、试探、安抚、误导、施压或反击，而不只是传递信息。",
      "一段对白至少要看见文本和潜文本两层：嘴上说什么，真正想推动什么。",
      "每轮对白交错都应形成行动/反应节拍，让场景状态发生变化，而不是原地解释。",
      "能演出来的就别讲出来，说明性台词、写在鼻子上的信息和重复表达要优先删减。",
      "检查对白瑕疵时，重点看可信性、语言陈词、内容重复和设计失真，而不是只修辞藻。",
    ],
  },
  {
    id: "opening-scene-diagnosis",
    title: "开场场景诊断",
    source: "《拉片子 1》+《拉片子 2》",
    rules: [
      "开场必须同时交代情境起点、人物关系、风格体裁、悬念机制或主题方向，不能只给气氛。",
      "判断这是戏剧体热开场还是叙事体冷开场，再检查它是否真的承担了从高潮看统一性或从开场看统一性的统领任务。",
      "开场里的动作、台词和例证性细节要能预埋后文，而不是与主体冲突脱节。",
      "若是改编作品，开场要优先显出改编后的核心立场，而不是机械复写原作序章。",
    ],
  },
  {
    id: "turning-scene-diagnosis",
    title: "转折场景诊断",
    source: "《对白》+《拉片子 1》",
    rules: [
      "转折场景必须由行动/反应节拍累积而成，最终让信息、关系、命运或策略发生可感知变化。",
      "检查发现与突转是否来自可拍动作、证据或言语试探，而不是作者硬塞答案。",
      "对白中的潜文本要在转折点前后发生位移，角色不能从头到尾只重复同一种姿态。",
      "转折一旦发生，就要立刻改变下一步行动方向，而不是只留下感受。",
    ],
  },
  {
    id: "climax-scene-diagnosis",
    title: "高潮场景诊断",
    source: "《拉片子 1》+《对白》",
    rules: [
      "高潮场景要把动作、情感、命运或主题压到最强冲突点，不能只是声音更大、哭得更多。",
      "戏剧体高潮重点检查是否把动作、性格、情感、命运、主题、视听统一在同一个冲突核心上。",
      "关键信息揭露要像武器一样使用，放在最能改变双方选择的位置，而不是提前泄尽。",
      "高潮对白必须带行动目的，角色说出口的话要直接推动胜负、暴露、决裂或选择。",
    ],
  },
  {
    id: "ending-scene-diagnosis",
    title: "结尾场景诊断",
    source: "《拉片子 1》+《拉片子 2》+《对白》",
    rules: [
      "结尾不是收尾说明，而是对前面冲突、情境和主题的最后归纳与落点。",
      "叙事体要检查结尾是否与开场首尾呼应，形成收煞；戏剧体要检查高潮后的余波是否足够干净。",
      "结尾场景里的对白要么完成选择，要么保留余震，不能回到解释模式。",
      "若是情感或改编题材，结尾必须明确人物关系和主题立场有没有真正变化。",
    ],
  },
];

const AI_TASK_PRESETS = [
  {
    id: "script-doctor",
    title: "剧本医生",
    task: "做一次剧本医生诊断：结构、人物动机、场景功能、对白问题、连续性风险和下一步改写清单。",
    templateIds: ["scene-function", "character-arc", "dialogue-action", "collaboration-review"],
  },
  {
    id: "scene-rewrite",
    title: "场次改写",
    task: "选择问题最大的三场戏，给出每场戏的功能判断、冲突升级方案和可直接改写的新版场景方向。",
    templateIds: ["scene-function", "story-engine"],
  },
  {
    id: "character-bible",
    title: "人物小传",
    task: "从当前剧本抽取主要人物，生成可继续写作的人物小传：欲望、恐惧、误信念、关系压力、行为习惯和可拍的外化细节。",
    templateIds: ["character-arc"],
  },
  {
    id: "dialogue-pass",
    title: "对白增强",
    task: "检查对白是否在行动、试探、遮掩或攻击；指出说明性台词，并给出更有潜台词和人物差异的替代表达。",
    templateIds: ["dialogue-action", "scene-function"],
  },
  {
    id: "short-drama-breakdown",
    title: "短剧拆集",
    task: "把当前故事拆成短剧集纲：每集钩子、反转、人物推进、结尾悬念和下一集承接。",
    templateIds: ["story-engine", "scene-function"],
  },
  {
    id: "storyboard-prompts",
    title: "分镜提示词",
    task: "按场次生成镜头提示词：镜头目的、景别、人物行动、情绪、场景调度、可视化细节和连续性注意事项。",
    templateIds: ["scene-function", "story-engine"],
  },
  {
    id: "beat-audit",
    title: "节拍审查",
    task: "逐场检查动作-反应节拍：目标、阻碍、价值变化、小转折、是否可提前切出，并给出最省改动的加强方案。",
    templateIds: ["beat-loop", "scene-function"],
  },
  {
    id: "multi-line-audit",
    title: "多线审查",
    task: "检查当前故事是否存在多主角或多线结构：每条线是否独立精彩、观众是否关心、线与线是否有因果交汇。",
    templateIds: ["multi-line", "story-engine"],
  },
  {
    id: "worldview-audit",
    title: "世界观施压",
    task: "从政治、经济、家庭、法律、媒体、犯罪、民俗等维度挑出最能给人物制造压力的设定，并说明如何落到场景选择里。",
    templateIds: ["worldview-pressure", "story-engine"],
  },
  {
    id: "five-step-production",
    title: "五步成片",
    task: "把当前项目推进成五步工作流：大纲确认、人物侧写、完整剧本、文字分镜、画面/ComfyUI 提示词，并列出下一步要补的信息。",
    templateIds: ["five-step-pipeline", "character-20-questions", "storyboard-prompts"],
  },
  {
    id: "character-interrogation",
    title: "角色审问",
    task: "用角色 20 问方法审问主要人物，只输出会影响剧情选择的答案，并转成可拍的行为、对白和关系压力。",
    templateIds: ["character-20-questions", "character-arc"],
  },
  {
    id: "storyboard-brief",
    title: "分镜生产 brief",
    task: "把当前剧本按场次拆成镜头生产 brief：镜头目的、景别、运动、人物身份连续性、对白/声音、字幕意图、交接风险。",
    templateIds: ["storyboard-continuity", "scene-function", "five-step-pipeline"],
  },
  {
    id: "mystery-doctor",
    title: "悬疑会诊",
    task: "从信息控制、线索破绽、反侦察、嫌疑人博弈和可拍性角度审查当前悬疑段落，并给出改写方案。",
    templateIds: ["mystery-info-control", "director-model-review", "dark-humor"],
  },
  {
    id: "folk-adaptation",
    title: "民俗改编",
    task: "把当前故事加入民俗/志怪/传说质感：提炼仪式、物件、禁忌、因果和伦理回响，并转成可拍场景。",
    templateIds: ["folk-visual-redlines", "worldview-pressure", "scene-function"],
  },
  {
    id: "romance-pass",
    title: "情感戏打磨",
    task: "检查情感线的相遇、吸引、危机、真相和选择；把直白表达改为动作、物件、沉默和潜文本。",
    templateIds: ["romance-subtext", "dialogue-action", "character-arc"],
  },
  {
    id: "director-panel-review",
    title: "导演会诊",
    task: "用导演/编剧模型做对抗性会诊：指出最关键的 5 个问题，每个问题必须给出证据、模型视角和可执行修改。",
    templateIds: ["director-model-review", "scene-function", "mystery-info-control", "romance-subtext"],
  },
  {
    id: "structuralist-diagnosis",
    title: "结构主义会诊",
    task: "用结构主义编剧法审查当前项目：提炼主题概念、情境建构、情节布局、情境逻辑模式和递归层级，指出最关键的结构断裂。",
    templateIds: ["structuralist-screenwriting", "story-engine", "scene-function"],
  },
  {
    id: "perusal-breakdown",
    title: "拉片拆解",
    task: "按拉片方法拆解当前剧本或影片方案：开场、开端部、发展部、高潮部、结尾部各自承担什么任务，统一性由什么实现。",
    templateIds: ["film-perusal-method", "beat-loop", "scene-function"],
  },
  {
    id: "dialogue-action-pass",
    title: "对白行动会诊",
    task: "逐场检查对白是否构成行动：谁在争取什么、潜文本是什么、哪里在解释、哪里应该改成冲突或沉默。",
    templateIds: ["verbal-action-dialogue", "dialogue-action", "romance-subtext"],
  },
  {
    id: "adaptation-fractal-pass",
    title: "改编分形审查",
    task: "从主题分形、情境分形和情节分形角度检查当前改编稿，判断原作核心是否被正确转成可拍的人物关系、事件和环境结构。",
    templateIds: ["structuralist-screenwriting", "film-perusal-method", "worldview-pressure"],
  },
  {
    id: "scene-conflict-pass",
    title: "场景冲突校正",
    task: "把单场戏拆成动作/反应节拍和对白行动，检查目标、阻碍、转折、潜文本和离场变化，并给出最省改动的重写方向。",
    templateIds: ["verbal-action-dialogue", "scene-function", "beat-loop"],
  },
  {
    id: "mystery-scene-pack",
    title: "悬疑场景包",
    task: "按悬疑场景工作流会诊当前段落：先判断开场是否埋钩，再检查信息控制、发现与突转、关键转折和高潮揭示是否成立。",
    templateIds: ["mystery-info-control", "turning-scene-diagnosis", "climax-scene-diagnosis", "verbal-action-dialogue"],
  },
  {
    id: "romance-scene-pack",
    title: "情感场景包",
    task: "按情感场景工作流检查当前段落：相遇/试探是否成立，潜文本是否饱满，转折是否改写关系，结尾是否留下情绪余震。",
    templateIds: ["romance-subtext", "verbal-action-dialogue", "turning-scene-diagnosis", "ending-scene-diagnosis"],
  },
  {
    id: "adaptation-scene-pack",
    title: "改编场景包",
    task: "按改编场景工作流会诊当前项目：检查开场立场、主题分形、情境分形、关键场面推演和结尾落点，判断原作精神是否真正转成可拍戏剧。",
    templateIds: ["structuralist-screenwriting", "opening-scene-diagnosis", "film-perusal-method", "ending-scene-diagnosis"],
  },
];

const WORKFLOW_PRESETS = [
  {
    id: "short-drama-mystery",
    title: "短剧悬疑",
    description: "适合 8 到 20 集短剧、强钩子、高反转、信息控制明确的悬疑项目。",
    source: "星轨故事 六壬探案 + AI剧本系统五步流程 + 三本书场景诊断卡",
    stages: [
      {
        id: "hook-and-secret",
        title: "钩子与秘密设计",
        goal: "先确认开场钩子、核心秘密、观众/主角/嫌疑人三方信息差。",
        taskPresetId: "mystery-scene-pack",
      },
      {
        id: "episode-beats",
        title: "拆集与反转节拍",
        goal: "把主线拆成集纲，明确每集发现、误导、反转和尾钩。",
        taskPresetId: "short-drama-breakdown",
      },
      {
        id: "scene-pressure",
        title: "场景冲突校正",
        goal: "逐场检查目标、阻碍、破绽、突转和对白行动，确保悬疑不是解释出来的。",
        taskPresetId: "scene-conflict-pass",
      },
      {
        id: "doctor-pass",
        title: "悬疑会诊",
        goal: "复核线索回收、反侦察合理性、高潮揭示和连续性风险。",
        taskPresetId: "mystery-doctor",
      },
      {
        id: "shot-brief",
        title: "分镜生产 Brief",
        goal: "把定稿场景转成可交付的镜头 brief，方便进入分镜和画面生成。",
        taskPresetId: "storyboard-brief",
      },
    ],
  },
  {
    id: "urban-romance",
    title: "都市情感",
    description: "适合都市爱情、关系成长、亲密拉扯和潜文本表达为核心的项目。",
    source: "情感戏-wyn + 星轨人生人物小传 + 《对白》对白行动卡",
    stages: [
      {
        id: "relationship-core",
        title: "关系核心设定",
        goal: "先确认双方 wants / needs / 误信念 / 关系障碍，避免只有糖点没有关系引擎。",
        taskPresetId: "romance-scene-pack",
      },
      {
        id: "character-bible-pass",
        title: "人物小传加压",
        goal: "把主要人物的家庭、职业、情感创伤和欲望翻成可拍行为。",
        taskPresetId: "character-bible",
      },
      {
        id: "dialogue-subtext",
        title: "潜文本对白打磨",
        goal: "把直说改成试探、回避、抱怨、沉默和动作，让关系在对白里移动。",
        taskPresetId: "dialogue-action-pass",
      },
      {
        id: "relationship-turn",
        title: "关系转折校正",
        goal: "检查相遇、吸引、危机、真相、选择五阶段是否都形成了关系变化。",
        taskPresetId: "romance-pass",
      },
      {
        id: "scene-and-ending",
        title: "单场与结尾复核",
        goal: "确认每场情感戏既有功能变化，也在结尾留下余震，而不是用台词解释心情。",
        taskPresetId: "ending-scene-diagnosis",
      },
    ],
  },
  {
    id: "novel-adaptation-film",
    title: "小说改编电影",
    description: "适合长篇小说改编电影，优先处理主题立场、情境压缩、结构取舍和关键场面电影化。",
    source: "结构主义编剧法 + 拉片方法 + AI剧本系统改编输出模板",
    stages: [
      {
        id: "adaptation-position",
        title: "改编立场与主题分形",
        goal: "先决定电影版到底站在谁的视角、强调哪条主题线，以及删改原则。",
        taskPresetId: "adaptation-scene-pack",
      },
      {
        id: "fractal-audit",
        title: "情境/情节分形审查",
        goal: "检查原作的人物关系、事件链、环境压力是否已经转成电影可拍情境。",
        taskPresetId: "adaptation-fractal-pass",
      },
      {
        id: "structure-pass",
        title: "结构主义会诊",
        goal: "用主题概念、情境建构、布局层级重新审视电影结构，避免只做小说摘要。",
        taskPresetId: "structuralist-diagnosis",
      },
      {
        id: "perusal-check",
        title: "关键场面拉片对照",
        goal: "把开场、发展、高潮、结尾拆成电影任务，判断是否具备银幕统一性和节奏推进。",
        taskPresetId: "perusal-breakdown",
      },
      {
        id: "film-brief",
        title: "电影分场与镜头准备",
        goal: "将关键场面转成分场与镜头生产 brief，为后续导演和分镜协作做准备。",
        taskPresetId: "storyboard-brief",
      },
    ],
  },
];

export function createProject(input = {}) {
  const inputScreenplayDoc = input.screenplayDoc || null;
  const writingType = input.writingType || "screenplay";
  const hasInputFountain = Object.prototype.hasOwnProperty.call(input, "fountain");
  const fallbackFountain = hasInputFountain
    ? normalizeNewlines(input.fountain ?? "")
    : inputScreenplayDoc
      ? ""
      : DEFAULT_FOUNTAIN;
  const docFountain = inputScreenplayDoc ? normalizeNewlines(exportScreenplayDocToFountain(inputScreenplayDoc) || "") : "";
  const prefersFountain = inputScreenplayDoc && hasInputFountain && docFountain && fallbackFountain !== docFountain;
  const fountain = prefersFountain ? fallbackFountain : normalizeNewlines(docFountain || fallbackFountain);
  const screenplayDoc = prefersFountain
    ? createScreenplayDocFromFountain(fallbackFountain)
    : inputScreenplayDoc || createScreenplayDocFromFountain(fallbackFountain);
  const parsed = parseFountain(fountain);
  const title = input.title || parsed.title || "未命名剧本";
  const bible = normalizeBible(input.bible);
  const shotPlan = normalizeShotPlan(input.shotPlan);
  const scriptNotes = normalizeScriptNotes(input.scriptNotes);
  const tagCategories = normalizeTagCategories(input.tagCategories);
  const tagFieldMappings = normalizeTagFieldMappings(input.tagFieldMappings);
  const tags = normalizeTags(input.tags);
  const doctorActions = normalizeDoctorActions(input.doctorActions);

  return {
    schema: "personal-screenwriter.project.v1",
    id: input.id || `psw-${Date.now()}`,
    writingType,
    title,
    updatedAt: input.updatedAt || new Date().toISOString(),
    fountain,
    screenplayDoc,
    parsed,
    bible,
    notes: input.notes || "",
    scriptNotes,
    tagCategories,
    tagFieldMappings,
    tags,
    doctorActions,
    assets: Array.isArray(input.assets) ? input.assets : [],
    versions: Array.isArray(input.versions) ? input.versions : [],
    shotPlan,
  };
}

export function parseFountain(text) {
  const lines = normalizeNewlines(text).split("\n");
  const metadata = {};
  const blocks = [];
  const scenes = [];
  const characters = new Map();
  let activeCharacter = null;
  let activeScene = null;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const line = raw.trim();
    if (!line) {
      activeCharacter = null;
      continue;
    }

    const meta = line.match(/^([A-Za-z][A-Za-z ]+):\s*(.+)$/);
    if (meta && blocks.length === 0) {
      metadata[meta[1].trim().toLowerCase()] = meta[2].trim();
      continue;
    }

    if (isSceneHeading(line)) {
      const scene = {
        id: `scene-${scenes.length + 1}`,
        heading: stripForcedSceneHeading(line),
        index: scenes.length + 1,
        location: extractLocation(line),
        time: extractSceneTime(line),
        line: index + 1,
        synopsis: "",
      };
      scenes.push(scene);
      activeScene = scene;
      blocks.push({ type: "scene", text: scene.heading, sceneId: scene.id });
      activeCharacter = null;
      continue;
    }

    if (line.startsWith("=") && activeScene) {
      activeScene.synopsis = line.replace(/^=\s*/, "");
      blocks.push({ type: "synopsis", text: activeScene.synopsis, sceneId: activeScene.id });
      continue;
    }

    if (isTransition(line)) {
      blocks.push({ type: "transition", text: line, sceneId: activeScene?.id || null });
      activeCharacter = null;
      continue;
    }

    if (isParenthetical(line) && activeCharacter) {
      blocks.push({
        type: "parenthetical",
        text: line,
        character: activeCharacter,
        sceneId: activeScene?.id || null,
      });
      continue;
    }

    if (isCharacterCue(line, lines, index)) {
      activeCharacter = line.replace(/^@/, "").replace(/\s*\^$/, "").trim();
      if (!characters.has(activeCharacter)) {
        characters.set(activeCharacter, {
          name: activeCharacter,
          scenes: new Set(),
          lines: 0,
        });
      }
      if (activeScene) characters.get(activeCharacter).scenes.add(activeScene.id);
      blocks.push({ type: "character", text: activeCharacter, sceneId: activeScene?.id || null });
      continue;
    }

    if (activeCharacter) {
      const character = characters.get(activeCharacter);
      character.lines += 1;
      if (activeScene) character.scenes.add(activeScene.id);
      blocks.push({
        type: "dialogue",
        text: line,
        character: activeCharacter,
        sceneId: activeScene?.id || null,
      });
      continue;
    }

    blocks.push({ type: "action", text: line, sceneId: activeScene?.id || null });
  }

  return {
    title: metadata.title || "",
    author: metadata.author || "",
    metadata,
    scenes,
    characters: [...characters.values()].map((character) => ({
      ...character,
      scenes: [...character.scenes],
    })),
    blocks,
  };
}

export function summarizeProject(project) {
  const parsed = project.parsed || parseFountain(project.fountain || "");
  const words = tokenize(project.fountain || "");
  const bibleCharacters = project.bible?.characters?.map((item) => item.name).filter(Boolean) || [];
  const parsedCharacters = parsed.characters.map((item) => item.name);
  const locations = new Set([
    ...parsed.scenes.map((scene) => scene.location).filter(Boolean),
    ...(project.bible?.locations?.map((item) => item.name).filter(Boolean) || []),
  ]);

  return {
    title: project.title || parsed.title || "未命名剧本",
    sceneCount: parsed.scenes.length,
    characterCount: new Set([...parsedCharacters, ...bibleCharacters]).size,
    locationCount: locations.size,
    beatCount: parsed.blocks.filter((block) => block.type === "dialogue" || block.type === "action").length,
    frameCount: project.shotPlan?.shots?.length || 0,
    relationCount: parsed.characters.reduce((sum, character) => sum + character.scenes.length, 0) + bibleCharacters.length * Math.max(1, parsed.scenes.length),
    wordCount: words.length,
    estimatedMinutes: Math.max(1, Math.round(words.length / 180)),
    updatedAt: project.updatedAt || "",
  };
}

export function buildProjectCatalog(project) {
  const current = createProject(project);
  const sceneLocations = current.parsed.scenes.map((scene) => scene.location).filter(Boolean);
  const locations = [
    ...current.bible.locations,
    ...sceneLocations.map((name) => ({ name, notes: "剧本场景" })),
  ].filter((item, index, list) => item.name && list.findIndex((next) => next.name === item.name) === index);
  return {
    Scenes: current.parsed.scenes.map((scene) => ({ id: scene.id, name: scene.heading, notes: scene.synopsis || scene.time || "" })),
    Characters: [
      ...current.parsed.characters.map((character) => ({ name: character.name, notes: `${character.scenes.length} 场` })),
      ...current.bible.characters,
    ].filter((item, index, list) => item.name && list.findIndex((next) => next.name === item.name) === index),
    Props: current.bible.props,
    Locations: locations,
    Assets: current.assets,
  };
}

export function buildBreakdownBoard(project) {
  const current = createProject(project);
  const blocksByScene = groupBlocksByScene(current.parsed.blocks);
  const charactersByScene = current.parsed.characters.reduce((map, character) => {
    for (const sceneId of character.scenes) {
      map.set(sceneId, [...(map.get(sceneId) || []), character.name]);
    }
    return map;
  }, new Map());
  const catalog = buildProjectCatalog(current);
  const relationships = buildStoryExplorer(current).relationships;

  return {
    catalog,
    relationships,
    scenes: current.parsed.scenes.map((scene, index) => {
      const blocks = blocksByScene.get(scene.id) || [];
      return {
        id: scene.id,
        index: index + 1,
        heading: scene.heading,
        location: scene.location,
        time: scene.time,
        characters: charactersByScene.get(scene.id) || [],
        beatCount: blocks.filter((block) => block.type === "dialogue" || block.type === "action").length,
      };
    }),
  };
}

export function createProjectLibrary(input = {}) {
  const projects = (Array.isArray(input.projects) ? input.projects : [])
    .map((project) => createProject(project))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const activeProjectId = input.activeProjectId || projects[0]?.id || "";

  return {
    schema: "personal-screenwriter.library.v1",
    activeProjectId,
    projects,
    save(project) {
      const nextProject = createProject({ ...project, updatedAt: new Date().toISOString() });
      return createProjectLibrary({
        activeProjectId: nextProject.id,
        projects: [nextProject, ...projects.filter((item) => item.id !== nextProject.id)],
      });
    },
    select(projectId) {
      const project = projects.find((item) => item.id === projectId) || projects[0] || createProject();
      return { library: createProjectLibrary({ activeProjectId: project.id, projects }), project };
    },
    delete(projectId) {
      const nextProjects = projects.filter((item) => item.id !== projectId);
      return createProjectLibrary({ activeProjectId: nextProjects[0]?.id || "", projects: nextProjects });
    },
  };
}

export function serializeProjectLibrary(library) {
  const current = createProjectLibrary(library);
  return JSON.stringify({
    schema: current.schema,
    activeProjectId: current.activeProjectId,
    projects: current.projects,
  }, null, 2);
}

export function importProjectLibrary(text) {
  const data = typeof text === "string" ? JSON.parse(text) : text;
  if (data?.schema !== "personal-screenwriter.library.v1") {
    throw new Error("Invalid project library file");
  }
  return createProjectLibrary(data);
}

export function generateScriptDoctorReport(project) {
  const current = createProject(project);
  const summary = summarizeProject(current);
  const scenes = current.parsed.scenes;
  const characterNames = [
    ...new Set([
      ...current.parsed.characters.map((item) => item.name),
      ...(current.bible.characters || []).map((item) => item.name).filter(Boolean),
    ]),
  ];
  const findings = [
    scenes.length < 3
      ? "结构偏短：当前场次数少，建议补出开场钩子、转折场和结尾选择。"
      : `结构已成形：${scenes.length} 场可以先按开场、推进、转折、结尾标注功能。`,
    characterNames.length < 2
      ? "人物压力不足：至少补一个会阻碍主角目标的人物。"
      : `人物线索可用：已识别 ${characterNames.length} 个角色，下一步检查每人目标和代价。`,
    summary.locationCount < 2
      ? "空间变化不足：地点单一时，要用人物关系或信息差制造段落变化。"
      : `地点有变化：${summary.locationCount} 个地点可承担调查、对抗或转折功能。`,
    current.parsed.blocks.filter((block) => block.type === "dialogue").length < scenes.length
      ? "对白密度偏低：每场至少补一处人物用语言争取、试探或回避的动作。"
      : "对白可诊断：优先删解释性台词，把信息改成冲突、动作或沉默。",
  ];
  const nextActions = [
    "给每场写一句功能：这场改变了什么信息、关系或行动方向。",
    "给主要人物补目标、恐惧、误信念、代价四项。",
    "挑最弱一场重写：入场目标、阻碍、突转、离场变化必须清楚。",
  ];
  const actions = nextActions.map((text, index) => ({
    id: `doctor-action-${index + 1}`,
    text,
    prompt: `请处理这个剧本诊断任务：${text}\n\n项目：${summary.title}\n概览：${summary.sceneCount} 场 / ${summary.characterCount} 人物 / ${summary.locationCount} 地点。`,
    done: false,
  }));
  const markdown = [
    `# Script Doctor · ${summary.title}`,
    "",
    `概览：${summary.sceneCount} 场 / ${summary.characterCount} 人物 / ${summary.locationCount} 地点 / ${summary.wordCount} 字`,
    "",
    "## 诊断",
    ...findings.map((item) => `- ${item}`),
    "",
    "## 下一步",
    ...nextActions.map((item) => `- ${item}`),
  ].join("\n");

  return {
    title: summary.title,
    summary: `${summary.sceneCount} 场，${summary.characterCount} 人物，${summary.locationCount} 地点，约 ${summary.estimatedMinutes} 分钟。`,
    metrics: summary,
    findings,
    nextActions,
    actions,
    markdown,
  };
}

export function buildTextQualityReport(project) {
  const current = createProject(project);
  const board = buildBreakdownBoard(current);
  const catalog = buildProjectCatalog(current);
  const dialogueBlocks = current.parsed.blocks.filter((block) => block.type === "dialogue");
  const sceneFunctions = board.scenes.map((scene) => ({
    id: scene.id,
    heading: scene.heading,
    function: scene.characters.length ? "检查本场如何改变信息、关系或行动方向。" : "需补明确出场人物和行动压力。",
  }));
  const characterArcs = catalog.Characters.map((item) => ({
    name: item.name,
    arc: item.goal ? `目标：${item.goal}` : "需补目标、恐惧、误信念和代价。",
  }));
  const dialogueIssues = dialogueBlocks.map((block) => ({
    character: block.character || "未标人物",
    text: block.text,
    issue: "检查这句对白是否在争取、试探、回避或反击。",
  }));
  const rewritePriorities = generateScriptDoctorReport(current).nextActions;
  const markdown = [
    `# ${current.title} · Text Quality Report`,
    "",
    "## 场景功能表",
    ...sceneFunctions.map((item) => `- ${item.heading}：${item.function}`),
    "",
    "## 人物弧光",
    ...characterArcs.map((item) => `- ${item.name}：${item.arc}`),
    "",
    "## 对白问题清单",
    ...(dialogueIssues.length ? dialogueIssues.map((item) => `- ${item.character}：${item.text}｜${item.issue}`) : ["- 暂无对白，优先补行动性对白。"]),
    "",
    "## 改写优先级",
    ...rewritePriorities.map((item) => `- ${item}`),
  ].join("\n");
  return { title: `${current.title} · Text Quality Report`, sceneFunctions, characterArcs, dialogueIssues, rewritePriorities, markdown };
}

export function buildWritingControlReport(project) {
  const current = createProject(project);
  const status = summarizeProject(current);
  const doctor = generateScriptDoctorReport(current);
  const quality = buildTextQualityReport(current);
  const nextTask = doctor.actions[0]?.prompt || buildAiPacket(current).prompt;
  const markdown = [
    `# ${current.title} · Writing Control`,
    "",
    "## 当前状态",
    `- ${status.sceneCount} 场 / ${status.characterCount} 人物 / ${status.locationCount} 地点 / ${status.wordCount} 字`,
    "",
    "## Script Doctor",
    ...doctor.findings.map((item) => `- ${item}`),
    "",
    "## 文本质检",
    ...quality.rewritePriorities.map((item) => `- ${item}`),
    "",
    "## 下一步任务",
    nextTask,
  ].join("\n");
  return { title: `${current.title} · Writing Control`, status, doctor, quality, nextTask, markdown };
}

export function updateDoctorAction(project, actionId, patch = {}) {
  const current = createProject(project);
  return createProject({
    ...current,
    doctorActions: (current.doctorActions || []).map((action) => (
      action.id === actionId ? { ...action, ...patch } : action
    )),
  });
}

export function generateRewriteDraft(project, action = {}) {
  const current = createProject(project);
  const board = buildBreakdownBoard(current);
  const scene = board.scenes[0] || { heading: current.title, characters: [], id: "" };
  const passage = buildStoryExplorer(current).passages.find((item) => item.id === scene.id) || { text: current.fountain || "" };
  const assets = [...board.catalog.Props, ...board.catalog.Locations]
    .map((item) => item.name)
    .filter(Boolean)
    .slice(0, 8);
  const goal = action.text || generateScriptDoctorReport(current).nextActions[0];
  const prompt = [
    `请改写《${current.title}》中的场景：${scene.heading}`,
    `诊断任务：${goal}`,
    scene.characters.length ? `保留人物：${scene.characters.join("、")}` : "",
    assets.length ? `保留/强化对象：${assets.join("、")}` : "",
    "要求：只输出改写后的 Fountain 场景，保留可拍动作，用对白推动关系变化。",
    "",
    "原场景：",
    passage.text,
  ].filter(Boolean).join("\n");

  return {
    title: `${current.title} · 改写草案`,
    scene,
    characters: scene.characters,
    assets,
    action: goal,
    prompt,
  };
}

export function buildDeliveryPacket(project) {
  const current = createProject(project);
  const report = generateScriptDoctorReport(current);
  const draft = generateRewriteDraft(current, report.actions[0]);
  const board = buildBreakdownBoard(current);
  const edges = board.relationships.edges.map((edge) => `- ${edge.source} -> ${edge.target}`).join("\n") || "- 暂无关系线";
  const markdown = [
    `# ${current.title} · Delivery Packet`,
    "",
    "## Script Doctor",
    report.markdown,
    "",
    "## Rewrite Draft",
    draft.prompt,
    "",
    "## Relationship Board",
    edges,
    "",
    "## Script",
    "```fountain",
    current.fountain || exportFountain(current),
    "```",
  ].join("\n");
  return {
    filename: `${current.title || "screenwriter"}-delivery.md`,
    markdown,
  };
}

export function buildVisualDevelopmentPack(project) {
  const current = createProject(project);
  const catalog = buildProjectCatalog(current);
  const board = buildBreakdownBoard(current);
  const shots = generateShotPlan(current).shotPlan.shots.slice(0, 6);
  const assets = [
    ...catalog.Characters.map((item) => visualAsset("Character Portrait", item.name, `${item.role || ""} ${item.goal || item.notes || ""}`)),
    ...catalog.Locations.map((item) => visualAsset("Scene Still", item.name, item.notes || "cinematic location reference")),
    ...catalog.Props.map((item) => visualAsset("Prop Detail", item.name, item.notes || "hero prop close-up")),
    ...board.scenes.slice(0, 6).map((scene) => visualAsset("Scene Keyframe", scene.heading, `${scene.location || ""} ${scene.characters.join("、")}`)),
    ...shots.map((shot) => visualAsset("Storyboard Frame", `${shot.shotNumber}. ${shot.sceneHeading}`, `${shot.shotSize} ${shot.camera} ${shot.action}`)),
  ].filter((asset) => asset.name);
  const markdown = [
    `# ${current.title} · Visual Development Pack`,
    "",
    ...assets.map((asset) => `## ${asset.type} · ${asset.name}\n${asset.prompt}`),
  ].join("\n\n");
  return { title: `${current.title} · Visual Development Pack`, assets, markdown };
}

export function buildStoryExplorer(project) {
  const current = createProject(project);
  const scenes = current.parsed.scenes.length
    ? current.parsed.scenes
    : [{ id: "scene-1", index: 1, heading: current.title, location: "", time: "", synopsis: "" }];
  const blocksByScene = groupBlocksByScene(current.parsed.blocks);
  const passages = scenes.map((scene, index) => {
    const blocks = blocksByScene.get(scene.id) || [];
    const text = blocks
      .filter((block) => block.type !== "scene" && block.type !== "character")
      .map((block) => block.character ? `${block.character}: ${block.text}` : block.text)
      .join("\n")
      .trim();
    const nextScene = scenes[index + 1];
    return {
      id: scene.id,
      title: scene.heading || `章节 ${index + 1}`,
      text: text || scene.synopsis || "这一段还没有正文。",
      location: scene.location || "",
      choices: nextScene ? [{ label: `前往 ${nextScene.heading}`, targetId: nextScene.id }] : [],
    };
  });
  const clues = [
    ...(current.bible.props || []).map((item) => ({ type: "prop", title: item.name, notes: item.notes || "" })),
    ...(current.bible.rules || []).map((item) => ({ type: "rule", title: item.name, notes: item.notes || "" })),
  ].filter((item) => item.title);
  const characterNames = new Set([
    ...(current.bible.characters || []).map((item) => item.name).filter(Boolean),
    ...current.parsed.characters.map((item) => item.name),
  ]);
  const nodes = [
    ...[...characterNames].map((name) => ({ id: `character:${name}`, label: name, type: "character" })),
    ...scenes.map((scene) => ({ id: `scene:${scene.id}`, label: scene.location || scene.heading, type: "scene" })),
  ];
  const edges = current.parsed.characters.flatMap((character) =>
    character.scenes.map((sceneId) => ({
      id: `${character.name}->${sceneId}`,
      source: `character:${character.name}`,
      target: `scene:${sceneId}`,
      label: "出场",
    })),
  );
  return { title: current.title, activePassageId: passages[0]?.id || "", passages, clues, relationships: { nodes, edges } };
}

export function summarizeShotPlan(project) {
  const shots = project.shotPlan?.shots || [];
  const byShotSize = {};

  for (const shot of shots) {
    const key = shot.shotSize || "MS";
    byShotSize[key] = (byShotSize[key] || 0) + 1;
  }

  return {
    shotCount: shots.length,
    totalDuration: shots.reduce((sum, shot) => sum + Number(shot.duration || 0), 0),
    byShotSize,
  };
}

export function exportFountain(project) {
  return normalizeNewlines(project.fountain || "");
}

export function exportFdx(project) {
  const parsed = project.parsed || parseFountain(project.fountain || "");
  const titlePage = extractTitlePageMetadata(project.screenplayDoc, project.title, parsed.title);
  const paragraphs = parsed.blocks
    .map((block) => {
      const type = blockToFdxType(block.type);
      return `      <Paragraph Type="${escapeXml(type)}">\n        <Text>${escapeXml(block.text)}</Text>\n      </Paragraph>`;
    })
    .join("\n");

  const tagData = buildFdxTagData(project.tagCategories, project.tags);

  return `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<FinalDraft DocumentType="Script" Template="No" Version="1">
  <Content>
${paragraphs}
  </Content>
  <TitlePage>
    <Content>
      <Paragraph Type="Title">
        <Text>${escapeXml(titlePage.title)}</Text>
      </Paragraph>
${titlePage.author ? `      <Paragraph Type="Author">\n        <Text>${escapeXml(titlePage.author)}</Text>\n      </Paragraph>\n` : ""}${titlePage.credit ? `      <Paragraph Type="Credit">\n        <Text>${escapeXml(`Based on ${titlePage.credit}`)}</Text>\n      </Paragraph>\n` : ""}${titlePage.draftDate ? `      <Paragraph Type="Draft Date">\n        <Text>${escapeXml(titlePage.draftDate)}</Text>\n      </Paragraph>\n` : ""}${titlePage.contact ? `      <Paragraph Type="Contact">\n        <Text>${escapeXml(titlePage.contact)}</Text>\n      </Paragraph>\n` : ""}    </Content>
  </TitlePage>
${tagData}
</FinalDraft>`;
}

export function buildAiPacket(project, task = "剧本诊断") {
  const options = typeof task === "object" && task !== null ? task : arguments[2] || {};
  const taskText = typeof task === "string" ? task : task.task || "剧本诊断";
  const parsed = project.parsed || parseFountain(project.fountain || "");
  const summary = summarizeProject({ ...project, parsed });
  const selectedTemplates = selectKnowledgeTemplates(options.templateIds);
  const prompt = [
    "你是一个资深编剧顾问、剧本医生和故事结构编辑。",
    "请基于以下剧本、人物、场景和本地资料线索工作。",
    "输出必须具体、可执行，优先指出结构问题、人物动机、场景功能、连续性风险和下一步改写建议。",
    "",
    `任务：${taskText}`,
    "",
    "【可用编剧方法模板】",
    formatKnowledgeTemplates(selectedTemplates),
    "",
    "【剧本】",
    project.fountain || "",
    "",
    "【Story Bible】",
    JSON.stringify(project.bible || {}, null, 2),
    "",
    "【本地资产线索】",
    JSON.stringify(project.assets || [], null, 2),
  ].join("\n");

  return {
    task: taskText,
    context: {
      summary,
      scenes: parsed.scenes,
      characters: parsed.characters,
      bible: project.bible || {},
      assets: project.assets || [],
      templates: selectedTemplates,
    },
    prompt,
  };
}

export function getKnowledgeTemplates() {
  return KNOWLEDGE_TEMPLATES.map((template) => ({
    ...template,
    rules: [...template.rules],
  }));
}

export function getAiTaskPresets() {
  return AI_TASK_PRESETS.map((preset) => ({
    ...preset,
    templateIds: [...preset.templateIds],
  }));
}

export function getWorkflowPresets() {
  return WORKFLOW_PRESETS.map((workflow) => ({
    ...workflow,
    stages: workflow.stages.map((stage) => ({ ...stage })),
  }));
}

export function checkInVersion(project, message = "未命名 check-in", author = "Personal Screenwriter") {
  const current = createProject(project);
  const entry = {
    id: `version-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    label: message,
    kind: "checkin",
    author,
    createdAt: new Date().toISOString(),
    title: current.title,
    fountain: current.fountain,
    screenplayDoc: current.screenplayDoc,
    bible: current.bible,
    notes: current.notes,
    scriptNotes: current.scriptNotes,
    tagCategories: current.tagCategories,
    tagFieldMappings: current.tagFieldMappings,
    tags: current.tags,
    shotPlan: current.shotPlan,
    summary: summarizeProject(current),
  };
  return createProject({
    ...current,
    versions: [entry, ...(current.versions || [])].slice(0, 50),
  });
}

export function compareVersions(project, fromVersionId, toVersionId) {
  const current = createProject(project);
  const fromVersion = (current.versions || []).find((item) => item.id === fromVersionId);
  const toVersion = toVersionId
    ? (current.versions || []).find((item) => item.id === toVersionId)
    : {
        id: "current",
        label: "当前版本",
        fountain: current.fountain,
      };

  const fromLines = normalizeNewlines(fromVersion?.fountain || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const toLines = normalizeNewlines(toVersion?.fountain || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const { added, removed } = diffOrderedLines(fromLines, toLines);

  return {
    from: fromVersion ? { id: fromVersion.id, label: fromVersion.label } : null,
    to: toVersion ? { id: toVersion.id, label: toVersion.label } : null,
    added,
    removed,
    summary: `新增 ${added.length} 行，删除 ${removed.length} 行`,
  };
}

export function createVersionSnapshot(project, label = "未命名快照") {
  const current = createProject(project);
  const snapshot = {
    id: `version-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    label,
    kind: "snapshot",
    author: "Personal Screenwriter",
    createdAt: new Date().toISOString(),
    title: current.title,
    writingType: current.writingType,
    fountain: current.fountain,
    screenplayDoc: current.screenplayDoc,
    bible: current.bible,
    notes: current.notes,
    scriptNotes: current.scriptNotes,
    tagCategories: current.tagCategories,
    tagFieldMappings: current.tagFieldMappings,
    tags: current.tags,
    shotPlan: current.shotPlan,
    summary: summarizeProject(current),
  };
  return createProject({
    ...current,
    versions: [snapshot, ...(current.versions || [])].slice(0, 50),
  });
}

export function restoreVersion(project, versionId) {
  const current = createProject(project);
  const version = (current.versions || []).find((item) => item.id === versionId);
  if (!version) return current;
  const restored = createProject({
    ...current,
    title: version.title || current.title,
    writingType: version.writingType || current.writingType,
    fountain: version.fountain || current.fountain,
    screenplayDoc: version.screenplayDoc || current.screenplayDoc,
    bible: version.bible || current.bible,
    notes: version.notes || current.notes,
    scriptNotes: version.scriptNotes || current.scriptNotes,
    tagCategories: version.tagCategories || current.tagCategories,
    tagFieldMappings: version.tagFieldMappings || current.tagFieldMappings,
    tags: version.tags || current.tags,
    shotPlan: version.shotPlan || current.shotPlan,
    versions: current.versions,
  });
  const restoreEntry = {
    id: `version-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    label: `恢复到 ${version.label || version.id}`,
    kind: "restore",
    author: "Personal Screenwriter",
    createdAt: new Date().toISOString(),
    title: restored.title,
    writingType: restored.writingType,
    fountain: restored.fountain,
    screenplayDoc: restored.screenplayDoc,
    bible: restored.bible,
    notes: restored.notes,
    scriptNotes: restored.scriptNotes,
    tagCategories: restored.tagCategories,
    tagFieldMappings: restored.tagFieldMappings,
    tags: restored.tags,
    shotPlan: restored.shotPlan,
    summary: summarizeProject(restored),
  };
  return createProject({
    ...restored,
    versions: [restoreEntry, ...(restored.versions || [])].slice(0, 50),
  });
}

export function generateShotPlan(project) {
  const current = createProject(project);
  const shots = current.parsed.scenes.map((scene, index) => createShotPlanRow(scene, index + 1));
  return createProject({
    ...current,
    shotPlan: {
      shots,
      updatedAt: new Date().toISOString(),
    },
  });
}

export function addShotPlanShot(project, sceneId = null) {
  const current = createProject(project);
  const scene = sceneId ? current.parsed.scenes.find((item) => item.id === sceneId) : current.parsed.scenes[0] || null;
  const nextIndex = (current.shotPlan?.shots?.length || 0) + 1;
  const nextShot = createShotPlanRow(scene, nextIndex);
  return createProject({
    ...current,
    shotPlan: {
      shots: [...(current.shotPlan?.shots || []), nextShot],
      updatedAt: new Date().toISOString(),
    },
  });
}

export function updateShotPlanShot(project, shotId, patch = {}) {
  const current = createProject(project);
  return createProject({
    ...current,
    shotPlan: {
      shots: (current.shotPlan?.shots || []).map((shot) => (shot.id === shotId ? { ...shot, ...patch } : shot)),
      updatedAt: new Date().toISOString(),
    },
  });
}

export function deleteShotPlanShot(project, shotId) {
  const current = createProject(project);
  return createProject({
    ...current,
    shotPlan: {
      shots: (current.shotPlan?.shots || []).filter((shot) => shot.id !== shotId),
      updatedAt: new Date().toISOString(),
    },
  });
}

export function extractAssetSeeds(records = []) {
  return records
    .filter((record) => record && record.path)
    .slice(0, 200)
    .map((record) => {
      const label = record.label || record.path.split("/").filter(Boolean).at(-1) || record.path;
      return {
        label,
        path: record.path,
        category: record.category || "asset",
        score: Number(record.score || 0),
        family: record.family || inferFamily(record.path),
      };
    });
}

export function serializeProject(project) {
  return JSON.stringify(createProject(project), null, 2);
}

export function importProject(text) {
  const trimmed = text.trim();
  if (!trimmed) return createProject();
  if (trimmed.startsWith("{")) return createProject(JSON.parse(trimmed));
  return createProject({ fountain: text });
}

function normalizeBible(bible = {}) {
  return {
    characters: Array.isArray(bible.characters) ? bible.characters : [],
    scenes: Array.isArray(bible.scenes) ? bible.scenes : [],
    locations: Array.isArray(bible.locations) ? bible.locations : [],
    props: Array.isArray(bible.props) ? bible.props : [],
    rules: Array.isArray(bible.rules) ? bible.rules : [],
  };
}

function normalizeShotPlan(shotPlan = {}) {
  return {
    shots: Array.isArray(shotPlan.shots) ? shotPlan.shots.map((shot, index) => ({
      id: shot.id || `shot-${index + 1}`,
      sceneId: shot.sceneId || null,
      sceneHeading: shot.sceneHeading || "",
      shotNumber: Number(shot.shotNumber || index + 1),
      shotSize: shot.shotSize || "MS",
      cameraAngle: shot.cameraAngle || "EYE",
      movement: shot.movement || "STATIC",
      duration: Number(shot.duration || 3),
      goal: shot.goal || "",
      visual: shot.visual || "",
      dialogue: shot.dialogue || "",
      sound: shot.sound || "",
      notes: shot.notes || "",
    })) : [],
    updatedAt: shotPlan.updatedAt || "",
  };
}

function normalizeScriptNotes(scriptNotes = []) {
  return Array.isArray(scriptNotes)
    ? scriptNotes.map((note, index) => ({
        id: note.id || `note-${index + 1}`,
        content: note.content || "",
        color: note.color || "#f4d35e",
        anchorText: note.anchorText || "",
        sceneId: note.sceneId || null,
        elementType: note.elementType || "action",
        createdAt: note.createdAt || "",
        updatedAt: note.updatedAt || "",
      }))
    : [];
}

function normalizeTagCategories(tagCategories = []) {
  return Array.isArray(tagCategories)
    ? tagCategories.map((category, index) => ({
        id: category.id || `tag-category-${index + 1}`,
        name: category.name || `Category ${index + 1}`,
        color: category.color || "#9370DB",
      }))
    : [];
}

function normalizeTagFieldMappings(tagFieldMappings = {}) {
  return {
    ...DEFAULT_TAG_FIELD_MAPPINGS,
    ...(tagFieldMappings && typeof tagFieldMappings === "object" ? tagFieldMappings : {}),
  };
}

function normalizeTags(tags = []) {
  return Array.isArray(tags)
    ? tags.map((tag, index) => ({
        id: tag.id || `tag-${index + 1}`,
        categoryId: tag.categoryId || null,
        name: tag.name || tag.text || `Tag ${index + 1}`,
        text: tag.text || tag.name || "",
        notes: tag.notes || "",
        createdAt: tag.createdAt || "",
        updatedAt: tag.updatedAt || "",
      }))
    : [];
}

function normalizeDoctorActions(actions = []) {
  return Array.isArray(actions)
    ? actions.map((action, index) => ({
        id: action.id || `doctor-action-${index + 1}`,
        text: action.text || "",
        prompt: action.prompt || action.text || "",
        done: Boolean(action.done),
      }))
    : [];
}

function createShotPlanRow(scene, index) {
  return {
    id: `shot-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    sceneId: scene?.id || null,
    sceneHeading: scene?.heading || "未绑定场景",
    shotNumber: index,
    shotSize: "MS",
    cameraAngle: "EYE",
    movement: "STATIC",
    duration: 3,
    goal: scene?.synopsis || "补充该镜头的戏剧目的",
    visual: scene?.location ? `${scene.location} 的建立与动作关系` : "补充画面说明",
    dialogue: "",
    sound: "",
    notes: "",
  };
}

function selectKnowledgeTemplates(templateIds) {
  if (!Array.isArray(templateIds) || templateIds.length === 0) return getKnowledgeTemplates().slice(0, 3);
  const wanted = new Set(templateIds);
  return getKnowledgeTemplates().filter((template) => wanted.has(template.id));
}

function diffOrderedLines(fromLines, toLines) {
  const rows = fromLines.length + 1;
  const cols = toLines.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      if (fromLines[i - 1] === toLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const added = [];
  const removed = [];
  let i = fromLines.length;
  let j = toLines.length;

  while (i > 0 && j > 0) {
    if (fromLines[i - 1] === toLines[j - 1]) {
      i -= 1;
      j -= 1;
      continue;
    }
    if (dp[i - 1][j] >= dp[i][j - 1]) {
      removed.push(fromLines[i - 1]);
      i -= 1;
    } else {
      added.push(toLines[j - 1]);
      j -= 1;
    }
  }

  while (i > 0) {
    removed.push(fromLines[i - 1]);
    i -= 1;
  }
  while (j > 0) {
    added.push(toLines[j - 1]);
    j -= 1;
  }

  return {
    added: added.reverse(),
    removed: removed.reverse(),
  };
}

function buildFdxTagData(tagCategories = [], tags = []) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  const usedCatIds = new Set(tags.map((tag) => tag.categoryId).filter(Boolean));
  const usedCategories = (Array.isArray(tagCategories) ? tagCategories : []).filter((category) => usedCatIds.has(category.id));
  const lines = [];
  lines.push("  <TagData>");
  lines.push("    <TagCategories>");
  for (const category of usedCategories) {
    lines.push(`      <TagCategory CatId="${escapeXml(category.id)}" Name="${escapeXml(category.name)}" Color="${escapeXml(category.color || "#9370DB")}"/>`);
  }
  lines.push("    </TagCategories>");
  lines.push("    <TagItems>");
  for (const tag of tags) {
    lines.push(`      <TagItem TagId="${escapeXml(tag.id)}" CatId="${escapeXml(tag.categoryId || "")}" Label="${escapeXml(tag.name || tag.text || "")}"/>`);
  }
  lines.push("    </TagItems>");
  lines.push("  </TagData>");
  return lines.join("\n");
}

function extractTitlePageMetadata(screenplayDoc, fallbackTitle, parsedTitle) {
  const titlePageNode = screenplayDoc?.content?.find((node) => node?.type === "titlePage" && node?.attrs?.field === "title");
  return {
    title: titlePageNode?.attrs?.tpTitle || fallbackTitle || parsedTitle || "Untitled",
    author: titlePageNode?.attrs?.tpWrittenBy || "",
    credit: titlePageNode?.attrs?.tpBasedOn || "",
    draftDate: titlePageNode?.attrs?.tpDraftDate || titlePageNode?.attrs?.tpDraft || "",
    contact: titlePageNode?.attrs?.tpContact || "",
  };
}

function formatKnowledgeTemplates(templates) {
  if (!templates.length) return "未选择模板。";
  return templates
    .map((template) => {
      const rules = template.rules.map((rule, index) => `${index + 1}. ${rule}`).join("\n");
      return `### ${template.title}\n来源：${template.source}\n${rules}`;
    })
    .join("\n\n");
}

function normalizeNewlines(text) {
  return String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function isSceneHeading(line) {
  return /^(\.|INT\.|EXT\.|EST\.|INT\.\/EXT\.|I\/E\.)/i.test(line);
}

function stripForcedSceneHeading(line) {
  return line.startsWith(".") ? line.slice(1).trim() : line;
}

function extractLocation(line) {
  const heading = stripForcedSceneHeading(line);
  const withoutPrefix = heading.replace(/^(INT\.|EXT\.|EST\.|INT\.\/EXT\.|I\/E\.)\s*/i, "");
  return withoutPrefix.split(/\s+-\s+/)[0]?.trim() || "";
}

function extractSceneTime(line) {
  const parts = stripForcedSceneHeading(line).split(/\s+-\s+/);
  return parts.length > 1 ? parts.at(-1).trim() : "";
}

function isTransition(line) {
  return /^>/.test(line) || /^[A-Z\s]+TO:$/.test(line);
}

function isParenthetical(line) {
  return /^\(.+\)$/.test(line);
}

function isCharacterCue(line, lines, index) {
  const cleaned = line.replace(/^@/, "").replace(/\s*\^$/, "").trim();
  if (!cleaned || isSceneHeading(cleaned) || isTransition(cleaned)) return false;
  if (line.startsWith("@")) return true;
  if (index > 0 && lines[index - 1].trim() !== "") return false;

  const nextLine = lines[index + 1]?.trim() || "";
  if (!nextLine || isSceneHeading(nextLine)) return false;
  if (isParenthetical(nextLine)) return true;

  if (cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned)) return true;
  if (/[。！？；：,.!?;:]$/.test(cleaned)) return false;

  const hasCjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(cleaned);
  return hasCjk && [...cleaned].length <= 16;
}

function tokenize(text) {
  const cjk = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu) || [];
  const words = text.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, " ").match(/[A-Za-z0-9_]+/g) || [];
  return [...cjk, ...words];
}

function groupBlocksByScene(blocks = []) {
  const grouped = new Map();
  for (const block of blocks) {
    const sceneId = block.sceneId || "scene-1";
    grouped.set(sceneId, [...(grouped.get(sceneId) || []), block]);
  }
  return grouped;
}

function visualAsset(type, name, notes = "") {
  return {
    type,
    name,
    prompt: `${type}: ${name}. ${notes} cinematic visual reference, consistent production design, script-grounded details.`,
  };
}

function blockToFdxType(type) {
  const map = {
    scene: "Scene Heading",
    action: "Action",
    character: "Character",
    parenthetical: "Parenthetical",
    dialogue: "Dialogue",
    transition: "Transition",
    synopsis: "General",
  };
  return map[type] || "Action";
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function inferFamily(path) {
  if (/xingguigushi|星轨故事/i.test(path)) return "星轨故事";
  if (/star-track-life|星轨人生/i.test(path)) return "星轨人生";
  if (/StarCanvas|星轨画布/i.test(path)) return "StarCanvas";
  if (/novel-generator|小说/i.test(path)) return "小说/长文";
  if (/剧本|编剧|screenplay|script/i.test(path)) return "剧本资料";
  return "通用资料";
}
