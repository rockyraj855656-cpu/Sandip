import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Contacts database for realistic phone control & WhatsApp
const DEFAULT_CONTACTS = [
  { name: 'Rohit Sharma', phone: '+919876543210', alias: ['rohit', 'bhai', 'dost'] },
  { name: 'Papa', phone: '+919812345678', alias: ['papa', 'pitaji', 'dad', 'father'] },
  { name: 'Mummy', phone: '+919823456789', alias: ['mummy', 'maa', 'mom', 'mother'] },
  { name: 'Sandip (User)', phone: '+919834567890', alias: ['sandip', 'boss', 'sir', 'self'] },
  { name: 'Priya', phone: '+919845678901', alias: ['priya', 'sister'] },
  { name: 'Office Manager', phone: '+919856789012', alias: ['manager', 'office', 'colleague'] }
];

// Fallback rule-based parser when API key is unavailable or offline
function fallbackJarvisParser(prompt: string) {
  const p = prompt.toLowerCase();
  
  // WhatsApp intent
  if (p.includes('whatsapp') || p.includes('watsp') || p.includes('msg') || p.includes('message')) {
    let target = 'Rohit Sharma';
    let phone = '+919876543210';
    for (const c of DEFAULT_CONTACTS) {
      if (c.alias.some(a => p.includes(a))) {
        target = c.name;
        phone = c.phone;
        break;
      }
    }
    // Extract message if possible
    let msg = 'Hello, Sandip here! Contacting via Jarvis ARMv7.';
    if (p.includes('ki') || p.includes('that') || p.includes(':') || p.includes('bhejo')) {
      const match = prompt.match(/(?:bhejo|likho|send|saying|that|:)\s*["']?([^"']+)["']?/i);
      if (match && match[1]) {
        msg = match[1].trim();
      }
    }
    return {
      thoughtProcess: `Sir chahte hain ki ${target} ko WhatsApp par sandesh bheja jaye. Main 32-bit ARM armeabi-v7a system call SYS_OPEN_URI ke jariye WhatsApp protocol link bana raha hoon. Sandesh: "${msg}".`,
      spokenResponse: `Sir, maine ${target} ke liye WhatsApp message taiyar kar diya hai. Abhi WhatsApp launch kar raha hoon.`,
      action: {
        type: 'send_whatsapp',
        contactName: target,
        phoneNumber: phone,
        message: msg,
        autoOpen: true
      },
      armExecutionTrace: `0x8048120: MOV R0, #0x25      ; INTENT_WHATSAPP\n0x8048124: LDR R1, =str_phone   ; Ptr to ${phone}\n0x8048128: LDR R2, =str_msg     ; Ptr to encoded URI\n0x804812C: BL  android_open_uri ; Branch with link (Thumb-2)`
    };
  }

  // Call intent
  if (p.includes('call') || p.includes('phone') || p.includes('dial') || p.includes('lagao')) {
    let target = 'Rohit Sharma';
    let phone = '+919876543210';
    for (const c of DEFAULT_CONTACTS) {
      if (c.alias.some(a => p.includes(a))) {
        target = c.name;
        phone = c.phone;
        break;
      }
    }
    return {
      thoughtProcess: `Dialer intent detect hua. Target contact: ${target} (${phone}). 32-bit ARM register R0 me dialer intent code load kar phone dialer trigger kar raha hoon.`,
      spokenResponse: `Sir, main ${target} ko call mila raha hoon. Call screen activate ki ja rahi hai.`,
      action: {
        type: 'phone_call',
        contactName: target,
        phoneNumber: phone
      },
      armExecutionTrace: `0x8048200: MOV R0, #0x10      ; INTENT_DIAL_CALL\n0x8048204: LDR R1, =str_phone   ; ${phone}\n0x8048208: SVC #0x80            ; Linux ARMv7 syscall tel:`
    };
  }

  // Camera intent
  if (p.includes('camera') || p.includes('photo') || p.includes('selfie') || p.includes('tasveer')) {
    return {
      thoughtProcess: `Optical camera sensor request received. armeabi-v7a HAL v4l2 device node /dev/video0 probe kiya ja raha hai.`,
      spokenResponse: `Sir, phone ka camera sensor on kar diya hai. Viewfinder screen par active hai.`,
      action: {
        type: 'toggle_camera',
        state: 'on'
      },
      armExecutionTrace: `0x8048300: LDR R0, =/dev/video0 ; V4L2 device node\n0x8048304: MOV R1, #0x02        ; O_RDWR\n0x8048308: SVC #0x05            ; SYS_OPEN on ARMv7`
    };
  }

  // Torch / Flashlight intent
  if (p.includes('torch') || p.includes('flash') || p.includes('light') || p.includes('batti') || p.includes('roshni')) {
    const isOff = p.includes('off') || p.includes('band') || p.includes('bujha');
    return {
      thoughtProcess: `Hardware GPIO torch pin control trigger. State: ${isOff ? 'LOW' : 'HIGH'}. 32-bit memory-mapped I/O register modify ho raha hai.`,
      spokenResponse: isOff ? `Sir, flashlight band kar di gayi hai.` : `Sir, flashlight on kar di gayi hai. Roshni active hai.`,
      action: {
        type: 'toggle_torch',
        state: isOff ? 'off' : 'on'
      },
      armExecutionTrace: `0x8048400: LDR R0, =0x48001000 ; GPIO_BASE_REG\n0x8048404: MOV R1, #${isOff ? '0x00' : '0x01'}        ; Torch Bit\n0x8048408: STR R1, [R0, #0x14]  ; Store to GPIO output`
    };
  }

  // Battery intent
  if (p.includes('battery') || p.includes('charging') || p.includes('charge') || p.includes('power')) {
    return {
      thoughtProcess: `Power management IC (PMIC) query via ARMv7 I2C bus. Battery statistics calculate ho rahe hain.`,
      spokenResponse: `Sir, main power management IC check kar raha hoon. Battery levels normal hain aur system optimize mode me chal raha hai.`,
      action: {
        type: 'device_routine',
        routineName: 'battery_saver'
      },
      armExecutionTrace: `0x8048500: LDR R0, =/sys/class/power_supply/battery/capacity\n0x8048504: BL read_sysfs_int`
    };
  }

  // ARM architecture query
  if (p.includes('arm') || p.includes('cpu') || p.includes('32') || p.includes('architecture') || p.includes('processor')) {
    return {
      thoughtProcess: `ARMv7-A 32-bit hardware query. Cortex-A7 quad-core configuration, VFPv4 FPU aur NEON 128-bit vector engine status inspect kiya ja raha hai.`,
      spokenResponse: `Sir, hamara system 32-bit ARM (armeabi-v7a) architecture par chal raha hai. Isme Thumb-2 instruction set, NEON SIMD vectorization aur 4GB virtual address space active hai.`,
      action: {
        type: 'arm_telemetry',
        highlightRegister: 'R0',
        triggerInstruction: 'VADD.F32 Q0, Q1, Q2 ; NEON Vector Add'
      },
      armExecutionTrace: `0x8048600: MRC p15, 0, R0, c0, c0, 0 ; Read Main ID Register (MIDR)\n0x8048604: AND R1, R0, #0x000F0000  ; Mask ARM Architecture v7`
    };
  }

  return {
    thoughtProcess: `User ne kaha: "${prompt}". Main Jarvis hoon, 32-bit ARM platform par chal raha hoon. Respectful Hindi-English mix me human jaisa jawab de raha hoon.`,
    spokenResponse: `Ji Sir, main aapke aadesh par kaam karne ke liye taiyar hoon. Aap WhatsApp message bhejne, call lagane, camera ya flashlight control karne ya ARMv7 telemetry dekhne ka koi bhi voice command de sakte hain.`,
    action: {
      type: 'chat'
    },
    armExecutionTrace: `0x8048700: NOP ; ARMv7 Idle Thread\n0x8048704: WFI ; Wait For Interrupt`
  };
}

// Jarvis Main Voice & Automation Controller Endpoint
app.post('/api/jarvis/process', async (req, res) => {
  const { userInput, deviceState, conversationHistory } = req.body;
  
  if (!userInput || typeof userInput !== 'string') {
    return res.status(400).json({ error: 'userInput string is required' });
  }

  // If Gemini is available, use Gemini 3.8 Flash for deep human-like bilingual reasoning & function intent
  if (ai) {
    try {
      const systemInstruction = `You are JARVIS (Just A Rather Very Intelligent System), the ultimate personal AI assistant running on a simulated 32-bit ARM (armeabi-v7a) mobile control system.
You speak like a highly intelligent, caring, loyal, and witty human companion (reminiscent of Tony Stark's JARVIS with Indian warmth and respect).
Language Capability: You understand and naturally speak bilingual Hindi, English, and Hinglish.

CRITICAL INSTRUCTIONS:
1. "Soch kar bole" (Think before speaking): You MUST provide a "thoughtProcess" explaining what you think inside your neural cortex before taking action, written naturally like human inner thoughts (in Hinglish/Hindi/English).
2. "WhatsApp per message send karna": When the user asks to send a WhatsApp message (e.g. "Rohit ko WhatsApp karo", "Papa ko message bhejo", "WhatsApp sandesh bhejo"), recognize the target contact, extract the message text, and output an action with type "send_whatsapp", contactName, phoneNumber, and message.
Contacts available:
- Rohit Sharma (+919876543210)
- Papa (+919812345678)
- Mummy (+919823456789)
- Sandip (+919834567890)
- Priya (+919845678901)
- Office Manager (+919856789012)
If someone else is mentioned, use "+919800000000" or a parsed number.
3. "Mobile ka har ek kaam karna": Support controlling camera (toggle_camera), flashlight/torch (toggle_torch), phone calls (phone_call), alarms/timers (set_alarm), volume/brightness, app launching (launch_app: youtube, maps, chrome, etc.), and phone routines (morning, night, battery_saver, security_check).
4. "CPU architecture: 32-bit ARM (armeabi-v7a)": You are fully aware you run on 32-bit ARM (armeabi-v7a) with NEON SIMD and Thumb-2. In "armExecutionTrace", generate 3-4 lines of simulated ARMv7 assembly instructions corresponding to the action (e.g., LDR, MOV, SVC, BL, STR).
5. Always address the user respectfully as "Sir" or "Boss".
6. Always output valid JSON strictly conforming to the requested schema.`;

      const promptText = `User Command: "${userInput}"
Current Device State: ${JSON.stringify(deviceState || {})}
Recent Context: ${JSON.stringify(conversationHistory?.slice(-3) || [])}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              thoughtProcess: {
                type: Type.STRING,
                description: 'Jarvis inner thoughts in Hinglish/English pondering the command, checking context, and deciding how to help.'
              },
              spokenResponse: {
                type: Type.STRING,
                description: 'What Jarvis says out loud in natural, warm, human-like Hindi/Hinglish/English.'
              },
              action: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: 'One of: send_whatsapp, phone_call, send_sms, toggle_torch, toggle_camera, set_alarm, set_volume, set_brightness, launch_app, arm_telemetry, device_routine, chat'
                  },
                  contactName: { type: Type.STRING },
                  phoneNumber: { type: Type.STRING },
                  message: { type: Type.STRING },
                  state: { type: Type.STRING },
                  level: { type: Type.NUMBER },
                  appName: { type: Type.STRING },
                  deepLink: { type: Type.STRING },
                  routineName: { type: Type.STRING },
                  autoOpen: { type: Type.BOOLEAN }
                },
                required: ['type']
              },
              armExecutionTrace: {
                type: Type.STRING,
                description: 'Simulated 32-bit ARM assembly instructions (armeabi-v7a) representing this action at the kernel/HAL level.'
              }
            },
            required: ['thoughtProcess', 'spokenResponse', 'action', 'armExecutionTrace']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to local engine:', err?.message);
      const fallback = fallbackJarvisParser(userInput);
      return res.json(fallback);
    }
  } else {
    const fallback = fallbackJarvisParser(userInput);
    return res.json(fallback);
  }
});

// Autonomous proactive self-thought endpoint ("khud se soch kar bole")
app.post('/api/jarvis/autonomous-thought', async (req, res) => {
  const { deviceState, idleSeconds } = req.body;

  if (ai) {
    try {
      const prompt = `You are JARVIS on 32-bit ARM armeabi-v7a. The user has been quiet for ${idleSeconds || 30} seconds.
Device state: Battery ${deviceState?.batteryLevel || 68}%, Charging: ${deviceState?.isCharging || false}, Torch: ${deviceState?.torchOn || false}, Camera: ${deviceState?.cameraActive || false}.
Generate a spontaneous, human-like proactive thought and short audio line in natural Hindi/Hinglish to speak to Sir.
For example, reminding about WhatsApp messages, battery condition, checking security, or offering assistance.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are Jarvis. Output JSON with { "thoughtProcess": string, "spokenResponse": string, "suggestedAction": string }',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              thoughtProcess: { type: Type.STRING },
              spokenResponse: { type: Type.STRING },
              suggestedAction: { type: Type.STRING }
            },
            required: ['thoughtProcess', 'spokenResponse', 'suggestedAction']
          }
        }
      });

      return res.json(JSON.parse(response.text || '{}'));
    } catch (e: any) {
      // Fallback
    }
  }

  // Proactive spontaneous thought templates
  const templates = [
    {
      thought: `Main background telemetries monitor kar raha hoon. 32-bit ARM cores normal 42°C par hain. Sandip sir se puchte hain agar koi WhatsApp task execute karna hai.`,
      spoken: `Sir, sabhi ARMv7 systems steady hain. Kya aapko kisi ko WhatsApp sandesh bhejna hai ya call milani hai?`,
      action: `send_whatsapp`
    },
    {
      thought: `Power management sub-routine: Battery monitor kiya. Level theek hai, memory 32-bit address space 62% free hai.`,
      spoken: `Sir, maine device diagnostics run kiye hain. Battery aur memory performance bilkul optimal hai.`,
      action: `device_routine`
    },
    {
      thought: `Rohit ka message queue check ho raha hai. WhatsApp connector standby par hai.`,
      spoken: `Sir, WhatsApp connector standby par hai. Agar Rohit ya Papa ko message dena ho toh bas aadesh karein.`,
      action: `send_whatsapp`
    }
  ];

  const pick = templates[Math.floor(Math.random() * templates.length)];
  return res.json({
    thoughtProcess: pick.thought,
    spokenResponse: pick.spoken,
    suggestedAction: pick.action
  });
});

// Serve frontend in production or via Vite middlewares in development
async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JARVIS ARMv7 Server listening on port ${PORT}`);
  });
}

startServer();
