import { expect, test } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.describe('JSON Merger Functionality', () => {
  test('should merge JSON files correctly - basic case', async ({ page }) => {
    // Navigate to the JSON merge page
    await page.goto('/json')

    // Create test files with unique names
    const timestamp = Date.now()
    const file1Path = path.join(__dirname, `test-file1-${timestamp}.json`)
    const file2Path = path.join(__dirname, `test-file2-${timestamp}.json`)

    fs.writeFileSync(file1Path, JSON.stringify({ a: 1, b: 2 }))
    fs.writeFileSync(file2Path, JSON.stringify({ c: 3, d: 4 }))

    // Upload files using the drag and drop area
    const [fileChooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('text=Drag and drop multiple JSON files here, or click to select')])
    await fileChooser.setFiles([file1Path, file2Path])

    // Click merge button
    await page.click('button:has-text("Merge Files")')

    // Wait for processing to complete by checking for the download button
    await page.waitForSelector('button:has-text("DOWNLOAD")', { timeout: 15000 })

    // Check results
    const downloadButton = page.locator('button:has-text("DOWNLOAD")')
    await expect(downloadButton).toBeVisible()

    // Click download and capture the result
    const downloadPromise = page.waitForEvent('download')
    await downloadButton.click()
    const download = await downloadPromise

    // Read downloaded content
    const downloadedFilePath = await download.path()
    const content = JSON.parse(fs.readFileSync(downloadedFilePath, 'utf-8'))

    // Verify merged result
    expect(content).toEqual({ a: 1, b: 2, c: 3, d: 4 })

    // Cleanup
    fs.unlinkSync(file1Path)
    fs.unlinkSync(file2Path)
  })

  test('should handle edge case: a has b does not', async ({ page }) => {
    // Navigate to the JSON merge page
    await page.goto('/json')

    // Create test files with unique names
    const timestamp = Date.now()
    const file1Path = path.join(__dirname, `test-file1-${timestamp}.json`)
    const file2Path = path.join(__dirname, `test-file2-${timestamp}.json`)

    fs.writeFileSync(file1Path, JSON.stringify({ a: { x: 1 }, b: { y: 2 } }))
    fs.writeFileSync(file2Path, JSON.stringify({ a: { z: 3 } })) // b is missing

    // Upload files using the drag and drop area
    const [fileChooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('text=Drag and drop multiple JSON files here, or click to select')])
    await fileChooser.setFiles([file1Path, file2Path])

    // Click merge button
    await page.click('button:has-text("Merge Files")')

    // Wait for processing to complete by checking for the download button
    await page.waitForSelector('button:has-text("DOWNLOAD")', { timeout: 15000 })

    // Click download and capture the result
    const downloadButton = page.locator('button:has-text("DOWNLOAD")')
    const downloadPromise = page.waitForEvent('download')
    await downloadButton.click()
    const download = await downloadPromise

    // Read downloaded content
    const downloadedFilePath = await download.path()
    const content = JSON.parse(fs.readFileSync(downloadedFilePath, 'utf-8'))

    // Verify merged result - b should be preserved from file1, a should be merged
    expect(content).toEqual({ a: { x: 1, z: 3 }, b: { y: 2 } })

    // Cleanup
    fs.unlinkSync(file1Path)
    fs.unlinkSync(file2Path)
  })

  test('should handle edge case: a has b has', async ({ page }) => {
    // Navigate to the JSON merge page
    await page.goto('/json')

    // Create test files with unique names
    const timestamp = Date.now()
    const file1Path = path.join(__dirname, `test-file1-${timestamp}.json`)
    const file2Path = path.join(__dirname, `test-file2-${timestamp}.json`)

    fs.writeFileSync(file1Path, JSON.stringify({ a: { x: 1 }, b: { y: 2 } }))
    fs.writeFileSync(file2Path, JSON.stringify({ a: { z: 3 }, b: { w: 4 } }))

    // Upload files using the drag and drop area
    const [fileChooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('text=Drag and drop multiple JSON files here, or click to select')])
    await fileChooser.setFiles([file1Path, file2Path])

    // Click merge button
    await page.click('button:has-text("Merge Files")')

    // Wait for processing to complete by checking for the download button
    await page.waitForSelector('button:has-text("DOWNLOAD")', { timeout: 15000 })

    // Click download and capture the result
    const downloadButton = page.locator('button:has-text("DOWNLOAD")')
    const downloadPromise = page.waitForEvent('download')
    await downloadButton.click()
    const download = await downloadPromise

    // Read downloaded content
    const downloadedFilePath = await download.path()
    const content = JSON.parse(fs.readFileSync(downloadedFilePath, 'utf-8'))

    // Verify merged result - both a and b should be merged
    expect(content).toEqual({ a: { x: 1, z: 3 }, b: { y: 2, w: 4 } })

    // Cleanup
    fs.unlinkSync(file1Path)
    fs.unlinkSync(file2Path)
  })

  test('should handle multiple files with overlapping keys', async ({ page }) => {
    // Navigate to the JSON merge page
    await page.goto('/json')

    // Create test files with unique names
    const timestamp = Date.now()
    const file1Path = path.join(__dirname, `test-file1-${timestamp}.json`)
    const file2Path = path.join(__dirname, `test-file2-${timestamp}.json`)
    const file3Path = path.join(__dirname, `test-file3-${timestamp}.json`)

    fs.writeFileSync(file1Path, JSON.stringify({ a: 1, b: { x: 1 } }))
    fs.writeFileSync(file2Path, JSON.stringify({ b: { y: 2 }, c: 3 }))
    fs.writeFileSync(file3Path, JSON.stringify({ a: 4, c: { z: 3 } }))

    // Upload files using the drag and drop area
    const [fileChooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('text=Drag and drop multiple JSON files here, or click to select')])
    await fileChooser.setFiles([file1Path, file2Path, file3Path])

    // Click merge button
    await page.click('button:has-text("Merge Files")')

    // Wait for processing to complete by checking for the download button
    await page.waitForSelector('button:has-text("DOWNLOAD")', { timeout: 15000 })

    // Click download and capture the result
    const downloadButton = page.locator('button:has-text("DOWNLOAD")')
    const downloadPromise = page.waitForEvent('download')
    await downloadButton.click()
    const download = await downloadPromise

    // Read downloaded content
    const downloadedFilePath = await download.path()
    const content = JSON.parse(fs.readFileSync(downloadedFilePath, 'utf-8'))

    // Verify merged result - later files override earlier ones, nested objects are merged
    expect(content).toEqual({ a: 4, b: { x: 1, y: 2 }, c: { z: 3 } })

    // Cleanup
    fs.unlinkSync(file1Path)
    fs.unlinkSync(file2Path)
    fs.unlinkSync(file3Path)
  })

  test('should preserve array values correctly', async ({ page }) => {
    // Navigate to the JSON merge page
    await page.goto('/json')

    // Create test files with unique names
    const timestamp = Date.now()
    const file1Path = path.join(__dirname, `test-file1-${timestamp}.json`)
    const file2Path = path.join(__dirname, `test-file2-${timestamp}.json`)

    fs.writeFileSync(file1Path, JSON.stringify({ items: [1, 2, 3] }))
    fs.writeFileSync(file2Path, JSON.stringify({ items: [4, 5] }))

    // Upload files using the drag and drop area
    const [fileChooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('text=Drag and drop multiple JSON files here, or click to select')])
    await fileChooser.setFiles([file1Path, file2Path])

    // Click merge button
    await page.click('button:has-text("Merge Files")')

    // Wait for processing to complete by checking for the download button
    await page.waitForSelector('button:has-text("DOWNLOAD")', { timeout: 15000 })

    // Click download and capture the result
    const downloadButton = page.locator('button:has-text("DOWNLOAD")')
    const downloadPromise = page.waitForEvent('download')
    await downloadButton.click()
    const download = await downloadPromise

    // Read downloaded content
    const downloadedFilePath = await download.path()
    const content = JSON.parse(fs.readFileSync(downloadedFilePath, 'utf-8'))

    // Verify merged result - arrays should be replaced, not merged
    expect(content).toEqual({ items: [4, 5] })

    // Cleanup
    fs.unlinkSync(file1Path)
    fs.unlinkSync(file2Path)
  })
})
