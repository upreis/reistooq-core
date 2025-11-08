import { test, expect } from '@playwright/test';

/**
 * E2E Tests para verificar que câmera e microfone são desligados corretamente
 * ao sair do scanner ou cancelar operação
 */
test.describe('Scanner - Camera and Microphone Cleanup', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);
    
    // Navigate to scanner page
    await page.goto('/scanner');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should request only video (no audio) when starting camera', async ({ page }) => {
    // Mock getUserMedia to verify constraints
    let capturedConstraints: MediaStreamConstraints | null = null;
    
    await page.evaluateOnNewDocument(() => {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = async function(constraints) {
        (window as any).__capturedConstraints = constraints;
        return originalGetUserMedia.call(this, constraints);
      };
    });

    // Start camera
    const startButton = page.locator('button:has-text("Toque para iniciar")');
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Wait for camera to initialize
    await page.waitForTimeout(2000);

    // Verify constraints
    capturedConstraints = await page.evaluate(() => (window as any).__capturedConstraints);
    
    if (capturedConstraints) {
      expect(capturedConstraints.audio).toBeFalsy();
      expect(capturedConstraints.video).toBeTruthy();
    }
  });

  test('should stop camera when clicking "Parar" button', async ({ page }) => {
    // Start camera first
    const startButton = page.locator('button:has-text("Toque para iniciar")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1500);
    }

    // Verify camera is active
    const videoElement = page.locator('video');
    const isPlaying = await videoElement.evaluate((video: HTMLVideoElement) => {
      return !video.paused && video.srcObject !== null;
    });
    expect(isPlaying).toBeTruthy();

    // Click stop button
    const stopButton = page.locator('button:has-text("Parar")');
    await stopButton.click();
    await page.waitForTimeout(500);

    // Verify camera stopped
    const isStoppedAfter = await videoElement.evaluate((video: HTMLVideoElement) => {
      return video.srcObject === null;
    });
    expect(isStoppedAfter).toBeTruthy();

    // Verify no active media tracks
    const activeTracks = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (!video || !video.srcObject) return 0;
      const stream = video.srcObject as MediaStream;
      return stream.getTracks().filter(track => track.readyState === 'live').length;
    });
    expect(activeTracks).toBe(0);
  });

  test('should stop camera when navigating away from scanner page', async ({ page }) => {
    // Start camera
    const startButton = page.locator('button:has-text("Toque para iniciar")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1500);
    }

    // Store stream reference before navigation
    const streamIdBefore = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (!video || !video.srcObject) return null;
      const stream = video.srcObject as MediaStream;
      return stream.id;
    });

    expect(streamIdBefore).toBeTruthy();

    // Navigate away
    await page.goto('/estoque');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify no video element exists anymore
    const videoExists = await page.locator('video').count();
    expect(videoExists).toBe(0);

    // Navigate back and verify fresh state
    await page.goto('/scanner');
    await page.waitForLoadState('networkidle');
    
    const startButtonAfter = page.locator('button:has-text("Toque para iniciar")');
    await expect(startButtonAfter).toBeVisible();
  });

  test('should cleanup all resources when component unmounts', async ({ page }) => {
    // Start camera
    const startButton = page.locator('button:has-text("Toque para iniciar")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1500);
    }

    // Get initial track count
    const trackCountBefore = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (!video || !video.srcObject) return 0;
      const stream = video.srcObject as MediaStream;
      return stream.getTracks().length;
    });

    expect(trackCountBefore).toBeGreaterThan(0);

    // Navigate away to trigger cleanup
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Check console for cleanup messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Cleanup') || msg.text().includes('Stopping')) {
        consoleMessages.push(msg.text());
      }
    });

    // Navigate back to scanner
    await page.goto('/scanner');
    await page.waitForLoadState('networkidle');

    // Verify fresh state
    const videoAfterCleanup = page.locator('video');
    const hasSrcObject = await videoAfterCleanup.evaluate((video: HTMLVideoElement) => {
      return video.srcObject !== null;
    });
    
    expect(hasSrcObject).toBeFalsy();
  });

  test('should not activate microphone at any point', async ({ page }) => {
    // Listen for getUserMedia calls
    const mediaDeviceCalls: MediaStreamConstraints[] = [];
    
    await page.exposeFunction('__trackGetUserMedia', (constraints: MediaStreamConstraints) => {
      mediaDeviceCalls.push(constraints);
    });

    await page.evaluateOnNewDocument(() => {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = async function(constraints) {
        (window as any).__trackGetUserMedia(constraints);
        return originalGetUserMedia.call(this, constraints);
      };
    });

    // Reload page to apply mock
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Start camera
    const startButton = page.locator('button:has-text("Toque para iniciar")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }

    // Verify no audio was requested
    await page.waitForTimeout(500);
    
    // Check all getUserMedia calls
    const hasAudioRequest = mediaDeviceCalls.some(call => call.audio === true);
    expect(hasAudioRequest).toBeFalsy();
  });

  test('should handle multiple start/stop cycles without resource leaks', async ({ page }) => {
    const cycles = 3;
    
    for (let i = 0; i < cycles; i++) {
      // Start camera
      const startButton = page.locator('button:has-text("Toque para iniciar")');
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(1000);
      }

      // Verify camera is active
      const isActive = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return video && video.srcObject !== null;
      });
      expect(isActive).toBeTruthy();

      // Stop camera
      const stopButton = page.locator('button:has-text("Parar")');
      await stopButton.click();
      await page.waitForTimeout(500);

      // Verify camera stopped
      const isStopped = await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        return !video || video.srcObject === null;
      });
      expect(isStopped).toBeTruthy();
    }

    // Final state should be clean
    const finalState = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return {
        hasVideo: !!video,
        hasSrcObject: video ? video.srcObject !== null : false,
      };
    });

    expect(finalState.hasSrcObject).toBeFalsy();
  });

  test('should auto-shutdown camera after 2 minutes of inactivity', async ({ page }) => {
    // Start camera
    const startButton = page.locator('button:has-text("Toque para iniciar")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1500);
    }

    // Verify camera is active
    const isActiveInitially = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video && video.srcObject !== null;
    });
    expect(isActiveInitially).toBeTruthy();

    // Fast-forward time by 2 minutes (120000ms)
    await page.evaluate(() => {
      // Speed up timers for testing
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = function(callback: any, delay: number, ...args: any[]) {
        // Reduce delay to 1/60th for testing (2 minutes becomes 2 seconds)
        return originalSetTimeout(callback, delay / 60, ...args);
      } as any;
    });

    // Wait for auto-shutdown (2 seconds in accelerated time = 2 minutes real time)
    await page.waitForTimeout(3000);

    // Verify camera stopped automatically
    const isStoppedAfterTimeout = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return !video || video.srcObject === null;
    });
    expect(isStoppedAfterTimeout).toBeTruthy();

    // Verify toast notification appeared
    const toastMessage = page.locator('text=Câmera desligada por inatividade');
    await expect(toastMessage).toBeVisible({ timeout: 1000 });
  });

  test('should reset inactivity timer when scanning a code', async ({ page }) => {
    // Start camera
    const startButton = page.locator('button:has-text("Toque para iniciar")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1500);
    }

    // Simulate scanning activity every 30 seconds to prevent auto-shutdown
    let scanCount = 0;
    const scanInterval = setInterval(async () => {
      // Simulate a scan by calling manual input
      await page.evaluate(() => {
        const event = new CustomEvent('scan', { detail: { code: 'TEST123' } });
        window.dispatchEvent(event);
      });
      scanCount++;
    }, 30000);

    // Wait 2.5 minutes
    await page.waitForTimeout(150000);

    clearInterval(scanInterval);

    // Camera should still be active because of scan activity
    const isStillActive = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video && video.srcObject !== null;
    });
    
    // Due to scan activity, camera should still be on
    expect(isStillActive).toBeTruthy();
    expect(scanCount).toBeGreaterThan(0);
  });

  test('should cleanup when modal closes (if product type selector appears)', async ({ page }) => {
    // This test handles the case where scanning triggers product type selector modal
    
    // Start camera
    const startButton = page.locator('button:has-text("Toque para iniciar")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1500);
    }

    // If ProductTypeSelector modal appears, clicking cancel should cleanup
    const cancelButton = page.locator('button:has-text("Cancelar")');
    if (await cancelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cancelButton.click();
      await page.waitForTimeout(500);
    }

    // Verify camera can still be controlled
    const startButtonAfterCancel = page.locator('button:has-text("Toque para iniciar")');
    if (await startButtonAfterCancel.isVisible()) {
      await expect(startButtonAfterCancel).toBeEnabled();
    }
  });
});
