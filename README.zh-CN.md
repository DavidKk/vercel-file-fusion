[![Build Status](https://github.com/DavidKk/vercel-file-fusion/actions/workflows/coverage.workflow.yml/badge.svg)](https://github.com/DavidKk/vercel-file-fusion/actions/workflows/coverage.workflow.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![中文](https://img.shields.io/badge/%E6%96%87%E6%A1%A3-%E4%B8%AD%E6%96%87-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-file-fusion/blob/main/README.zh-CN.md) [![English](https://img.shields.io/badge/docs-English-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-file-fusion/blob/main/README.md)

# 文件融合服务

[online](https://vercel-file-fusion.vercel.app)

一个简单易用的文件批处理服务，支持批量压缩、加密解密和重命名文件。所有处理均在本地完成，不依赖服务器。

- **用途**：提供快速的文件批处理功能，提升工作效率。
- **适用场景**：文件批量压缩、加密解密、重命名等操作。

## 部署到 Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYourUsername%2Fvercel-file-fusion)

## 功能

- 批量压缩文件。
- 批量加密解密文件。
- 批量重命名文件。
- 报销小工具。
- 音频文件内嵌信息小工具。
- 支持 Vercel 部署，简单快速上线。

## 注意事项

- **本地处理**：所有文件处理操作均在本地完成，不会上传到服务器。
- **数据安全**：确保文件和数据的安全性，不会泄露用户隐私。

## 报销小工具

该工具分析 PDF 电子发票中的金额，并应用算法确定最佳报销发票组合。它能够根据输入的金额高效地识别最合适的发票集，确保报销的最佳匹配。

## 音频嵌入信息工具

该工具用于将元数据嵌入到 FLAC 音频文件中。目前，它仅支持嵌入歌词和 FLAC 文件。请确保歌词文件名与音频文件名匹配。

## 音频文件信息嵌入工具

该工具用于将元数据嵌入到 FLAC 音频文件中。目前，它支持嵌入歌词和封面图像。请确保歌词文件名与音频文件名匹配，并且封面图像文件位于相同目录中。
