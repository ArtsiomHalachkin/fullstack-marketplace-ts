export interface ChatMessage {
    senderId: string;
    chatRole: string;
    text: string;
    timestamp: Date;
}