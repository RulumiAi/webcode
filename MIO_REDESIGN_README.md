# mio · 基于现有源码的 Web / H5 改版 v0.2

这是基于上传的 React/Vite 前端工程制作的独立新品改版，不是原来的 Lurova 网站上线包。mio 是临时品牌名。

## 已完成

- 保留原有路由、登录、收藏、角色创建、聊天、会员等前端模块及 API 调用约定。
- 新增首页精选推荐区、排序标签、独立卡片文案区、深灰与柔粉视觉系统。
- 桌面和移动端均可切换日语、韩语、英语、简体中文、西班牙语、葡萄牙语。
- 默认预览使用独立样例角色、浏览器本地收藏与会话，模拟 SSE 消息回复。
- 提供 /mobile-preview.html，可在桌面查看 390px H5 布局；实际手机访问首页自动适配。
- 保留上传原包中的素材。Git 源码排除了有优化替代品的重复原始素材目录，构建验证优化文件。

## 启动

Node.js 22 或以上：

```sh
npm ci
npm run dev
```

默认开启设计预览。`npm run build:preview` 输出用于静态预览的 dist。

真实后端开发：`npm run dev:server`。真实部署：`npm run build`，按照现有服务架构配置 VITE_API_BASE_URL，提供 Django API、数据库和所需运行环境。生产构建不启用 .env.design；不要在生产环境设置 VITE_DESIGN_PREVIEW=true。

预览中显示的 Preview 用户和 100 点额度都是样例，不代表真实账号或余额。充值提交、图片/视频生成、语音生成等未连接服务的操作会显示预览提示，不会扣费或调用正式业务。

## 当前验证

- TypeScript 检查通过。
- Vite 预览构建通过。
- 72 项检查通过：多语言、角色映射、收藏、聊天顺序、文本和滚动，以及新增的预览接口检查。
- 浏览器验证：语言切换、角色详情、会话初始化、发送模拟消息、390px H5 布局。
- 扩展检查中有两项原工程问题：filterTags 检查引用压缩包中不存在的 ../content/filter_tags.py；navigation 静态检查要求直接导入 CharacterFeedView，但上传原版 App.tsx 本身使用 lazy 导入。未为绕过它们而改测试。

## 上线前仍需完成

1. 真实 Django 后端、测试账号和 API 环境联调，包括注册、重置密码、真实 AI、历史消息、收藏、付费权益与支付回调。
2. 确认新品品牌、主体、域名、客服和适用条款。原工程的法律正文仍是旧项目内容，不能直接作为新品最终政策。
3. 对日韩文案作母语审校，替换预览角色和低分辨率概念图素材。
4. 对现有创建、社区、生成和会员模块继续统一视觉并做端到端测试。目前重点完成发现、详情和聊天主路径，尚不应宣称全站可以上线运营。
5. 真机检查 iOS Safari、Android Chrome、软键盘、弱网和长对话。
6. 处理构建提示的较大 JS 分块，核验素材加载与首屏性能。

## 更新包使用

mio-source-update-v0.2.zip 是代码覆盖包，包含全部 src、构建配置、新增预览素材及本说明，不重复打包原有的大型素材库。请先备份原项目，再把覆盖包解压到原项目根目录。原项目 public 下的素材目录需保留。

## v0.3 · 紧凑角色平台方向

本轮移除首页精选大横幅，新增角色/社区/图库内容入口和独立排序、性别及画风筛选。桌面侧栏调整为发现、会员、金币、收藏和最近聊天，最近聊天可以直接打开对应角色。角色网格在常规桌面宽度为五列，大屏六列，手机两列。新增 12 张原创成年角色插画，移除重复的四图示例；卡片增加题材标签，聊天桌面端合并重复会话导航。

LusyChat 当前无法通过本次浏览器访问，因此依据公开页面可核验的结构调整，不宣称逐像素复刻。保留独立品牌和原创内容，实际会员、AI、生成服务接入范围与 v0.2 相同。

## v0.6 · 参考站视觉对齐

统一为深紫画布、紫粉色强调、渐变侧栏与紧凑导航；保留桌面七列、手机两列及标签下拉。首页栏目调整为角色、活动入口与照片，照片页新增网格和键盘可关闭的灯箱，正式模式读取已有图片动态 API，预览模式使用原创成年角色插画。侧栏增加排行榜、任务中心、生成和下载入口；无后端支持的入口明确显示预览说明，任务入口可跳转至实际探索和创建流程。排行榜不伪造排名或数据。

会员展示使用 Ultra / Deluxe / Premium 三档示例及月、季、年切换，视觉按用户截图对齐；这些价格、金币和权益仅用于设计预览。真实模式仍从原支付 API 读取可用套餐及价格，不增加虚构的付费产品或季度订单。预览不会提交支付。

参考站当前在浏览器返回 Site Unavailable。本轮根据可读取的公开首页栏目及用户支付页截图还原，不能称为全站逐像素复刻。品牌、头像与角色文案保持原创，不复制露骨内容。活动入口暂沿用原社区模块；排行榜、生成、下载等完整业务尚未接入。生产上线前仍需完成前述后端、支付、政策、母语及真机验证。

## v0.7 · 四类内容与个人中心

- 首页改为角色聊天、剧情卡、照片、视频四个页内分类，复用搜索与语言栏。分类切换不调用路由；各分类分别保存标签。角色支持原有完整标签库，剧情 24 类题材，照片与视频拥有独立题材及画风标签。
- 角色热度使用已有 chatCount 字段，紧凑格式显示；无数据时显示 0，异常值归零。仅设计预览注入明确的示例热度，未写入真实服务。
- 新增图片到文案的深紫渐变；四张原创日式二次元成年角色封面，沿用八张原有角色插画。
- 剧情卡沿用用户指定的 Lurova 六款群像封面，支持题材筛选、浏览世界背景/三条设定/角色阵容、本地收藏和从个人中心再次打开。它是设定集与角色选择的前端预览，没有冒充已接入多人剧情引擎。Lorebook 网页在当前浏览器不可读取，故尚未核对到逐像素一致。
- 预览照片来自角色封面，四段视频是生成插画的镜头推进预览，均为本地实际可播放 MP4。正式模式图片和视频继续读取现有 feed API；剧情正式数据源仍待后端接入。
- 新增 /profile 个人中心页，顶部、侧栏与手机底栏均有入口。余额、会员、收藏、创建内容、聊天历史读取既有数据；设置继续使用原账户逻辑。该路由不对搜索引擎开放。
- 社媒入口覆盖侧栏、个人中心和手机抽屉。官方链接通过 src/socialLinks.ts / VITE_SOCIAL_* 配置；空值显示暂未开放，不生成虚假的账号链接。
- 新封面文件路径与完整生成提示词见 docs/anime-cover-prompts.md。
- SEO 测试的两个旧 Lurova 域名断言改为当前 SITE_ORIGIN，保留原有路径与查询参数校验。


## v0.7.1 · 重新构建发布

按用户要求从最新已保存源码重新构建并发布。页面设计预览角标显示 v0.7.1；public/preview-build.json 记录本次构建标记，便于区分此前版本。


## v0.7.2 · 卡片密度与清新写真

收紧角色卡描述、标签和作者的间距，统一角色卡与剧情卡的 3:4 封面窗口及文字区高度。桌面保持七列，手机保持两列；剧情封面用居中裁切适配列表，详情中的完整封面保持原始比例。预留滚动条宽度以防分类切换造成卡片宽度变化。

新增六张原创日系清新风 AI 写真，均为 26 岁以上虚构成年角色，并添加六语言姓名。原有十二个角色 ID、剧情阵容和二次元封面保持不变；新写真进入最新列表、写实筛选和照片分类。新增角色 API 检查通过，27 项相关测试通过。素材与完整生成提示词见 docs/fresh-photo-prompts-v072.md。

## v0.7.3

Corrected the six new portraits from photography to original fresh Japanese anime. Added twelve original anime environment assets and a screenshot-aligned full worldbook detail workspace with NPC, important locations, key events, world rules and existing character-chat selection. Six language versions and responsive H5 layout. Lore content is sample data; the shared world engine remains disconnected. See `docs/anime-worldbook-v073.md` for asset paths and prompt set.

## v0.7.4

Added Comics after Story cards, album/group/video preview limits and demo-coin unlock flows. Anime profile avatar now sits to the right of notifications on desktop and H5. Added reduced-motion-aware interaction polish. Real purchases still require backend wallet and access enforcement; sample prices and illustrations are for review. See `docs/media-v074.md`.

## v0.8.0

Added reference-inspired Coins and Task center pages, a functional sample leaderboard, and a five-step browser-local comic studio with draft persistence and preview publication. New content can be read and unlocked from the comic catalogue. Demo recharge/rewards share the media balance; real payments and online publishing remain disconnected. See `docs/business-v080.md` for flows, tests and operational boundaries.
