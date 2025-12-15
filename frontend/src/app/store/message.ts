import { defineStore } from 'pinia';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

export const useMessageStore = defineStore('message', {
  state: () => ({ text: '' as string, type: 'info' as MessageType, visible: false as boolean }),
  actions: {
    show(text: string, type: MessageType = 'info') { this.text = text; this.type = type; this.visible = true; },
    clear() { this.text = ''; this.visible = false; }
  }
});
