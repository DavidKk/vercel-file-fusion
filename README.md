[![Build Status](https://github.com/DavidKk/vercel-file-fusion/actions/workflows/coverage.workflow.yml/badge.svg)](https://github.com/DavidKk/vercel-file-fusion/actions/workflows/coverage.workflow.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![中文](https://img.shields.io/badge/%E6%96%87%E6%A1%A3-%E4%B8%AD%E6%96%87-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-file-fusion/blob/main/README.zh-CN.md) [![English](https://img.shields.io/badge/docs-English-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-file-fusion/blob/main/README.md)

# File Fusion Service

[online](https://vercel-file-fusion.vercel.app)

A simple and easy-to-use file batch processing service that supports batch compression, encryption/decryption, and renaming of files. All processing is done locally without relying on a server.

- **Purpose**: Provide fast file batch processing functions to improve work efficiency.
- **Applicable Scenarios**: Batch file compression, encryption/decryption, renaming, etc.

## Deploy to Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYourUsername%2Fvercel-file-fusion)

## Features

- Batch compress files.
- Batch encrypt/decrypt files.
- Batch rename files.
- Reimbursement tool.
- Audio file metadata embedding tool.
- Support Vercel deployment for quick and easy online access.

## Notes

- **Local Processing**: All file processing operations are done locally and will not be uploaded to the server.
- **Data Security**: Ensure the security of files and data, and will not leak user privacy.

## Reimbursement Tool

This tool analyzes the amounts in PDF electronic invoices and applies algorithms to determine the best combination of reimbursement invoices. It can efficiently identify the most suitable set of invoices based on the input amount, ensuring the best match for reimbursement.

## Audio Metadata Embedding Tool

This tool is used to embed metadata into FLAC audio files. Currently, it only supports embedding lyrics and FLAC files. Please ensure the lyrics file name matches the audio file name.

## Audio File Metadata Embedding Tool

This tool is used to embed metadata into FLAC audio files. Currently, it supports embedding lyrics and cover images. Please ensure the lyrics file name matches the audio file name, and the cover image file is located in the same directory.
