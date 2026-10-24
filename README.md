# Zotero DOI Manager for Zotero 10

面向 **Zotero 10.0.x（适配目标：10.0.6）** 的 DOI 管理插件兼容修改版，用于批量补全、转换、校验和清理文献条目的 DOI。

> 本项目基于 [Brenton M. Wiernik 的 Zotero DOI Manager（bwiernik/zotero-shortdoi）](https://github.com/bwiernik/zotero-shortdoi)，以其 [v1.5.0 发布包](https://github.com/bwiernik/zotero-shortdoi/releases/tag/v1.5.0) 为修改基础。这是非官方兼容修改版，与原作者及 Zotero 官方无隶属关系。
>
> **验证状态**：已在本机 Zotero 10.0.6 独立配置与独立测试文献库中，通过真实安装器完成安装、启用、菜单与设置页注册、在线 DOI 清理以及停用再启用检查。6 项 Node.js 回归测试也通过。设置页视觉呈现、缺失 DOI 的 Crossref 查询、短 DOI 转换及大型文献库仍需进一步验证。

## 主要功能

- **获取完整 DOI**：为支持的文献条目查询完整 DOI；缺失时通过 Crossref OpenURL 查询。
- **获取 shortDOI**：调用 shortdoi.org 获取短 DOI。
- **校验并清理 DOI**：查询 DOI Handle API，清理 DOI 字段中的 URL 等前缀，对无效、未找到或多候选结果进行标记。
- **批量与自动处理**：对选中文献执行操作，或在新增条目时按设置自动处理。

沿用原项目的条目筛选逻辑：处理期刊论文和会议论文，跳过订阅源条目。获取长／短 DOI 会替换已有 DOI 字段；插件可能增删其配置的提示标签。

## 下载与安装

1. 下载仓库内的 [zotero-doi-manager-1.5.0.11-zotero10.xpi](dist/zotero-doi-manager-1.5.0.11-zotero10.xpi?raw=true)。请下载文件本身。
2. 在 Zotero 中打开 **工具 → 插件（Add-ons）**。
3. 点击齿轮，选择 **从文件安装插件**，选中下载的 `.xpi`。
4. 如提示重启，重启 Zotero。
5. 先选一篇测试文献，右键打开 **DOI Manager**，测试 **Verify and clean DOIs**。

插件沿用 `zoteroshortdoi@wiernik.org` ID，会替换已安装的同 ID 旧版。偏好设置中的 DOI Manager 页面可配置自动处理和提示标签；工具菜单也提供自动处理选项。本兼容版使用本仓库的 `updates.json` 作为更新地址，避免被原项目的旧版本覆盖。

## 开发、测试与打包

测试使用 Node.js 内置测试运行器，无需安装 npm 依赖（建议 Node.js 20 或更新版本）：

```powershell
node --test compat.test.cjs
node --check source/bootstrap.js
node --check source/zoteroshortdoi.js
```

Windows PowerShell 打包：

```powershell
.\build.ps1
```

默认生成 `dist/zotero-doi-manager-1.5.0.11-zotero10-rebuilt.xpi`；如果目标文件已存在，脚本会拒绝覆盖。可通过 `-OutputPath` 指定其他文件路径。

```text
source/              插件源码、图标、语言资源及许可证
compat.test.cjs      模拟 Zotero 环境的回归测试
dist/                可安装 XPI
build.ps1            PowerShell 打包脚本
docs/VALIDATION.md   验证范围与尚未完成的检查
LICENSE              MPL-2.0 原始许可证
```

详情见 [验证记录](docs/VALIDATION.md)。本项目未改写上游的 DOI 检索算法；服务可用性、匹配准确性及大型文献库批量处理仍需实际使用验证。

## English overview

An unofficial compatibility adaptation of Zotero DOI Manager 1.5.0 targeting Zotero 10.0.x, especially 10.0.6. It retains the upstream DOI retrieval, shortDOI conversion, validation, and cleanup features while updating bootstrap loading, preference resource resolution, observer and menu cleanup, and automatic verification settings.

Six Node.js regression tests pass. Version 1.5.0.11 has also been installed and activated by the actual Zotero 10.0.6 AddonManager in an isolated profile. Menu insertion, preference-pane registration, online DOI cleanup, disable and re-enable have been checked. Visual rendering of settings, Crossref lookup for missing DOIs, shortDOI conversion and large-library behavior remain unverified. Download the XPI from `dist/`, then install it using Zotero's “Install Add-on From File” command.

## 原始项目、致谢与许可证 / Upstream and license

**本项目基于以下原始项目修改**：

- **原项目名称**：Zotero DOI Manager（仓库名 `zotero-shortdoi`）。
- **原项目地址**：https://github.com/bwiernik/zotero-shortdoi
- **原作者**：Brenton M. Wiernik（GitHub：[@bwiernik](https://github.com/bwiernik)）。
- **修改基础**：[v1.5.0](https://github.com/bwiernik/zotero-shortdoi/releases/tag/v1.5.0)，发布于 2024-08-09。
- **本兼容修改版**：1.5.0.11，修改日期 2026-10-24，由 [XavierLin19](https://github.com/XavierLin19) 发布。
- **许可证**：[Mozilla Public License 2.0](LICENSE)，保留原项目的许可及作者署名。

DOI 获取、校验和短 DOI 转换的核心实现来自原始项目。本仓库的工作是在该实现上进行 Zotero 10 兼容修改、补充回归测试与发布说明，不将上游代码宣称为原创。原项目还注明其部分代码参考 Anton Beloglazov 的 [Zotero Google Scholar Citations](https://github.com/beloglazov/zotero-scholar-citations) 插件，在此一并致谢。
