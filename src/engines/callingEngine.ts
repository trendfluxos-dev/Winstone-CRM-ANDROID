import { ICallingEngine, IRecordingEngine, CallEngineState } from '../types';

/**
 * Phase 1 MockCallingEngine
 *
 * Explicit simulation implementation. Does NOT establish real telephony,
 * WebRTC peer connections, or SIP trunks. Provides state-driven local call simulation.
 */
export class MockCallingEngine implements ICallingEngine {
  private state: CallEngineState = {
    isActive: false,
    leadId: null,
    phoneNumber: null,
    customerName: null,
    durationSeconds: 0,
    isSimulated: true,
    statusNote: 'Simulation Only — Native Telecom / WebRTC not connected',
  };

  private timer: any = null;
  private listeners: ((state: CallEngineState) => void)[] = [];

  async startCall(phoneNumber: string, leadId: string, customerName: string): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.state = {
      isActive: true,
      leadId,
      phoneNumber,
      customerName,
      durationSeconds: 0,
      isSimulated: true,
      statusNote: 'Connected (Simulation: Telecom not connected)',
    };
    this.notify();

    this.timer = setInterval(() => {
      this.state = {
        ...this.state,
        durationSeconds: this.state.durationSeconds + 1,
      };
      this.notify();
    }, 1000);
  }

  async endCall(): Promise<{ durationSeconds: number }> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const finalDuration = this.state.durationSeconds;
    this.state = {
      isActive: false,
      leadId: null,
      phoneNumber: null,
      customerName: null,
      durationSeconds: 0,
      isSimulated: true,
      statusNote: 'Call Ended (Simulation)',
    };
    this.notify();
    return { durationSeconds: finalDuration };
  }

  getCallState(): CallEngineState {
    return { ...this.state };
  }

  subscribeCallState(listener: (state: CallEngineState) => void): () => void {
    this.listeners.push(listener);
    listener({ ...this.state });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }
}

/**
 * Phase 1 MockRecordingEngine
 *
 * Explicit simulation: Does not capture microphone audio or create fake files.
 * Reports honestly that recording is simulated and hardware capture is disconnected.
 */
export class MockRecordingEngine implements IRecordingEngine {
  private recording = false;

  async startRecording(): Promise<void> {
    this.recording = true;
  }

  async stopRecording(): Promise<{ isSimulated: boolean; notice: string }> {
    this.recording = false;
    return {
      isSimulated: true,
      notice: 'Audio recording simulated — hardware audio capture not connected.',
    };
  }

  getRecordingStatus(): { isRecording: boolean; isSimulated: boolean; statusMessage: string } {
    return {
      isRecording: this.recording,
      isSimulated: true,
      statusMessage: this.recording
        ? 'Simulation active: No audio stored or uploaded'
        : 'Audio engine disconnected',
    };
  }
}
