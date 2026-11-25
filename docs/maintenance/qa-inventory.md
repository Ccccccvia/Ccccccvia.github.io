# 测试源码与临时产物维护清单

更新：2026-11-20。此文件是用途分类和迁移映射的唯一维护入口；项目记忆与 KnowledgeOS 迁移笔记只引用入口，不复制维护第二份清单。目录安排是当前阶段约定，可随实际需求调整。

## 1. 边界

- 网站源码、公开内容、图示、配置与可复用测试保存在项目内；浏览器截图、日志和隔离测试配置保存在项目外的 `../knowledgeos-browser-qa/`，本机为 `E:/knowledgeos-browser-qa/`。
- 项目外 QA 目录由浏览器验证工作产生，不是网站运行或发布的必需目录。2026-11-20 用户明确授权：确认无相关进程、保留有价值内容后删除；本轮已按此完成。以后运行浏览器测试会重新创建目录，不代表旧文件恢复。
- 有价值脚本此前已迁入项目；本次将最近完整验收的 2 份日志和 8 张截图迁入 `docs/maintenance/qa-evidence/2026-11-20-baseline/`，逐文件逐字节核验后，删除外部目录中的旧迭代截图、日志及隔离浏览器配置。删除前两次进程查询均无相关进程，未关闭个人浏览器或开发服务。
- 删除前外部目录共 3,682 个文件、400,353,850 字节；其中保留的 10 个文件共 3,695,576 字节。其余历史结论已记录在迁移笔记，不作为当前视觉基线继续维护；没有发现未归位的脚本或文章源文件。
- 同日新增 K-012–K-021 后，测试临时重建外部目录。最终 `npm test`（38 项单元、示例、56 页构建、438 项浏览器检查）和开发服务（458 项检查）通过；将 2 份日志、8 张页面截图、10 张新卡图示截图与 2 张联系表迁入 `docs/maintenance/qa-evidence/2026-11-20-ten-cards/`。共 22 个文件、5,627,718 字节，逐文件逐字节比较一致；确认无相关进程并再次比对后删除本轮外部目录，保留上述历史基线与新增证据。
- 此次授权仅针对该外部测试目录，不扩展到项目 `.tmp/`、依赖或其他目录。新建或迁入文件尚未提交；移动文件不等于完成 Git 备份。
- 不将这些维护文件放入 `public/` 或文章内容集合，不将私人浏览器配置用于测试，也不把历史测试脚本当成当前验收入口。

## 2. 当前用途分类

### 保留：项目与维护源码

| 位置 | 用途 | 处理 |
| --- | --- | --- |
| `src/`、`public/` | 网站组件、页面、公开正文与图示 | 正常项目内容，不按临时文件清理 |
| `.github/`、项目配置、依赖清单和锁文件 | 构建发布配置与可复现依赖 | 保留；本轮未修改 CI/CD 或依赖 |
| `.git/` | 版本历史与仓库元数据 | 不清理 |
| `src/knowledge-content.ts` | Astro 文章查询、按语言选取和卡号排序 | 当前读取规则唯一入口 |
| `src/knowledge-paths.ts` | 文章、目录和筛选链接的纯路径函数 | 不读取内容，不访问页面或 DOM |
| `scripts/knowledge-content.mjs`、`scripts/check-content.mjs` | 构建前读取原始 Markdown 并校验整个集合 | 与 Astro 查询用途不同，不为消除表面相似而合并 |
| `scripts/check-examples.mjs` | 双语代码、二分查找、浮点、URL、C#源码一致性；栈括号匹配、数字排序、HTTP正文字节数与封装字节表 | 从临时目录迁入，加入 `npm test`；C#不在此重新编译 |
| `tests/content.test.mjs`、`tests/paths.test.mjs`、`tests/ui.test.mjs` | 内容与抽样规则、纯路径、真实浏览器回归；逐篇核对代码显示、图示、页内导航、同卡语言切换与移动端布局 | 当前维护版测试入口；按实际文章计算，不写死总数 |
| `tests/fixtures/closure-capture/CaptureDemo.cs` | 与闭包文章对应的 C# 示例源码 | 必须保留，不与编译输出混放 |
| `tests/fixtures/closure-capture/CaptureDemo.runtimeconfig.json` | 指定 .NET 10 运行时的配套配置 | 保留，与旧 DLL 运行时通过显式参数关联 |
| `docs/maintenance/qa-inventory.md` | 本清单 | 随项目维护 |
| `start-local.cmd` | 本机启动辅助脚本，使用本机 Node 路径和项目内 TEMP/cache | 保留原行为，不是垃圾；不能因迁移截图而移走整个 `.tmp/` |

### 保留、待提取覆盖项：旧测试源码

| 位置 | 身份 | 当前处理 |
| --- | --- | --- |
| `tests/legacy/ui-before-taxonomy.cjs` | 原项目 `.tmp/ui-check.cjs` | 归档旧断言，不纳入 `npm test` |
| `tests/legacy/ui-taxonomy.cjs` | 原项目外 QA 目录的 `ui-check.cjs` | 归档双语分类阶段的旧断言，不纳入 `npm test` |

两份脚本不是同一版本，仍含固定卡片总数和固定最后一张卡的历史假设，不能据此判断当前随机精选是否正确。维护版已覆盖主要功能；空分支展开、特定导航点击和水平滚动尺寸等旧断言仍可作为后续补测参考，不因主要覆盖已替代而直接删除。

已适配旧脚本的输出路径：不再将截图和浏览器配置写到脚本旁边；默认在项目外 QA 目录创建唯一的 `legacy-before-taxonomy-*` / `legacy-taxonomy-*` 运行目录，拒绝项目内 `QA_OUTPUT`。两份源码仅做语法检查，不作为本轮功能测试执行，历史断言未冒充已更新。

### 保留的证据与可重建候选

| 位置 | 内容 | 当前状态 |
| --- | --- | --- |
| `docs/maintenance/qa-evidence/2026-11-20-baseline/` | 分层与备用卡片验收的 2 份日志、8 张双语桌面／手机截图 | 已迁入并逐字节核验；日志改用 `.txt` 后缀，内容未改写 |
| `docs/maintenance/qa-evidence/2026-11-20-ten-cards/` | K-012–K-021 验收的 2 份日志、8 张页面截图、10 张图示截图、2 张联系表 | 22 文件均逐字节核验；其余本轮测试产物与隔离配置已清理，不包含个人浏览器数据 |
| `../knowledgeos-browser-qa/archive/legacy-project/*.png` | 原项目 `.tmp/` 中的 7 张历史截图 | 曾迁出保留，本次确认无需继续留存后按授权删除 |
| `../knowledgeos-browser-qa/*.png`、`*.log`、`maintained-*/` | 历次检查日志、截图及隔离配置 | 保留上列最终证据后已删除；后续测试可能生成新目录 |
| `../knowledgeos-browser-qa/qa-chrome-interaction/` | 历史隔离测试浏览器配置 | 确认无相关进程后已删除 |
| `.tmp/qa-chrome-desktop/`、`.tmp/qa-chrome-interaction/`、`.tmp/qa-chrome-mobile/` | 历史隔离测试浏览器配置 | 可清理候选，未核实占用，不移动或删除 |
| `.tmp/node-compile-cache/` | Node 编译缓存 | 可重建候选，保留 |
| `.tmp/CaptureDemo.dll` | 旧 C# 示例的编译输出 | 与源码已分离，保留；当前验证运行不等于重新编译或证明可复现构建 |

### 正常基础设施：不当成工作残留迁走

| 位置 | 用途与约束 |
| --- | --- |
| `node_modules/` | 已安装项目依赖；移走会影响开发，恢复需要安装流程 |
| `dist/` | 构建产物；本地 preview 读取这里，删除后需成功构建才能预览 |
| `.astro/` | Astro 生成的类型与内容数据；不在开发或构建时随意移动 |
| `.npm-cache/` | `.npmrc` 和本机启动脚本指定的包缓存；本轮不改配置或迁移 |
| `.tmp/` | 本机启动脚本指定的 TEMP/TMP；已移出旧源码与截图，仍保留运行产物 |

这些目录本来就与 `src/`、`scripts/`、`tests/` 分开且由 Git 忽略，没有为了“物理分离”再整体搬走的必要。

## 3. 本轮实际迁移映射

| 原位置 | 新位置 |
| --- | --- |
| `.tmp/check-examples.mjs` | `scripts/check-examples.mjs` |
| `.tmp/CaptureDemo.cs` | `tests/fixtures/closure-capture/CaptureDemo.cs` |
| `.tmp/CaptureDemo.runtimeconfig.json` | `tests/fixtures/closure-capture/CaptureDemo.runtimeconfig.json` |
| `.tmp/ui-check.cjs` | `tests/legacy/ui-before-taxonomy.cjs` |
| `../knowledgeos-browser-qa/ui-check.cjs` | `tests/legacy/ui-taxonomy.cjs` |
| `.tmp/directory-desktop.png` | `../knowledgeos-browser-qa/archive/legacy-project/directory-desktop.png` |
| `.tmp/home-desktop-final.png` | `../knowledgeos-browser-qa/archive/legacy-project/home-desktop-final.png` |
| `.tmp/home-desktop-verified.png` | `../knowledgeos-browser-qa/archive/legacy-project/home-desktop-verified.png` |
| `.tmp/home-desktop.png` | `../knowledgeos-browser-qa/archive/legacy-project/home-desktop.png` |
| `.tmp/home-hover.png` | `../knowledgeos-browser-qa/archive/legacy-project/home-hover.png` |
| `.tmp/home-mobile-verified.png` | `../knowledgeos-browser-qa/archive/legacy-project/home-mobile-verified.png` |
| `.tmp/home-mobile.png` | `../knowledgeos-browser-qa/archive/legacy-project/home-mobile.png` |

共 12 个文件。迁移前读取每个原文件的完整字节，确认目标不存在；迁移后逐个读取目标并逐字节比较，同时确认原路径不再存在。所有文件核验通过，没有用数量或哈希代替实际字节核验。

核验完成后才修改 3 个脚本的路径逻辑：示例检查器改为相对于脚本自身定位内容与 fixture；两份旧 UI 脚本改为仓库外独立输出目录。C# 源码、运行配置与截图未改写。

## 4. 固定入口与路径适配

从项目根目录，在满足项目 `engines` 的 Node 环境下执行：

| 命令 | 范围 |
| --- | --- |
| `npm run dev` | 开发，固定 4321 |
| `npm run build` | 集合校验、Astro 检查和构建 |
| `npm run preview` | 预览最近构建，固定 4322 |
| `npm run test:content` | 内容、随机抽样和纯路径单元测试 |
| `npm run test:examples` | 从公开正文提取示例执行检查；C# 部分只比较源码，不编译 |
| `npm run test:ui` | 维护版浏览器测试，默认针对现有构建；不会自动构建 |
| `npm test` | 单元测试 → 示例检查 → 构建 → 浏览器测试 |

- 新旧浏览器测试都将产物写到仓库外；维护版可用 `QA_OUTPUT` 指定其他外部位置，`QA_BASE` 指定已有服务，`BROWSER_PATH` 指定已安装浏览器。两份 legacy 脚本仍保留原 Chrome 路径，因此不是跨机器通用入口。
- `scripts/check-examples.mjs` 已从其他工作目录实际运行通过，不再要求当前目录恰好是仓库根目录。
- 运行旧 DLL 时必须显式指定迁移后的配置，不能再假设配置与 DLL 放在同一个文件夹：

```sh
dotnet exec --runtimeconfig tests/fixtures/closure-capture/CaptureDemo.runtimeconfig.json .tmp/CaptureDemo.dll
```

本轮使用已有 .NET 运行时执行通过，输出为三行 `3`、分隔线、`0`、`1`、`2`；没有安装运行时，没有重新编译 DLL。

## 5. 后续清理前的检查

- [ ] 逐项决定哪些历史截图和日志还需要保留，不以文件同名推定内容相同。
- [ ] 清理浏览器配置、缓存或运行目录前，确认对应测试进程已退出；不关闭个人浏览器或无关服务。
- [ ] 清理编译输出前，确认源码、运行配置及需要的重建方式已保留。
- [ ] 需要再次搬迁时，先列出原路径、目标路径和代码引用，适配后执行检查并更新此清单。
- [ ] 每次清理范围单独核对；本轮已获准删除旧外部 QA 目录，不授权清理其他目录或后台定时删除。
