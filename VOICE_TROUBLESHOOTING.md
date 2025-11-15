# Elizabeth Voice Assistant - Troubleshooting Guide

## Common Issues and Solutions

### ❌ Issue: Elizabeth Not Responding to Wake Word

**Symptoms:**
- You say "Elizabeth" but nothing happens
- No visual response in the UI
- Status stays on "Listening for Elizabeth"

**Solutions:**

1. **Check Microphone Permissions**
   ```
   Chrome: Click lock icon → Site settings → Microphone → Allow
   Firefox: Click info icon → Permissions → Microphone → Allow
   Safari: Settings → Safari → Microphone → Allow
   ```

2. **Test Your Microphone**
   - Open browser console (F12)
   - Look for errors related to microphone
   - Test microphone in other apps to confirm it works

3. **Speak Clearly**
   - Say "Elizabeth" clearly at normal volume
   - Try variations: "Hey Elizabeth", "Hi Elizabeth"
   - Ensure you're close enough to microphone (1-2 feet)

4. **Check Browser Console**
   - Press F12 to open developer tools
   - Look for errors in Console tab
   - Should see: "Wake word detection started"
   - Should see: "Checking transcript for wake word: [your speech]"

5. **Refresh and Retry**
   - Refresh the page (Ctrl+R / Cmd+R)
   - Click "Talk to Elizabeth" again
   - Allow microphone access when prompted

### ❌ Issue: Microphone Permission Denied

**Symptoms:**
- Alert saying "Unable to access microphone"
- Browser doesn't ask for permission
- Microphone icon blocked in address bar

**Solutions:**

1. **Reset Browser Permissions**
   ```
   Chrome:
   1. Click lock icon in address bar
   2. Click "Site settings"
   3. Find Microphone → Select "Allow"
   4. Refresh page

   Firefox:
   1. Click shield/info icon
   2. Click "Connection secure"
   3. More information → Permissions
   4. Microphone → Allow
   5. Refresh page
   ```

2. **Check System Microphone Settings**
   - **Windows**: Settings → Privacy → Microphone → Enable
   - **Mac**: System Preferences → Security & Privacy → Microphone → Allow browser
   - **Linux**: Check PulseAudio/ALSA settings

3. **Use HTTPS**
   - Microphone requires secure connection (HTTPS)
   - localhost works without HTTPS
   - Production must use HTTPS

### ❌ Issue: Can't Hear Elizabeth

**Symptoms:**
- Elizabeth activates but you can't hear her
- Visual feedback shows "Speaking..." but no audio
- Status changes but no sound

**Solutions:**

1. **Check Browser Audio**
   - Unmute the browser tab (look for speaker icon on tab)
   - Check browser isn't muted in system mixer
   - Try playing other audio in browser

2. **Check System Volume**
   - Ensure system volume is up
   - Check audio output device is correct
   - Test with other applications

3. **Check Speech Synthesis**
   - Open browser console (F12)
   - Type: `window.speechSynthesis.speak(new SpeechSynthesisUtterance('test'))`
   - If you hear "test", synthesis works

4. **Browser-Specific**
   - **Firefox**: May need to enable speech synthesis in about:config
   - **Safari**: Check Voice settings in System Preferences
   - **Chrome**: Usually works by default

### ❌ Issue: Voice Commands Not Recognized

**Symptoms:**
- Elizabeth responds to wake word
- But doesn't understand your commands
- Shows transcript but takes no action

**Solutions:**

1. **Wait for Response**
   - Let Elizabeth finish speaking
   - Wait for status to show "Listening..."
   - Then give your command

2. **Use Exact Phrases**
   - "open projects" ✅
   - "show me projects" ❌
   - "code editor" ✅
   - "edit code" ❌

   See [VOICE_QUICK_REFERENCE.md](VOICE_QUICK_REFERENCE.md) for exact commands

3. **Speak Clearly**
   - Normal speaking pace
   - Clear pronunciation
   - Normal volume

4. **Check Conversation Timeout**
   - Conversation stays active for 30 seconds
   - If you wait too long, say "Elizabeth" again

### ❌ Issue: Conversation Ends Too Quickly

**Symptoms:**
- Elizabeth says goodbye suddenly
- Can only give one command
- Conversation times out

**Solutions:**

1. **Speak Within Timeout**
   - You have 30 seconds between commands
   - Don't wait too long to respond
   - Keep conversation flowing

2. **Update Timeout (For Developers)**
   ```javascript
   // In voiceAssistant.js
   this.conversationTimeout = 60000; // 60 seconds
   ```

### ❌ Issue: Works on Desktop, Not on Mobile

**Symptoms:**
- Voice assistant works on computer
- Doesn't work on phone/tablet
- Different behavior on mobile

**Solutions:**

1. **iOS (iPhone/iPad)**
   - Requires iOS 14.5 or later
   - Use Safari browser (best support)
   - May need to tap screen before speaking
   - Some features limited on iOS

2. **Android**
   - Use Chrome browser (recommended)
   - Ensure Chrome has microphone permission
   - Check system microphone settings
   - Should work same as desktop

3. **Mobile Permissions**
   - Check Settings → App Permissions → Chrome → Microphone
   - May need to restart browser after granting permission

### ❌ Issue: Continuous "Failed to start" Error

**Symptoms:**
- Error in console: "Failed to start speech recognition"
- Can't start voice mode
- Recognition won't initialize

**Solutions:**

1. **Close Other Audio Apps**
   - Close apps using microphone (Zoom, Discord, etc.)
   - Only one app can use microphone at a time

2. **Restart Browser**
   - Close all browser windows
   - Restart browser
   - Try again

3. **Check for Browser Updates**
   - Update to latest browser version
   - Chrome/Edge usually best supported

4. **Try Different Browser**
   - Test in Chrome if using Firefox
   - Test in Edge if using Chrome
   - Confirms if browser-specific issue

### ❌ Issue: Wake Word Detection Too Sensitive

**Symptoms:**
- Elizabeth activates randomly
- Triggers on similar-sounding words
- False activations

**Solutions:**

1. **Reduce Background Noise**
   - Use in quiet environment
   - Mute background audio
   - Move away from speakers

2. **Adjust Microphone Sensitivity**
   - Lower microphone input level in system settings
   - Position microphone further away

3. **Use More Specific Phrases**
   - Use "Hey Elizabeth" instead of just "Elizabeth"
   - Longer phrases less likely to false trigger

### ❌ Issue: Wake Word Detection Not Sensitive Enough

**Symptoms:**
- Have to repeat "Elizabeth" many times
- Doesn't detect wake word reliably
- Hit-or-miss activation

**Solutions:**

1. **Improve Audio Quality**
   - Use external microphone if possible
   - Reduce background noise
   - Speak directly toward microphone

2. **Speak More Clearly**
   - Emphasize each syllable: "E-LIZ-A-BETH"
   - Slightly louder than normal
   - Normal pace, don't rush

3. **Check Browser Console**
   - Look for transcripts being captured
   - See what browser is hearing
   - Adjust pronunciation accordingly

## Diagnostic Steps

### Step 1: Browser Support Check

Run in browser console:
```javascript
console.log('Speech Recognition:', 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
console.log('Speech Synthesis:', 'speechSynthesis' in window);
```

Both should return `true`.

### Step 2: Microphone Test

Run in browser console:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('✅ Microphone access granted'))
  .catch(err => console.error('❌ Microphone error:', err));
```

Should see: `✅ Microphone access granted`

### Step 3: Wake Word Detection Test

1. Click "Talk to Elizabeth"
2. Open browser console
3. Say "Elizabeth"
4. Look for these logs:
   ```
   Wake word detection started
   Checking transcript for wake word: elizabeth
   Wake word match found: "elizabeth" in "elizabeth"
   Wake word confirmed! Activating conversation mode.
   ```

### Step 4: Speech Synthesis Test

Run in browser console:
```javascript
const utterance = new SpeechSynthesisUtterance("Testing audio output");
window.speechSynthesis.speak(utterance);
```

Should hear: "Testing audio output"

## Browser-Specific Issues

### Chrome/Edge
- **Best Support**: Full features work
- **Common Issue**: Microphone permissions
- **Solution**: Check site settings, allow microphone

### Firefox
- **Good Support**: Most features work
- **Common Issue**: Speech synthesis voice selection
- **Solution**: Usually works with default voice

### Safari (Desktop)
- **Partial Support**: Basic features work
- **Common Issue**: Wake word detection less reliable
- **Solution**: Use Chrome/Firefox if available

### Safari (iOS)
- **Limited Support**: Some features restricted
- **Common Issue**: Requires user interaction first
- **Solution**: Tap screen, then speak

## Performance Issues

### Slow Response Time

**Solutions:**
- Close other tabs/apps
- Restart browser
- Check system resources
- Test in incognito mode

### High CPU Usage

**Solutions:**
- Normal for speech recognition
- Should stabilize after startup
- If constant high CPU, restart browser

## Getting More Help

### Debug Mode

Enable verbose logging:
```javascript
// Add to browser console
localStorage.setItem('voiceDebug', 'true');
```

Reload page and try again. More detailed logs will appear.

### Report Issue

If issue persists:
1. Open browser console (F12)
2. Click "Talk to Elizabeth"
3. Try to use voice features
4. Copy all console logs
5. Note your browser and OS version
6. Share details for support

### Check Documentation

- [VOICE_ASSISTANT_GUIDE.md](VOICE_ASSISTANT_GUIDE.md) - Full user guide
- [VOICE_QUICK_REFERENCE.md](VOICE_QUICK_REFERENCE.md) - Command reference
- [VOICE_FEATURES.md](VOICE_FEATURES.md) - Technical details

## Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| Not responding | Check microphone permissions, speak clearly |
| Can't hear | Check volume, unmute tab |
| Permission denied | Reset site permissions, refresh |
| Commands not working | Use exact phrases, wait for response |
| Times out | Speak within 30 seconds |
| Mobile issues | Use Chrome (Android) or Safari (iOS) |
| Won't start | Close other audio apps, restart browser |

## Success Checklist

✅ Microphone permissions granted
✅ Browser supports Web Speech API
✅ Audio output working
✅ Quiet environment
✅ Speaking clearly
✅ Using supported browser
✅ HTTPS connection (if not localhost)
✅ No other apps using microphone

If all checked, Elizabeth should respond! 🎙️

---

**Still having issues? Check the browser console for specific error messages and refer to the diagnostic steps above.**
