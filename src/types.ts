export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  status?: string;
  alias: string[];
}

export interface JarvisAction {
  type: 
    | 'send_whatsapp'
    | 'phone_call'
    | 'send_sms'
    | 'toggle_torch'
    | 'toggle_camera'
    | 'set_alarm'
    | 'set_volume'
    | 'set_brightness'
    | 'launch_app'
    | 'arm_telemetry'
    | 'device_routine'
    | 'chat';
  contactName?: string;
  phoneNumber?: string;
  message?: string;
  state?: 'on' | 'off' | 'toggle';
  level?: number;
  appName?: string;
  deepLink?: string;
  routineName?: string;
  autoOpen?: boolean;
  timeStr?: string;
  minutesFromNow?: number;
}

export interface JarvisResponse {
  thoughtProcess: string;
  spokenResponse: string;
  action: JarvisAction;
  armExecutionTrace?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  timestamp: string;
  thoughtProcess?: string;
  action?: JarvisAction;
  armTrace?: string;
}

export interface ArmCpuStats {
  arch: string;
  abi: string;
  model: string;
  cores: number[];
  clockMhz: number;
  tempC: number;
  registers: { [key: string]: string };
  flags: { N: boolean; Z: boolean; C: boolean; V: boolean };
  instructionCount: number;
  neonLoad: number;
  memory32bit: {
    total: number;
    used: number;
    free: number;
    mappedAddress: string;
  };
}

export interface WhatsAppMessage {
  id: string;
  contactName: string;
  phone: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface AlarmItem {
  id: string;
  label: string;
  timeStr: string;
  remainingSeconds: number;
  active: boolean;
}
